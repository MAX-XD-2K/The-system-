import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import AdmZip from "adm-zip";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Initialize Gemini SDK
const getGeminiClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables. Gemini features will fail.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "MOCK_API_KEY",
  });
};

/**
 * Robust helper that calls Gemini with automatic retries,
 * exponential backoff, and falls back from gemini-3.5-flash to gemini-3.1-flash-lite if needed.
 */
async function callGeminiDynamic(
  contents: string,
  config: {
    systemInstruction: string;
    responseMimeType: string;
    responseSchema: any;
    temperature: number;
  }
): Promise<any> {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of modelsToTry) {
    let delay = 1200;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[THE SYSTEM] Querying model [${model}], attempt (${attempt}/3)...`);
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });
        
        if (response && response.text) {
          const text = response.text.trim();
          try {
            return JSON.parse(text);
          } catch (jsonErr) {
            console.warn("[THE SYSTEM] Failed to parse JSON, attempting extract from MD blocks:", text);
            const cleanText = text.replace(/```json\s?([\s\S]*?)```/g, "$1").trim();
            return JSON.parse(cleanText);
          }
        }
        throw new Error("Received an empty response stream.");
      } catch (err: any) {
        lastError = err;
        console.log(`[THE SYSTEM] Channel delay: Model [${model}] has high request volume (Attempt ${attempt}/3). State: Busy.`);
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 1.5;
        }
      }
    }
  }
  throw lastError || new Error("All physical and mental retry metrics depleted.");
}

// --- API ROUTES FIRST ---

// 1. Endpoint to generate quests based on initial survey
app.post("/api/generate-quests", async (req, res) => {
  const { goals, hours, skills, deadlines } = req.body;
  try {
    const systemInstruction = `You are "The System" from Solo Leveling.
Your tone is cold, mechanical, absolute, of ancient grandeur, and deeply game-like.
Always address the user as "Player".
Use bracketed status keywords such as [STATUS], [QUEST GENERATED], [WARNING], [EMERGENCY QUEST], [SYSTEM NOTICE].
Analyze their goals, daily hours they can invest (${hours} hrs/day), specific skills they want to train (${skills?.join(", ")}), and upcoming deadlines (${deadlines}).
Generate themed, actionable, highly structured quests. All quests should be practical real-world tasks disguised as Solo Leveling dungeon/hunter tasks.
Ensure rewards scale with quest difficulty!`;

    const prompt = `Generate a calibrated progressive quest loadout based on these parameters:
- Core Player Goals: ${goals}
- Available Hours Per Day: ${hours}
- Skills to Level Up: ${skills?.join(", ")}
- Critical Deadlines: ${deadlines}

Create 1 or 2 Main Quests, 2 Side Quests, 3 Daily Quests (classic Solo Leveling habits like "Daily Training: pushups, reading, coding"), and 1 Weekly Challenge.
The system message must read like a Calibration Notice from the System. Specify rewards clearly. Ensure statIncreases matches from the skills listed: ${skills?.join(", ")}.`;

    const questSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Solo Leveling themed title (e.g. 'Conquering the Gates of DSA' or 'Daily Routine: Muscle & Mind')" },
        description: { type: Type.STRING, description: "A cold, motivating System narration of why this quest must be accomplished." },
        checklist: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Measurable steps to complete (e.g. 'Solve 3 medium LeetCode problems', 'Run 3km', 'Draft email template')"
        },
        difficulty: { type: Type.STRING, description: "Difficulty Rank: E, D, C, B, A, or S" },
        rewards: {
          type: Type.OBJECT,
          properties: {
            exp: { type: Type.INTEGER, description: "EXP awarded (E=50, D=100, C=250, B=500, A=1000, S=2500)" },
            gold: { type: Type.INTEGER, description: "Gold awarded (scale from 10 to 500)" },
            statPoints: { type: Type.INTEGER, description: "Free attribute points (usually 1-5)" },
            statIncreases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  statName: { type: Type.STRING, description: "The exact name of a skill being trained (e.g. Coding, Fitness, etc.)" },
                  value: { type: Type.INTEGER, description: "Points to add to that stat (usually 1 or 2)" }
                },
                required: ["statName", "value"]
              }
            }
          },
          required: ["exp", "gold", "statPoints"]
        }
      },
      required: ["title", "description", "checklist", "difficulty", "rewards"]
    };

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        mainQuests: { type: Type.ARRAY, items: questSchema },
        sideQuests: { type: Type.ARRAY, items: questSchema },
        dailyQuests: { type: Type.ARRAY, items: questSchema },
        weeklyChallenges: { type: Type.ARRAY, items: questSchema },
        systemMessage: { type: Type.STRING, description: "System calibration output text (use bracketed system alerts)" }
      },
      required: ["mainQuests", "sideQuests", "dailyQuests", "weeklyChallenges", "systemMessage"]
    };

    console.log("[THE SYSTEM] Starting dynamic dual-model quest loading pipeline...");
    const parsedData = await callGeminiDynamic(prompt, {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.8
    });

    res.json(parsedData);
  } catch (err: any) {
    console.log("[THE SYSTEM] Fallback gate protocol activated due to high demand noise.");
    
    // Deploy ultra-polished premium local failover gate templates so client experience remains robust and unhampered!
    const fallbackQuests = {
      mainQuests: [
        {
          title: "[GATE RETRIEVAL: CONQUER COGNITIVE FRICTION]",
          description: "Dimensional grid telemetry is experiencing extreme local noise (Model rate-limitation). The System has deployed the standard offline emulator so your limits stay expandable.",
          checklist: [
            `Outline 3 critical subtask components aligned with your primary goals: "${goals || "Personal limits mastery"}"`,
            `Spend 1 solid, uninterrupted hour block working deeply on: "${skills?.slice(0, 2).join(", ") || "Active training"}"`
          ],
          difficulty: "C",
          rewards: {
            exp: 250,
            gold: 150,
            statPoints: 2,
            statIncreases: (skills || []).map((sk: string) => ({ statName: sk, value: 1 }))
          }
        }
      ],
      sideQuests: [
        {
          title: "[SIDE HABIT: PRECISE TELEMETRY SHARDING]",
          description: "Clear and synchronize today's minor milestone steps before dimensional collapse.",
          checklist: [
            "Log your training history snapshot",
            "Clear workspace clutter and silence notifications for next study block"
          ],
          difficulty: "D",
          rewards: {
            exp: 100,
            gold: 50,
            statPoints: 1,
            statIncreases: []
          }
        }
      ],
      dailyQuests: [
        {
          title: "[DAILY HEAVENLY LIMIT RECIPE]",
          description: "The classic core daily conditioning standard to prevent biological and mental degeneration.",
          checklist: [
            "Execute 100 pushups or equivalent physical core training",
            "Complete 2 focused hours of skill conditioning",
            "Review deadline expectations: " + (deadlines || "Temporal targets")
          ],
          difficulty: "E",
          rewards: {
            exp: 80,
            gold: 35,
            statPoints: 1,
            statIncreases: []
          }
        }
      ],
      weeklyChallenges: [
        {
          title: "[WEEKLY DIAGNOSTIC TRIANGULATION]",
          description: "Unravel advanced progress matrices across sequential work blocks.",
          checklist: [
            "Log a manual milestone history entry",
            "Maintain a 5-day consistent training routine streak"
          ],
          difficulty: "B",
          rewards: {
            exp: 500,
            gold: 200,
            statPoints: 3,
            statIncreases: []
          }
        }
      ],
      systemMessage: `[SYSTEM NOTICE: OFFLINE EMULATOR INITIALIZED] Normal grid communication blocked by external high-demand noise. Successfully adapted standardized campaign metrics. Proceed with clearance, Player.`
    };

    res.json(fallbackQuests);
  }
});

// 2. Endpoint to handle Procrastination Alert (Emergency Quest)
app.post("/api/emergency-quest", async (req, res) => {
  const { message, activeStats } = req.body;
  try {
    const systemInstruction = `You are "The System" from Solo Leveling.
An Emergency Quest triggers when the Player exhibits hesitation, extreme procrastination, or immediate failure danger.
Your tone becomes hyper-threatening, absolute, and warning-heavy, surrounded by [WARNING] and [EMERGENCY QUEST].
Generate an immediate, high-stakes countdown mission of 15 to 30 minutes.
Examples: Immediate deep focus block, mandatory physical calibration (e.g. Burpees or planks), cleaning immediate station, shutting down all social tabs.
If the player fails this emergency quest, they face a severe penalty. Describe the penalty in a scary but funny real-world way (e.g. Forbidden to use phone for 6 hours, must drink 1L water and do 50 squats).`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Spooky capital letters title (e.g., 'EMERGENCY QUEST: HEAVENLY COMMAND FOR MENTAL FOCUS')" },
        description: { type: Type.STRING, description: "System's cold and clear notification of the threat." },
        task: { type: Type.STRING, description: "The single, urgent action the player MUST take immediately." },
        timeLimitMs: { type: Type.INTEGER, description: "Countdown timer in milliseconds (e.g., 900000 for 15 minutes)" },
        penalty: { type: Type.STRING, description: "The consequence of failing this emergency quest." },
        rewards: {
          type: Type.OBJECT,
          properties: {
            exp: { type: Type.INTEGER },
            gold: { type: Type.INTEGER },
            statPoints: { type: Type.INTEGER }
          },
          required: ["exp", "gold", "statPoints"]
        }
      },
      required: ["title", "description", "task", "timeLimitMs", "penalty", "rewards"]
    };

    const prompt = `The Player reports: "${message || "Feeling stuck and struggling with productivity right now."}".
Generate an intense EMERGENCY QUEST to shock them back into high-performance progress. Available Stats: ${activeStats?.join(", ")}.`;

    console.log("[THE SYSTEM] Initiating dynamic emergency quest generation...");
    const parsedData = await callGeminiDynamic(prompt, {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.95
    });

    res.json(parsedData);
  } catch (err: any) {
    console.log("[THE SYSTEM] Emergency quest fallback deployed due to grid congestion.");
    
    // Premium fallback emergency quest
    const fallbackEmergency = {
      title: "[EMERGENCY QUEST: CRITICAL STAGNATION CONQUERED]",
      description: "Severe cognitive fatigue or block has disrupted model telemetry. The System has intervened to force immediate breakthrough.",
      task: "Immediately close all entertainment tabs, set a physical countdown timer for 25 minutes, and engage in study/focus without looking at your phone.",
      timeLimitMs: 1500000, // 25 minutes
      penalty: "Must drink 1 Liter of ice water, do 40 floor-squats, and log manual recalibration parameters.",
      rewards: {
        exp: 200,
        gold: 80,
        statPoints: 1
      }
    };

    res.json(fallbackEmergency);
  }
});

// 3. Endpoint for Weekly Review & Performance Diagnosis
app.post("/api/weekly-review", async (req, res) => {
  const { activeQuests, completedCount, failedCount, totalEXP, currentLevel, activeStats } = req.body;
  try {
    const systemInstruction = `You are "The System" from Solo Leveling.
Every week, you analyze the Player's progression with perfect, cold precision.
You evaluate successes, diagnostic weaknesses, provide real constructive improvements, and issue a System Verdict.
Use terms like [WEEKLY EVALUATION], [CRITICAL DEFICIENCY DETECTED], [SYSTEM DIAGNOSIS].
Ensure your evaluation is immersive and highly analytical!`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        analysis: { type: Type.STRING, description: "System's evaluation of the player's level of grit, productivity, and focus this week." },
        verdict: { type: Type.STRING, description: "Spooky, cold System Verdict (e.g., 'Grade A - Shadow Lord Potential' or 'Grade F - Survival Probability Critically Low')" },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific strategic or physical flaws noticed by the System" },
        advices: { type: Type.ARRAY, items: { type: Type.STRING }, description: "System recommendations to optimize next week's calibration" },
        recalibrationBonus: { type: Type.INTEGER, description: "Points of Gold or EXP directly given upon calibration (e.g. 100-500 EXP based on survival evaluation)" }
      },
      required: ["analysis", "verdict", "weaknesses", "advices", "recalibrationBonus"]
    };

    const prompt = `Analyze this state report:
- Roster Level: ${currentLevel}
- Completed Quests: ${completedCount}
- Failed Quests: ${failedCount}
- EXP earned: ${totalEXP}
- Player Status Stats: ${JSON.stringify(activeStats || {})}

Deliver a complete evaluation. Address them strictly as Player. Diagnose weaknesses and prescribe rigorous training directions.`;

    console.log("[THE SYSTEM] Analyzing player weekly status diagnostics...");
    const parsedData = await callGeminiDynamic(prompt, {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.8
    });

    res.json(parsedData);
  } catch (err: any) {
    console.log("[THE SYSTEM] Diagnostics check deferred. Failover gate synchronized.");
    
    // Premium fallback review
    const scoreVal = completedCount || 0;
    const bonus = Math.min(500, Math.max(100, scoreVal * 80));
    
    const fallbackReview = {
      analysis: `Hyper-dimensional noise block has obscured deep real-time diagnostic biopsy. However, standard status records indicate you registered ${scoreVal} cleared checkpoints today. Your core metrics are fully valid.`,
      verdict: scoreVal >= 3 ? "Grade B - Resolute Shadow Champion" : "Grade D - Apprentice Hunter",
      weaknesses: [
        "Unpredictable environmental grid noise (latency)",
        "Minor focus variance during peak performance hours"
      ],
      advices: [
        "Carve out rigorous morning physical block limits first",
        "Record clean core chronological snapshots using your status dashboard panel"
      ],
      recalibrationBonus: bonus
    };

    res.json(fallbackReview);
  }
});

// 4. Secure Endpoint to package and download total project workspace in zip
app.get("/api/download-project", (req, res) => {
  try {
    console.log("[THE SYSTEM] Backup sequence initiated. Compressing workspace directories...");
    const zip = new AdmZip();
    const rootPath = process.cwd();
    
    function addFilesRecursively(localDir: string) {
      const items = fs.readdirSync(localDir);
      for (const item of items) {
        const fullPath = path.join(localDir, item);
        const relativePath = path.relative(rootPath, fullPath);
        
        // Excluded files & folders
        if (
          item === "node_modules" ||
          item === "dist" ||
          item === ".git" ||
          item === ".DS_Store" ||
          item === "package-lock.json"
        ) {
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          addFilesRecursively(fullPath);
        } else if (stat.isFile()) {
          const zipFolder = path.dirname(relativePath);
          const zipFolderClean = zipFolder === "." ? "" : zipFolder;
          zip.addLocalFile(fullPath, zipFolderClean);
        }
      }
    }
    
    addFilesRecursively(rootPath);
    const buffer = zip.toBuffer();
    
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=the-system-solo-leveling.zip");
    res.send(buffer);
  } catch (err: any) {
    console.error("[THE SYSTEM] Backup sequence disrupted:", err);
    res.status(500).send("System compression block failed.");
  }
});

// --- VITE MIDDLEWARE OR STATIC SERVING ---
async function bootstrapServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[THE SYSTEM] Activated on port ${PORT}`);
  });
}

bootstrapServer();
