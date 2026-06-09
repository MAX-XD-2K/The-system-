import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, 
  Sparkles, 
  Swords, 
  Trophy, 
  User, 
  Plus, 
  Check, 
  Trash2, 
  X, 
  Volume2, 
  VolumeX, 
  Clock, 
  AlertTriangle, 
  ExternalLink, 
  CheckSquare, 
  PlusCircle, 
  TrendingUp, 
  HelpCircle, 
  Flame, 
  RotateCcw,
  BookOpen,
  Calendar,
  Zap,
  ChevronRight,
  TrendingDown,
  Info,
  Terminal,
  Cpu,
  Download
} from "lucide-react";
import { PlayerStats, Quest, EmergencyQuestState, WeeklyReviewReport, ChecklistItem, Reward, ProgressHistoryEntry } from "./types";
import { playClick, playLevelUp, playQuestComplete, playEmergencyQuestAlert, playSystemNotice, setSoundEnabled, getSoundEnabled } from "./utils/sound";
import InitialCalibration from "./components/InitialCalibration";

const STORAGE_KEY_STATS = "the_system_player_stats";
const STORAGE_KEY_QUESTS = "the_system_quests";
const STORAGE_KEY_SURVEY = "the_system_survey_data";
const STORAGE_KEY_EMERGENCY = "the_system_emergency_quest";
const STORAGE_KEY_REVIEWS = "the_system_weekly_reviews";
const STORAGE_KEY_PROGRESS_HISTORY = "the_system_progress_history";

const DEFAULT_ACHIEVEMENTS = [
  { id: "awakening", name: "[THE AWAKENING]", description: "Begin Calibration with the System", unlocked: true, goldReward: 100 },
  { id: "level_5", name: "[SURPASSING MORTALITY]", description: "Reach Level 5", unlocked: false, goldReward: 300 },
  { id: "level_15", name: "[SHADOW COMMANDER]", description: "Reach Level 15", unlocked: false, goldReward: 750 },
  { id: "rank_S", name: "[S-RANK ASCENSION]", description: "Achieve S-Rank standing", unlocked: false, goldReward: 1500 },
  { id: "quest_5", name: "[HUNTER'S EXPERIENCE]", description: "Complete and claim 5 Quests", unlocked: false, goldReward: 250 },
  { id: "quest_20", name: "[MONARCH'S GRIT]", description: "Complete and claim 20 Quests", unlocked: false, goldReward: 1000 },
  { id: "emergency_survivor", name: "[DEFIER OF DEATH]", description: "Survive and conquer an Emergency Quest", unlocked: false, goldReward: 400 },
  { id: "gold_master", name: "[KING'S CORES]", description: "Accumulate 2,500 Gold credits", unlocked: false, goldReward: 500 }
];

const INITIAL_STATS: PlayerStats = {
  name: "maansgh21",
  level: 1,
  exp: 0,
  gold: 250,
  rank: "E",
  statPoints: 0,
  customStats: {
    Coding: 13,
    DSA: 10,
    Fitness: 11,
    Discipline: 15,
    Learning: 12
  },
  titles: ["Mortal Recruit", "The One Who Overcame Adversity"],
  activeTitle: "Mortal Recruit",
  achievements: DEFAULT_ACHIEVEMENTS
};

// Original Daily Habit Training from Solo Leveling
const INITIAL_DAILY_HABITS = [
  { id: "pushups", text: "100 Push-ups (or physical core calibration)", completed: false },
  { id: "situps", text: "100 Sit-ups (or posture posture reset)", completed: false },
  { id: "squats", text: "100 Squats (or legs & mobility alignment)", completed: false },
  { id: "running", text: "10km Run (or 45 minutes zone-2 aerobic focus)", completed: false }
];

// Automatically distribute stat points to the lowest custom stats (or the single lowest stat) to cultivate balance
function autoDistributePoints(customStats: { [key: string]: number }, amount: number): { [key: string]: number } {
  const statsCopy = { ...customStats };
  const keys = Object.keys(statsCopy);
  if (keys.length === 0) return statsCopy;

  for (let i = 0; i < amount; i++) {
    let minKey = keys[0];
    let minVal = statsCopy[minKey];
    for (let j = 1; j < keys.length; j++) {
      const key = keys[j];
      if (statsCopy[key] < minVal) {
        minVal = statsCopy[key];
        minKey = key;
      }
    }
    statsCopy[minKey] += 1;
  }
  return statsCopy;
}

// Add awarded stat points to a single targeted custom stat to encourage deep specialized mastery
function addPointsToSpecificStat(customStats: { [key: string]: number }, statKey: string, amount: number): { [key: string]: number } {
  const statsCopy = { ...customStats };
  const keys = Object.keys(statsCopy);
  if (keys.length === 0) return statsCopy;

  const foundKey = keys.find((k) => k.toLowerCase() === statKey.toLowerCase());
  const actualKey = foundKey || keys[0]; // fallback to first key if not found
  if (actualKey) {
    statsCopy[actualKey] += amount;
  }
  return statsCopy;
}

// Dynamically analyze quest parameters to identify the unique custom stat associated with it
function findRelatedStatForQuest(quest: any, customStats: { [key: string]: number }): string {
  if (quest.relatedStat && customStats[quest.relatedStat] !== undefined) {
    return quest.relatedStat;
  }
  
  if (quest.rewards?.statIncreases && quest.rewards.statIncreases.length > 0) {
    const statName = quest.rewards.statIncreases[0].statName;
    const foundKey = Object.keys(customStats).find(
      (k) => k.toLowerCase() === statName.toLowerCase()
    );
    if (foundKey) return foundKey;
  }

  const textToSearch = `${quest.title} ${quest.description}`.toLowerCase();
  const keys = Object.keys(customStats);
  
  for (const key of keys) {
    if (textToSearch.includes(key.toLowerCase())) {
      return key;
    }
  }

  const keywords: { [key: string]: string[] } = {
    Coding: ["code", "coding", "react", "github", "js", "ts", "python", "javascript", "typescript", "css", "html", "api", "backend", "frontend", "programming", "software", "dev"],
    DSA: ["dsa", "leetcode", "algorithm", "data structure", "tree", "binary", "graph", "sort", "search", "complexity", "big o", "recursion", "array"],
    Fitness: ["fitness", "gym", "run", "running", "squat", "pushup", "workout", "physical", "exercise", "cardio", "stretching", "lift", "training", "healthy"],
    Discipline: ["discipline", "wake", "morning", "habit", "schedule", "routine", "planner", "organize", "bedtime", "sleep", "water", "clean", "hygiene"],
    Learning: ["learning", "learn", "study", "read", "book", "course", "video", "tutorial", "skill", "lecture", "note", "research", "understanding"]
  };

  for (const [key, words] of Object.entries(keywords)) {
    if (keys.includes(key)) {
      for (const word of words) {
        if (textToSearch.includes(word)) {
          return key;
        }
      }
    }
  }

  for (const key of keys) {
    const splitKey = key.toLowerCase().split(/\s+/);
    for (const word of splitKey) {
      if (word.length > 3 && textToSearch.includes(word)) {
        return key;
      }
    }
  }

  if (customStats["Discipline"] !== undefined) return "Discipline";
  return keys[0] || "Discipline";
}

export default function App() {
  // Core System States
  const [survey, setSurvey] = useState<any | null>(null);
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [emergency, setEmergency] = useState<EmergencyQuestState | null>(null);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReviewReport[]>([]);
  const [soundOn, setSoundOn] = useState<boolean>(true);

  // UI Navigation / Tab Control
  const [systemBooted, setSystemBooted] = useState<boolean>(false);
  const [bootStep, setBootStep] = useState<number>(0);
  const [activeQuestTab, setActiveQuestTab] = useState<"main" | "side" | "daily" | "weekly">("daily");
  const [currentUtcTime, setCurrentUtcTime] = useState<string>("");
  const [showLevelUpModal, setShowLevelUpModal] = useState<{ active: boolean; prevStats?: any; nextStats?: any }>({ active: false });
  const [systemAlertMessage, setSystemAlertMessage] = useState<string | null>(null);
  
  // Custom Quest Generation Creator Panel
  const [showQuestCreator, setShowQuestCreator] = useState(false);
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestDesc, setNewQuestDesc] = useState("");
  const [newQuestDifficulty, setNewQuestDifficulty] = useState<"E" | "D" | "C" | "B" | "A" | "S">("D");
  const [newQuestCategory, setNewQuestCategory] = useState<"main" | "side" | "daily" | "weekly">("side");
  const [newQuestTasksText, setNewQuestTasksText] = useState("");
  const [newQuestRelatedStat, setNewQuestRelatedStat] = useState<string>("Discipline");

  // Emergency Input
  const [showEmergencyTrigger, setShowEmergencyTrigger] = useState(false);
  const [procrastinationIssue, setProcrastinationIssue] = useState("");
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  // Weekly Diagnostics Terminal
  const [showEvaluationReport, setShowEvaluationReport] = useState<WeeklyReviewReport | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);

  // Shadow Leveling Classic Daily Grid state
  const [dailyHabits, setDailyHabits] = useState(INITIAL_DAILY_HABITS);

  // Growth & Progression History Systems
  const [progressHistory, setProgressHistory] = useState<ProgressHistoryEntry[]>([]);
  const [showProgressHistoryModal, setShowProgressHistoryModal] = useState<boolean>(false);

  // Load state from LocalStorage on mount
  useEffect(() => {
    try {
      const storedSurvey = localStorage.getItem(STORAGE_KEY_SURVEY);
      if (storedSurvey) {
        setSurvey(JSON.parse(storedSurvey));
      }

      const storedHistory = localStorage.getItem(STORAGE_KEY_PROGRESS_HISTORY);
      let loadedHistory: ProgressHistoryEntry[] = [];
      if (storedHistory) {
        loadedHistory = JSON.parse(storedHistory);
        setProgressHistory(loadedHistory);
      }

      const storedStats = localStorage.getItem(STORAGE_KEY_STATS);
      if (storedStats) {
        const parsedStats = JSON.parse(storedStats);
        setStats(parsedStats);

        // Record on-mount login link synchronization
        const lastEntry = loadedHistory[0];
        const nowMs = Date.now();
        const lastMs = lastEntry ? new Date(lastEntry.timestamp).getTime() : 0;

        // Skip adding another login event if the last event was recorded in the last 10 minutes to avoid clutter
        if (!lastEntry || (nowMs - lastMs > 10 * 60 * 1000)) {
          const currentHabits = localStorage.getItem("the_system_daily_habits");
          const habitsCount = currentHabits ? JSON.parse(currentHabits).filter((h: any) => h.completed).length : 0;
          const currentQuests = localStorage.getItem(STORAGE_KEY_QUESTS);
          const questsCount = currentQuests ? JSON.parse(currentQuests).filter((q: any) => q.claimed).length : 0;

          const loginEntry: ProgressHistoryEntry = {
            id: `history_${nowMs}_login`,
            timestamp: new Date().toISOString(),
            level: parsedStats.level,
            exp: parsedStats.exp,
            gold: parsedStats.gold,
            customStats: { ...parsedStats.customStats },
            completedQuestsCount: questsCount,
            completedHabitsCount: habitsCount,
            type: "login",
            message: `Chrono feedback synchronized. Biometric connection active for Player ${parsedStats.name || "maansgh21"}.`
          };
          const updatedHistory = [loginEntry, ...loadedHistory].slice(0, 50);
          setProgressHistory(updatedHistory);
          localStorage.setItem(STORAGE_KEY_PROGRESS_HISTORY, JSON.stringify(updatedHistory));
        }
      }

      const storedQuests = localStorage.getItem(STORAGE_KEY_QUESTS);
      if (storedQuests) {
        setQuests(JSON.parse(storedQuests));
      }

      const storedEmergency = localStorage.getItem(STORAGE_KEY_EMERGENCY);
      if (storedEmergency) {
        setEmergency(JSON.parse(storedEmergency));
      }

      const storedReviews = localStorage.getItem(STORAGE_KEY_REVIEWS);
      if (storedReviews) {
        setWeeklyReviews(JSON.parse(storedReviews));
      }

      const storedSound = localStorage.getItem("the_system_sound_enabled");
      if (storedSound !== null) {
        const soundEnabled = storedSound === "true";
        setSoundOn(soundEnabled);
        setSoundEnabled(soundEnabled);
      }

      const storedHabits = localStorage.getItem("the_system_daily_habits");
      if (storedHabits) {
        setDailyHabits(JSON.parse(storedHabits));
      }
    } catch (e) {
      console.error("Failed to parse LocalStorage data", e);
    }

    playSystemNotice();
  }, []);

  // Sync state changes back to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_QUESTS, JSON.stringify(quests));
  }, [quests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SURVEY, JSON.stringify(survey));
  }, [survey]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EMERGENCY, JSON.stringify(emergency));
  }, [emergency]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(weeklyReviews));
  }, [weeklyReviews]);

  useEffect(() => {
    localStorage.setItem("the_system_daily_habits", JSON.stringify(dailyHabits));
  }, [dailyHabits]);

  // Real-time Clock display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentUtcTime(now.toLocaleString("en-US", { hour12: false }));
    };
    updateTime();
    const timerId = setInterval(updateTime, 1000);
    return () => clearInterval(timerId);
  }, []);

  // System Welcome Boot Sequence Ticker
  useEffect(() => {
    if (!systemBooted && bootStep < 5) {
      const delay = bootStep === 0 ? 400 : 700;
      const timer = setTimeout(() => {
        setBootStep((prev) => prev + 1);
        if (soundOn) {
          playClick();
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [bootStep, systemBooted, soundOn]);

  // Emergency Timer Countdown Ticker
  useEffect(() => {
    if (!emergency || !emergency.active) return;

    const intervalId = setInterval(() => {
      setEmergency((prev) => {
        if (!prev || !prev.active) {
          clearInterval(intervalId);
          return prev;
        }

        const remaining = prev.timeRemainingMs - 1000;
        if (remaining <= 0) {
          // Play Emergency Failed Sound and set inactive
          clearInterval(intervalId);
          triggerSystemAlert("[WARNING: PENALTY PROTOCOL INITIATED]", `You failed to complete the emergency task on time! Penalty: ${prev.penalty}`);
          return {
            ...prev,
            timeRemainingMs: 0,
            active: false
          };
        }

        return {
          ...prev,
          timeRemainingMs: remaining
        };
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [emergency?.active]);

  const toggleSound = () => {
    const nextState = !soundOn;
    setSoundOn(nextState);
    setSoundEnabled(nextState);
    localStorage.setItem("the_system_sound_enabled", String(nextState));
    playClick();
  };

  const triggerSystemAlert = (title: string, message: string) => {
    playSystemNotice();
    setSystemAlertMessage(`${title}\n\n${message}`);
  };

  const addHistoryEntry = (
    type: "login" | "milestone" | "quest_cleared" | "level_up" | "calibration",
    message: string,
    overrideStats?: PlayerStats
  ) => {
    // We pass overrideStats during state transitions so we don't fetch stale stats state
    const currentStats = overrideStats || stats;
    const activeStats = { ...currentStats.customStats };
    const claimedCount = quests.filter(q => q.claimed).length;
    const completedHabitsCount = dailyHabits.filter(h => h.completed).length;

    const newEntry: ProgressHistoryEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      level: currentStats.level,
      exp: currentStats.exp,
      gold: currentStats.gold,
      customStats: activeStats,
      completedQuestsCount: claimedCount,
      completedHabitsCount: completedHabitsCount,
      type,
      message
    };

    setProgressHistory((prev) => {
      const updated = [newEntry, ...prev].slice(0, 50);
      localStorage.setItem(STORAGE_KEY_PROGRESS_HISTORY, JSON.stringify(updated));
      return updated;
    });
  };

  // Calibration finished
  const handleCalibrate = (surveyData: any, generatedQuests: any) => {
    playLevelUp();
    setSurvey(surveyData);
    
    // Inject generated quests
    const mappedQuests: Quest[] = [];

    const mapQuestObject = (q: any, category: "main" | "side" | "daily" | "weekly"): Quest => ({
      id: `${category}_${Math.random().toString(36).substr(2, 9)}`,
      title: q.title || "Elite Clearance Portal",
      description: q.description || "The System commands your growth.",
      checklist: (q.checklist || []).map((text: string, i: number) => ({
        id: `item_${i}_${Math.random().toString(36).substr(2, 5)}`,
        text,
        completed: false
      })),
      difficulty: q.difficulty || "E",
      rewards: {
        exp: q.rewards?.exp || 100,
        gold: q.rewards?.gold || 50,
        statPoints: q.rewards?.statPoints || 0,
        statIncreases: q.rewards?.statIncreases || []
      },
      completed: false,
      claimed: false,
      category,
      createdAt: new Date().toISOString()
    });

    if (generatedQuests.mainQuests) {
      generatedQuests.mainQuests.forEach((q: any) => mappedQuests.push(mapQuestObject(q, "main")));
    }
    if (generatedQuests.sideQuests) {
      generatedQuests.sideQuests.forEach((q: any) => mappedQuests.push(mapQuestObject(q, "side")));
    }
    if (generatedQuests.dailyQuests) {
      generatedQuests.dailyQuests.forEach((q: any) => mappedQuests.push(mapQuestObject(q, "daily")));
    }
    if (generatedQuests.weeklyChallenges) {
      generatedQuests.weeklyChallenges.forEach((q: any) => mappedQuests.push(mapQuestObject(q, "weekly")));
    }

    setQuests(mappedQuests);
    
    // Initialize base stats with survey parameters
    const customized: { [key: string]: number } = {};
    surveyData.skills.forEach((skill: string) => {
      customized[skill] = 10;
    });

    const finalInitialStats = autoDistributePoints(customized, 5);

    const calibratedStats: PlayerStats = {
      name: surveyData.name || stats.name || "maansgh21",
      level: 1,
      exp: 0,
      gold: 300,
      rank: "E",
      statPoints: 0,
      customStats: finalInitialStats,
      titles: ["Mortal Recruit", "The Sovereign Monarch Intended"],
      activeTitle: "Mortal Recruit",
      achievements: DEFAULT_ACHIEVEMENTS
    };
    
    setStats(calibratedStats);
    setDailyHabits(INITIAL_DAILY_HABITS.map(h => ({ ...h, completed: false })));
    setEmergency(null);
    setShowEvaluationReport(null);
    
    // Welcome alert to introduce the Player to The System
    triggerSystemAlert(
      "[CONNECTION SYNCHRONIZED]",
      `Welcome, Player ${calibratedStats.name}.\n\nThe System has successfully synchronized with your biometric stats and goals.\n\nYour Awakening begins at Level 1 [Mortal Recruit]. Clear daily habits and gate quests to earn exp, gold, and level up your custom attributes!`
    );

    // Save initial storage directly to prevent race conditions
    localStorage.setItem(STORAGE_KEY_SURVEY, JSON.stringify(surveyData));
    localStorage.setItem(STORAGE_KEY_QUESTS, JSON.stringify(mappedQuests));
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(calibratedStats));

    // Track calibration event in history
    const calibrationEntry: ProgressHistoryEntry = {
      id: `history_${Date.now()}_calibration`,
      timestamp: new Date().toISOString(),
      level: 1,
      exp: 0,
      gold: 300,
      customStats: finalInitialStats,
      completedQuestsCount: 0,
      completedHabitsCount: 0,
      type: "calibration",
      message: `System awakening initiated. Biometric metadata bound to Player identity: ${calibratedStats.name}.`
    };
    setProgressHistory([calibrationEntry]);
    localStorage.setItem(STORAGE_KEY_PROGRESS_HISTORY, JSON.stringify([calibrationEntry]));
  };

  // Reset System (Clear layout)
  const handleResetSystem = () => {
    if (confirm("[SYSTEM CONFIRMATION REQUIRED]\nAre you sure you wish to disconnect core link with the Shadow sovereign? All levels, EXP, and claimed historical records will be incinerated.")) {
      playClick();
      localStorage.removeItem(STORAGE_KEY_STATS);
      localStorage.removeItem(STORAGE_KEY_QUESTS);
      localStorage.removeItem(STORAGE_KEY_SURVEY);
      localStorage.removeItem(STORAGE_KEY_EMERGENCY);
      localStorage.removeItem(STORAGE_KEY_REVIEWS);
      localStorage.removeItem("the_system_daily_habits");
      localStorage.removeItem(STORAGE_KEY_PROGRESS_HISTORY);
      
      setSurvey(null);
      setStats(INITIAL_STATS);
      setQuests([]);
      setProgressHistory([]);
      setEmergency(null);
      setWeeklyReviews([]);
      setDailyHabits(INITIAL_DAILY_HABITS);
    }
  };

  // Custom Quest Addition
  const handleCreateCustomQuest = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();

    if (!newQuestTitle.trim()) return;

    const checklistItems: ChecklistItem[] = newQuestTasksText
      .split("\n")
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map((text, idx) => ({
        id: `custom_item_${idx}_${Date.now()}`,
        text,
        completed: false
      }));

    if (checklistItems.length === 0) {
      checklistItems.push({
        id: `custom_item_0_${Date.now()}`,
        text: "Perform active progress step",
        completed: false
      });
    }

    // Calibrate rewards based on chosen difficulty
    let expVal = 100;
    let goldVal = 50;
    let statPts = 0;

    switch (newQuestDifficulty) {
      case "E": expVal = 50; goldVal = 20; statPts = 0; break;
      case "D": expVal = 100; goldVal = 40; statPts = 0; break;
      case "C": expVal = 200; goldVal = 80; statPts = 1; break;
      case "B": expVal = 400; goldVal = 150; statPts = 1; break;
      case "A": expVal = 800; goldVal = 300; statPts = 2; break;
      case "S": expVal = 1500; goldVal = 600; statPts = 3; break;
    }

    const created: Quest = {
      id: `${newQuestCategory}_custom_${Date.now()}`,
      title: `[CUSTOM] ${newQuestTitle}`,
      description: newQuestDesc || "A player-calibrated testing boundary.",
      checklist: checklistItems,
      difficulty: newQuestDifficulty,
      rewards: {
        exp: expVal,
        gold: goldVal,
        statPoints: statPts
      },
      completed: false,
      claimed: false,
      category: newQuestCategory,
      createdAt: new Date().toISOString(),
      relatedStat: newQuestRelatedStat
    };

    setQuests((prev) => [created, ...prev]);
    setShowQuestCreator(false);
    setNewQuestTitle("");
    setNewQuestDesc("");
    setNewQuestTasksText("");
    
    triggerSystemAlert("[QUEST CREATED]", `Successfully registered custom gate: "${created.title}". Go conquer it.`);
  };

  // Delete/Abandon Quest
  const handleAbandonQuest = (id: string, name: string) => {
    if (confirm(`Do you wish to abandon the quest: "${name}"? Abandoned quests suffer immediate termination with zero progression rewards.`)) {
      playClick();
      setQuests(prev => prev.filter(q => q.id !== id));
    }
  };

  // Checklist Check Toggle
  const toggleChecklistItem = (questId: string, itemId: string) => {
    playClick();
    setQuests((prevQuests) => {
      return prevQuests.map((q) => {
        if (q.id !== questId) return q;

        const updatedChecklist = q.checklist.map((item) => {
          if (item.id !== itemId) return item;
          return { ...item, completed: !item.completed };
        });

        // Determine if entire checklist is completed
        const completed = updatedChecklist.every((item) => item.completed);
        
        return {
          ...q,
          checklist: updatedChecklist,
          completed
        };
      });
    });
  };

  // Claim Quest Rewards
  const claimQuestRewards = (quest: Quest) => {
    // Save previous state for modal comparison
    const cachedStats = JSON.parse(JSON.stringify(stats));
    
    let gainedExp = quest.rewards.exp;
    let gainedGold = quest.rewards.gold;
    let gainedStatPoints = quest.rewards.statPoints;

    // Apply skill increments automatically if available
    const updatedCustomStats = { ...stats.customStats };
    if (quest.rewards.statIncreases) {
      quest.rewards.statIncreases.forEach((inc) => {
        // Try exact match or loose lowercase match
        const foundKey = Object.keys(updatedCustomStats).find(
          (k) => k.toLowerCase() === inc.statName.toLowerCase()
        );
        if (foundKey) {
          updatedCustomStats[foundKey] += inc.value;
        } else {
          // If stat name is valid and new, register it!
          updatedCustomStats[inc.statName] = 10 + inc.value;
        }
      });
    }

    let nextExp = stats.exp + gainedExp;
    let nextLevel = stats.level;
    let totalAutoPoints = gainedStatPoints;
    let nextRank = stats.rank;
    let levelUpOccurred = false;

    // Level-up loop calculation
    while (nextExp >= nextLevel * 100) {
      nextExp -= nextLevel * 100;
      nextLevel += 1;
      totalAutoPoints += 5; // +5 points to spend per level-up (auto-allocated)
      levelUpOccurred = true;

      // Unlock titles based on level triggers
      const newTitles = [...stats.titles];
      if (nextLevel >= 5 && !newTitles.includes("Gates Demolished")) {
        newTitles.push("Gates Demolished");
      }
      if (nextLevel >= 15 && !newTitles.includes("Shadow Commander")) {
        newTitles.push("Shadow Commander");
      }
      if (nextLevel >= 30 && !newTitles.includes("The Sovereign Monarch")) {
        newTitles.push("The Sovereign Monarch");
      }
    }

    // Distribute all accumulated stat points to the exact corresponding stat of this task
    const targetStat = findRelatedStatForQuest(quest, updatedCustomStats);
    const finalCustomStats = addPointsToSpecificStat(updatedCustomStats, targetStat, totalAutoPoints);

    if (totalAutoPoints > 0) {
      triggerSystemAlert(
        "[STAT POINTS DISPATCHED]",
        `Allocated +${totalAutoPoints} Stat Points directly into [${targetStat}] based on the completed gate's attributes.`
      );
    }

    // Rank upgrade logic
    if (nextLevel >= 80) nextRank = "National";
    else if (nextLevel >= 50) nextRank = "S";
    else if (nextLevel >= 30) nextRank = "A";
    else if (nextLevel >= 19) nextRank = "B";
    else if (nextLevel >= 10) nextRank = "C";
    else if (nextLevel >= 5) nextRank = "D";
    else nextRank = "E";

    // Achievement triggers
    const updatedAchievements = stats.achievements.map((ach) => {
      if (ach.unlocked) return ach;
      
      let unlock = false;
      if (ach.id === "level_5" && nextLevel >= 5) unlock = true;
      if (ach.id === "level_15" && nextLevel >= 15) unlock = true;
      if (ach.id === "rank_S" && nextRank === "S") unlock = true;
      if (ach.id === "gold_master" && stats.gold + gainedGold >= 2500) unlock = true;

      // Count completed quests in total
      const totalClaimed = quests.filter((q) => q.claimed || q.id === quest.id).length;
      if (ach.id === "quest_5" && totalClaimed >= 5) unlock = true;
      if (ach.id === "quest_20" && totalClaimed >= 20) unlock = true;

      if (unlock) {
        gainedGold += ach.goldReward; // Claim immediately
        playSystemNotice();
        return {
          ...ach,
          unlocked: true,
          unlockedAt: new Date().toISOString()
        };
      }
      return ach;
    });

    const finalPlayerStats: PlayerStats = {
      ...stats,
      level: nextLevel,
      exp: nextExp,
      gold: stats.gold + gainedGold,
      statPoints: 0,
      rank: nextRank,
      customStats: finalCustomStats,
      achievements: updatedAchievements,
    };

    // Flag quest as claimed
    setQuests((prevQuests) => {
      return prevQuests.map((q) => {
        if (q.id !== quest.id) return q;
        return { ...q, claimed: true };
      });
    });

    setStats(finalPlayerStats);

    // Track event in progress history
    if (levelUpOccurred) {
      addHistoryEntry(
        "level_up",
        `Biometric Breakthrough! Promoted to Level ${finalPlayerStats.level} [${finalPlayerStats.rank}-Rank ${finalPlayerStats.activeTitle}] following clearance of gate: "${quest.title}".`,
        finalPlayerStats
      );
    } else {
      addHistoryEntry(
        "quest_cleared",
        `Gate Cleared: "${quest.title}" (${quest.category} quest). Reward claimed: +${quest.rewards.exp} EXP & +${quest.rewards.gold} Gold.`,
        finalPlayerStats
      );
    }

    if (levelUpOccurred) {
      playLevelUp();
      setShowLevelUpModal({
        active: true,
        prevStats: cachedStats,
        nextStats: finalPlayerStats,
      });
    } else {
      playQuestComplete();
    }
  };

  // Daily Habits checklist
  const toggleDailyHabit = (id: string) => {
    playClick();
    const updatedHabits = dailyHabits.map((h) => {
      if (h.id !== id) return h;
      return { ...h, completed: !h.completed };
    });

    setDailyHabits(updatedHabits);

    // If all daily requirements are cleared, award a small consistency bonus!
    const allCompleted = updatedHabits.every(h => h.completed);
    if (allCompleted) {
      playLevelUp();
      const currentGoldAward = 35;
      const currentExpAward = 80;
      
      const nextExp = stats.exp + currentExpAward;
      let nextLevel = stats.level;
      let totalAutoPoints = 0;
      let levelUpOccurred = false;

      let expCheck = nextExp;
      while (expCheck >= nextLevel * 100) {
        expCheck -= nextLevel * 100;
        nextLevel += 1;
        totalAutoPoints += 5;
        levelUpOccurred = true;
      }

      const finalCustomStats = addPointsToSpecificStat(stats.customStats, "Fitness", totalAutoPoints);

      const finalPlayerStats: PlayerStats = {
        ...stats,
        level: nextLevel,
        exp: expCheck,
        gold: stats.gold + currentGoldAward,
        statPoints: 0,
        customStats: finalCustomStats
      };

      setStats(finalPlayerStats);

      // Track in history
      if (levelUpOccurred) {
        addHistoryEntry(
          "level_up",
          `Physical Awakening! Reached Level ${finalPlayerStats.level} following complete physical conditioning clearance. Gained +${totalAutoPoints} points in [Fitness].`,
          finalPlayerStats
        );
      } else {
        addHistoryEntry(
          "quest_cleared",
          `Conditioning Complete! Cleared all daily physical requirements today (+80 EXP, +35 Gold).`,
          finalPlayerStats
        );
      }

      triggerSystemAlert(
        "[DAILY HABITS ACCOMPLISHED - SUCCESSFUL RECALIBRATION]",
        `Congratulations! You have cleared all daily physical limitations today.\nAwarded: +80 EXP | +35 Gold.`
      );

      if (levelUpOccurred) {
        setShowLevelUpModal({
          active: true,
          prevStats: stats,
          nextStats: finalPlayerStats
        });
      }
    }
  };

  // Reset daily physical goals
  const handleResetDailyHabits = () => {
    playClick();
    setDailyHabits(INITIAL_DAILY_HABITS.map(h => ({ ...h, completed: false })));
    triggerSystemAlert("[DAILY LOG RE-INITIALIZED]", "The physical training habit logs have been reset. Keep pushing your limits.");
  };

  // Trigger Emergency Protocol
  const handleTriggerEmergencyQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!procrastinationIssue.trim()) return;

    playClick();
    setEmergencyLoading(true);

    try {
      const response = await fetch("/api/emergency-quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: procrastinationIssue,
          activeStats: Object.keys(stats.customStats)
        })
      });

      if (!response.ok) {
        throw new Error("Unable to open Crisis Portal. System core too busy.");
      }

      const generated = await response.json();
      
      // Load alarm alert
      playEmergencyQuestAlert();

      const newEmergencyState: EmergencyQuestState = {
        title: generated.title || "EMERGENCY QUEST: HEAVENLY INTENT FOR DISCIPLINE",
        description: generated.description || "You are stalling. The System commands immediate activity.",
        task: generated.task || "Work non-stop on sliding task.",
        timeLimitMs: generated.timeLimitMs || 900000,
        timeRemainingMs: generated.timeLimitMs || 900000,
        penalty: generated.penalty || "Do 50 painful squats",
        rewards: {
          exp: generated.rewards?.exp || 200,
          gold: generated.rewards?.gold || 100,
          statPoints: generated.rewards?.statPoints || 1
        },
        active: true,
        createdAt: new Date().toISOString()
      };

      setEmergency(newEmergencyState);
      setShowEmergencyTrigger(false);
      setProcrastinationIssue("");

    } catch (err: any) {
      alert("System Emergency Failure: " + err.message);
    } finally {
      setEmergencyLoading(false);
    }
  };

  // Complete Emergency Success
  const handleCompleteEmergency = () => {
    if (!emergency) return;
    
    playLevelUp();
    
    // Save stats
    let gainedExp = emergency.rewards.exp;
    let gainedGold = emergency.rewards.gold;
    let gainedStatPoints = emergency.rewards.statPoints;

    let nextExp = stats.exp + gainedExp;
    let nextLevel = stats.level;
    let totalAutoPoints = gainedStatPoints;
    let levelUpOccurred = false;

    while (nextExp >= nextLevel * 100) {
      nextExp -= nextLevel * 100;
      nextLevel += 1;
      totalAutoPoints += 5;
      levelUpOccurred = true;
    }

    const finalCustomStats = addPointsToSpecificStat(stats.customStats, "Discipline", totalAutoPoints);

    // Force unlock Defier of Death Achievement
    const updatedAchievements = stats.achievements.map((ach) => {
      if (ach.id === "emergency_survivor" && !ach.unlocked) {
        gainedGold += ach.goldReward;
        return {
          ...ach,
          unlocked: true,
          unlockedAt: new Date().toISOString()
        };
      }
      return ach;
    });

    const finalPlayerStats: PlayerStats = {
      ...stats,
      level: nextLevel,
      exp: nextExp,
      gold: stats.gold + gainedGold,
      statPoints: 0,
      customStats: finalCustomStats,
      achievements: updatedAchievements
    };

    setStats(finalPlayerStats);

    // Track in progress history
    if (levelUpOccurred) {
      addHistoryEntry(
        "level_up",
        `Crisis Surmounted! Promoted to Level ${finalPlayerStats.level} following clearance of emergency gate: "${emergency.title}".`,
        finalPlayerStats
      );
    } else {
      addHistoryEntry(
        "quest_cleared",
        `Crisis Resolved: Successfully conquered emergency gate! "${emergency.task}" (+${emergency.rewards.exp} EXP, +${emergency.rewards.gold} Gold).`,
        finalPlayerStats
      );
    }

    setEmergency({
      ...emergency,
      timeRemainingMs: 0,
      active: false
    });

    triggerSystemAlert(
      "[EMERGENCY QUEST CONQUERED - CRISIS EVADED]",
      `Spectacular grit! You broke through temptation.\nRewards Claimed: +${emergency.rewards.exp} EXP | +${emergency.rewards.gold} Gold | +${emergency.rewards.statPoints} Stat point.`
    );

    if (levelUpOccurred) {
      setShowLevelUpModal({
        active: true,
        prevStats: stats,
        nextStats: finalPlayerStats
      });
    }
  };

  // Fail / Admit Penalty on Emergency
  const handleFailEmergency = () => {
    if (!emergency) return;
    playClick();

    if (confirm(`Are you sure you wish to admit failure? Admitting defeat triggers the immediate system penalty: "${emergency.penalty}"`)) {
      setEmergency({
        ...emergency,
        timeRemainingMs: 0,
        active: false
      });
      triggerSystemAlert(
        "[EMERGENCY QUEST FAILED - PENALTY ENFORCED]",
        `You fell victim to the weakness of procrastination.\nPenalty to execute: ${emergency.penalty}`
      );
    }
  };

  // Request Weekly Progress Review
  const handleTriggerWeeklyReview = async () => {
    playClick();
    setEvaluationLoading(true);

    try {
      const completedCount = quests.filter(q => q.claimed).length;
      const failedCount = quests.filter(q => !q.claimed && q.completed === false && new Date(q.createdAt).getTime() < Date.now() - 7*24*3600*1000).length;

      const response = await fetch("/api/weekly-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeQuests: quests.filter(q => !q.claimed),
          completedCount,
          failedCount,
          totalEXP: stats.exp,
          currentLevel: stats.level,
          activeStats: stats.customStats
        })
      });

      if (!response.ok) {
        throw new Error("Unable to trigger diagnostics link with the void of space.");
      }

      const generated = await response.json();
      
      const newReport: WeeklyReviewReport = {
        analysis: generated.analysis || "Progress is within acceptable growth ratios.",
        verdict: generated.verdict || "Grade B - Satisfactory Warrior Standing",
        weaknesses: generated.weaknesses || ["Lack of daily physical output", "Delaying main quests"],
        advices: generated.advices || ["Prioritize High Rank gates first"],
        recalibrationBonus: generated.recalibrationBonus || 150,
        reviewedDate: new Date().toISOString()
      };

      setWeeklyReviews((prev) => [newReport, ...prev]);
      setShowEvaluationReport(newReport);
      playLevelUp();

      // Award recalibration bonus
      let gainedExp = newReport.recalibrationBonus;
      let nextExp = stats.exp + gainedExp;
      let nextLevel = stats.level;
      let nextStatPoints = stats.statPoints;
      let levelUpOccurred = false;

      while (nextExp >= nextLevel * 100) {
        nextExp -= nextLevel * 100;
        nextLevel += 1;
        nextStatPoints += 5;
        levelUpOccurred = true;
      }

      const finalPlayerStats: PlayerStats = {
        ...stats,
        level: nextLevel,
        exp: nextExp,
        statPoints: nextStatPoints
      };

      setStats(finalPlayerStats);

      // Track in history
      if (levelUpOccurred) {
        addHistoryEntry(
          "level_up",
          `Weekly Diagnostic Recalibration! Promoted to Level ${finalPlayerStats.level}. Verdict: ${newReport.verdict}.`,
          finalPlayerStats
        );
      } else {
        addHistoryEntry(
          "quest_cleared",
          `Weekly Recalibration Diagnostics complete! Verdict: ${newReport.verdict}. Recalibration Bonus claimed (+${newReport.recalibrationBonus} EXP).`,
          finalPlayerStats
        );
      }

      if (levelUpOccurred) {
        setShowLevelUpModal({
          active: true,
          prevStats: stats,
          nextStats: finalPlayerStats
        });
      }

    } catch (err: any) {
      alert("System Calibration Error: " + err.message);
    } finally {
      setEvaluationLoading(false);
    }
  };

  // Dynamic system report commentary based on attributes ratio
  const getDynamicSystemNarration = () => {
    const keys = Object.keys(stats.customStats);
    if (keys.length === 0) return "Choose and customize your stats attributes using the button below.";
    
    // Find highest and lowest stat
    const statsEntries = Object.entries(stats.customStats) as [string, number][];
    statsEntries.sort((a,b) => a[1] - b[1]); // ascending

    const lowest = statsEntries[0];
    const highest = statsEntries[statsEntries.length - 1];

    if (lowest && lowest[1] < 12) {
      return `"[CRITICAL GROWTH HOLE DETECTED] Your ${lowest[0]} stat is sitting at a mere ${lowest[1]}. The sovereign must cultivate balance. Focus immediately on this deficiency."`;
    }
    
    if (highest && highest[1] > 20) {
      return `"[EXCELLENT AFFINATION] Your ${highest[0]} attribute has pierced the standard dimensional limitations. You are a natural elite force in this parameter."`;
    }

    return `"[SYSTEM NOTIFICATION] The System is monitoring your growth pattern. Progress coefficients are fully stabilized. Continue quest clearances."`;
  };

  // Helper formatting for emergency timer
  const formatTimer = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper class for ranks
  const getRankStyle = (rankText: string) => {
    switch (rankText) {
      case "S": return "text-[#ff4e00] border-[#ff4e00] shadow-[0_0_10px_rgba(255,78,0,0.3)] bg-[#ff4e0011]";
      case "A": return "text-orange-400 border-orange-400 bg-orange-400/5";
      case "B": return "text-purple-400 border-purple-400 bg-purple-400/5";
      case "C": return "text-blue-400 border-blue-400 bg-blue-400/5";
      case "D": return "text-green-400 border-green-500/20 bg-green-500/5";
      case "National": return "text-yellow-400 border-yellow-500 animate-pulse bg-yellow-500/10";
      default: return "text-slate-400 border-slate-700 bg-slate-900";
    }
  };

  // Categorize quests list
  const filteredActiveQuests = quests.filter((q) => q.category === activeQuestTab && !q.claimed);
  const claimedQuestsCount = quests.filter((q) => q.claimed).length;

  return (
    <div id="progressive-terminal-container" className="min-h-screen bg-[#070709] text-zinc-100 font-sans antialiased relative selection:bg-cyan-500 selection:text-black overflow-x-hidden py-10 px-4 md:px-8">
      {/* Visual background soft light gradients */}
      <div className="absolute top-0 left-1/4 w-[30rem] h-[30rem] bg-cyan-500/[0.015] blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/[0.015] blur-[120px] rounded-full pointer-events-none"></div>

      {/* PHASE 0: BEFORE SYSTEM COUPLING / SURVEY SCREEN */}
      {!systemBooted ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 relative z-10 py-16 animate-fade-in max-w-2xl mx-auto">
          {/* Holographic concentric tech rings */}
          <div className="relative mb-8 w-28 h-28 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/10 animate-spin-slow"></div>
            <div className="absolute inset-2 rounded-full border border-double border-indigo-500/20 animate-spin-reverse"></div>
            <div className="absolute inset-4 rounded-full bg-cyan-500/5 flex items-center justify-center border border-cyan-500/20 hover:border-cyan-400/50 transition-all shadow-[inset_0_0_20px_rgba(0,242,255,0.1)]">
              <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
          </div>

          {/* Core System Greeting Headers */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-cyan-950/40 border border-cyan-800/30 rounded text-[9px] uppercase tracking-widest text-[#00f2ff] font-mono font-bold mb-3 animate-pulse">
              <Terminal className="w-3.5 h-3.5" /> SYSTEM LINK [v9.04] ONLINE
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-orbitron tracking-widest bg-gradient-to-r from-white via-cyan-400 to-[#00f2ff] bg-clip-text text-transparent uppercase drop-shadow-[0_0_15px_rgba(0,242,255,0.4)]">
              WELCOME TO THE SYSTEM
            </h1>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-2">
              S o l o   A s c e n s i o n   E n g i n e
            </p>
          </div>

          {/* Interactive Typewriter Console Logs */}
          <div className="w-full bg-zinc-950/90 border border-zinc-900 rounded-lg p-5 font-mono text-left mb-8 shadow-inner overflow-hidden relative">
            {/* Scanline overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00f2ff]/[0.015] to-transparent h-full w-full pointer-events-none animate-scanline"></div>
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900/60 mb-3 text-[9px] text-zinc-500 uppercase">
              <span>TERMINAL DIAGNOSTICS</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                LIVE LINK
              </span>
            </div>

            <div className="space-y-2.5 min-h-[140px] text-[11px] leading-relaxed font-mono">
              {[
                "[SYSTEM_LOADER]: Initiating neural synchronization protocols...",
                "[BIOMETRICS]: Detecting client space parameters [maansgh21@gmail.com]...",
                "[COGNITION]: Coupling standard attributes & potential quotients...",
                "[GATEWAY]: Activating dynamic objectives matrix over secured link...",
                "[STABILIZED]: Welcome to the System. Re-awaken your limits, Warrior."
              ].slice(0, bootStep).map((msg, i) => {
                const isLast = i === bootStep - 1;
                const isReady = i === 4;
                return (
                  <div 
                    key={i} 
                    className={`flex items-start gap-2.5 ${
                      isReady ? "text-emerald-400" : isLast ? "text-[#00f2ff]" : "text-zinc-400"
                    } animate-fade-in-index`}
                  >
                    <span className="shrink-0 font-bold select-none text-zinc-600">{">"}</span>
                    <p className="flex-1">
                      {msg}
                      {isLast && bootStep < 5 && (
                        <span className="inline-block w-1.5 h-3 bg-cyan-400 ml-1 animate-pulse"></span>
                      )}
                    </p>
                    {isReady ? (
                      <span className="shrink-0 text-[9px] px-1 bg-emerald-950/40 border border-emerald-800/40 rounded text-emerald-400 font-bold uppercase tracking-wide">READY</span>
                    ) : (
                      <span className="shrink-0 text-[9px] text-zinc-650">[CON]</span>
                    )}
                  </div>
                );
              })}
              {bootStep === 0 && (
                <div className="text-zinc-650 flex items-center gap-2 italic animate-pulse">
                  <span>{">"}</span>
                  <span>Connecting to secure telemetry tunnel...</span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Entry Action CTA */}
          {bootStep < 5 ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-850 rounded text-[10px] text-zinc-400 font-mono">
                <RotateCcw className="w-3.5 h-3.5 text-cyan-500 animate-spin" />
                Synchronizing core modules ({bootStep * 20}%)
              </div>
              <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                [ awaiting neural alignment ]
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <button 
                id="system-wake-gate"
                onClick={() => {
                  playClick();
                  playLevelUp();
                  setSystemBooted(true);
                }}
                className="group relative px-10 py-4 bg-cyan-950/20 hover:bg-cyan-900/10 border-2 border-[#00f2ff] hover:border-cyan-400 text-[#00f2ff] hover:text-white rounded-xl font-mono text-xs uppercase tracking-widest cursor-pointer shadow-[0_0_25px_rgba(0,242,255,0.15)] hover:shadow-[0_0_35px_rgba(0,242,255,0.35)] transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 text-center font-bold"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                [ Awaken Neural Connection ]
                <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <p className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase mt-2">
                warning: progress calibration protocols will actively register
              </p>
            </div>
          )}
        </div>
      ) : !survey ? (
        <div className="py-8 px-4 max-w-4xl mx-auto relative z-10 animate-fade-in">
          <InitialCalibration onCalibrate={handleCalibrate} />
        </div>
      ) : (
        /* PHASE 1: FULL ACTIVE HUD INTERFACE */
        <div className="max-w-6xl mx-auto bg-zinc-950/70 border border-zinc-900 rounded-2xl p-4 md:p-6 relative shadow-2xl backdrop-blur-md">
          
          {/* HEADER SECTION */}
          <header className="flex flex-col md:flex-row justify-between items-center gap-4 pb-2 mb-4 z-10">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-bold tracking-wider text-white font-orbitron">GROWTH UTILITY</h1>
              </div>
            </div>

            {/* Middle Real-time counter */}
            <div className="hidden lg:flex items-center gap-2.5 bg-zinc-900/60 border border-zinc-850 px-4 py-1.5 rounded-lg text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-zinc-500">TIMESTAMP:</span>
              <span className="text-zinc-300 font-medium whitespace-nowrap">{currentUtcTime || "SYNCING..."}</span>
            </div>

            {/* Right Status */}
            <div className="flex items-center gap-3.5 text-center md:text-right">
              <div className="hidden md:block">
                <div className="text-[9px] text-cyan-400/80 font-mono tracking-widest uppercase font-semibold">COEF LEVEL {stats.level}</div>
                <div className="text-base font-bold text-white font-orbitron uppercase tracking-wide">
                  {stats.name || "PLAYER"}
                </div>
              </div>

              {/* Mute toggle option */}
              <button 
                onClick={toggleSound}
                className="w-9 h-9 border border-zinc-850 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                title={soundOn ? "Mute Alerts" : "Unmute Alerts"}
              >
                {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </header>

          {/* DYNAMIC WELCOME BANNER */}
          <div className="bg-gradient-to-r from-cyan-950/20 to-blue-950/10 border border-cyan-900/15 rounded-xl px-4 py-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in relative z-10">
            <div>
              <h2 className="text-xs font-semibold tracking-widest text-[#00f2ff] font-orbitron uppercase">
                WELCOME BACK, {stats.name || "WARRIOR"}
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">
                Ready face-to-face with the Shadow sovereign? See your progression shards and calibrate milestones.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <a
                href="/api/download-project"
                download="the-system-solo-leveling.zip"
                onClick={() => playClick()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] font-mono text-zinc-300 uppercase tracking-widest rounded-lg cursor-pointer transition-all hover:shadow-[0_0_10px_rgba(255,255,255,0.05)] active:scale-95"
                title="Download full project workspace directory as a clean ZIP backup"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                Backup Project ZIP
              </a>
              <button
                onClick={() => { playClick(); setShowProgressHistoryModal(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/40 border border-cyan-500/30 hover:border-cyan-400 text-[10px] font-mono text-cyan-400 uppercase tracking-widest rounded-lg cursor-pointer transition-all hover:shadow-[0_0_10px_rgba(0,242,255,0.2)] active:scale-95"
              >
                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                See Progress History
              </button>
              <div className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-cyan-950/30 border border-cyan-800/15 rounded-md text-[9px] font-mono text-cyan-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                SECURE LINK ACTIVE
              </div>
            </div>
          </div>

          {/* ACTIVE ALARM BANNER (If Emergency Quest Is Live) */}
          {emergency && emergency.active && (
            <div className="bg-orange-500/5 border border-orange-500/20 p-4 mb-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-pulse z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-orange-400 font-orbitron tracking-widest">Emergency System Call</h4>
                  <p className="text-xs text-zinc-300 leading-tight">
                    <span className="text-zinc-500 font-mono">OBJECTIVE:</span> {emergency.task}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[9px] text-zinc-500 uppercase font-mono tracking-wide">CALIBRATION TIMEOUT</div>
                  <div className="text-sm font-semibold font-mono text-orange-400 tracking-wider">
                    {formatTimer(emergency.timeRemainingMs)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCompleteEmergency}
                    className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-400 text-black text-xs font-mono font-semibold rounded-lg cursor-pointer transition-colors"
                  >
                    Clear Gate
                  </button>
                  <button
                    onClick={handleFailEmergency}
                    className="px-2.5 py-1.5 bg-zinc-900 hover:bg-orange-500/10 hover:text-orange-450 border border-zinc-800 text-xs text-zinc-400 font-mono rounded-lg cursor-pointer transition-colors"
                  >
                    Fail
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MAIN GRID LAYOUT */}
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* COLUMN 1: LEVEL PROFILE & BIO (4/12 cols for breathing room) */}
            <section className="col-span-1 lg:col-span-4 flex flex-col space-y-4">
              
              {/* Level & stats profile */}
              <div className="bg-zinc-900/30 border border-zinc-900 p-5 flex flex-col items-center relative rounded-xl overflow-hidden shadow-sm">
                <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest block mb-1">ROSTER EXPONENT</span>
                <span className="text-xs text-cyan-400 font-mono font-semibold uppercase tracking-wider">{stats.activeTitle}</span>
                
                {/* Massive Level Label */}
                <div className="text-6xl font-extrabold text-white font-orbitron my-3 italic tracking-tight">
                  {stats.level}
                </div>

                {/* EXP Linear Progress Gauge */}
                <div className="w-full bg-zinc-900 h-2 mt-2 relative rounded-full overflow-hidden border border-zinc-850">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300" 
                    style={{ width: `${Math.min(100, (stats.exp / (stats.level * 100)) * 100)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between w-full mt-2.5 text-[10px] font-mono text-zinc-500">
                  <span>PROGRESS VALUE</span>
                  <span className="text-zinc-300">{stats.exp} / {stats.level * 100} EXP</span>
                </div>
              </div>

              {/* Titles and achievements board */}
              <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-xl flex-1 flex flex-col justify-between min-h-[350px] shadow-sm">
                <div>
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2 mb-3 font-orbitron">
                    Active Passive Titles
                  </h3>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {stats.titles.map((title) => (
                      <button
                        key={title}
                        onClick={() => {
                          playClick();
                          setStats({ ...stats, activeTitle: title });
                          triggerSystemAlert("[TITLE EQUIPPED]", `You successfully bound active passive title: "${title}".`);
                        }}
                        className={`w-full text-left text-xs p-2 rounded-lg border transition-all cursor-pointer block ${
                          stats.activeTitle === title 
                            ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-400" 
                            : "bg-zinc-950/20 border-transparent text-zinc-400 hover:border-zinc-800 hover:text-zinc-300"
                        }`}
                      >
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${stats.activeTitle === title ? 'bg-cyan-400' : 'bg-zinc-700'}`}></span>
                        {title}
                      </button>
                    ))}
                  </div>

                  {/* Achievements and Badge count */}
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-5 mb-2.5 border-b border-zinc-900 pb-2 font-orbitron">
                    Achieved Trophies
                  </h3>
                  <div className="grid grid-cols-4 gap-2 max-h-[120px] overflow-y-auto pr-1">
                    {stats.achievements.map((ach) => (
                      <div 
                        key={ach.id}
                        title={`${ach.name}: ${ach.description} (Reward: +${ach.goldReward}g)`}
                        className={`h-9 border flex items-center justify-center text-center rounded-lg relative cursor-help transition-all ${
                          ach.unlocked 
                            ? "bg-zinc-900 border-yellow-500/20 text-yellow-500 shadow-sm" 
                            : "bg-zinc-950/40 border-zinc-900 text-zinc-700 hover:text-zinc-500"
                        }`}
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        {ach.unlocked && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-900 mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest block">CREDIT STANDING</span>
                    <div className="text-xl font-bold font-mono text-yellow-500">
                      {stats.gold.toLocaleString()} G
                    </div>
                  </div>
                </div>
              </div>

              {/* Calibration panel action nodes */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    playClick();
                    setShowEmergencyTrigger(true);
                  }}
                  className="w-full py-2.5 bg-orange-600/10 hover:bg-orange-600/20 border border-orange-550/20 hover:border-orange-500/40 text-orange-400 font-mono text-xs font-semibold uppercase tracking-widest rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Initiate Crisis Gate
                </button>
                
                <button
                  onClick={handleResetSystem}
                  className="w-full py-2 bg-transparent hover:bg-zinc-900/60 border border-zinc-900 text-[10px] text-zinc-500 hover:text-red-400 font-mono uppercase tracking-wider rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  Disconnect Sovereign Core
                </button>
              </div>

            </section>

            {/* COLUMN 2: ATTRIBUTES STATS & SELECTION PANEL (4/12 cols) */}
            <section className="col-span-1 lg:col-span-4 flex flex-col bg-zinc-900/30 border border-zinc-900 p-5 relative rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-[10px] font-bold font-orbitron uppercase tracking-widest text-[#22d3ee]">
                    Primary Attributes
                  </h2>
                </div>
              </div>

              {/* Attributes Allocation Grid & Edit tools */}
              <div className="space-y-4 flex-1 select-none overflow-y-auto max-h-[380px] pr-1 h-full">
                {(Object.entries(stats.customStats) as [string, number][]).map(([statName, value]) => (
                  <div key={statName} className="flex flex-col bg-zinc-950/40 border border-zinc-900/60 p-3 hover:border-zinc-800 rounded-lg transition-all">
                    <div className="flex justify-between items-center text-xs mb-1.5 font-semibold font-mono tracking-wider uppercase">
                      <span className="text-zinc-200">{statName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-mono text-xs">{value}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              playClick();
                              const updatedStats = { ...stats };
                              delete updatedStats.customStats[statName];
                              setStats(updatedStats);
                              triggerSystemAlert("[ATTRIBUTE DISMANTLED]", `Dismantled attribute: ${statName}.`);
                            }}
                            className="opacity-20 hover:opacity-100 hover:text-red-400 p-0.5 text-zinc-500 cursor-pointer transition-all"
                            title="Purge parameter"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Glowing progress line simulating value */}
                    <div className="h-1.5 bg-zinc-900 overflow-hidden rounded-full border border-zinc-850">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(100, (value / 50) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}

                {/* Adding dynamic attribute creator */}
                {!showQuestCreator && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const input = form.elements.namedItem("new_stat") as HTMLInputElement;
                      const name = input?.value.trim();
                      if (name) {
                        playClick();
                        if (stats.customStats[name] !== undefined) {
                          alert("Attribute already loaded.");
                          return;
                        }
                        const updated = { ...stats };
                        updated.customStats[name] = 10;
                        setStats(updated);
                        input.value = "";
                        triggerSystemAlert("[NEW COEF REGISTERED]", `Successfully updated cognitive system. Custom attribute "${name}" initialized at stage 10.`);
                      }
                    }}
                    className="flex aspect-auto gap-2 border border-zinc-900 p-1.5 bg-zinc-950/60 rounded-lg"
                  >
                    <input 
                      required
                      name="new_stat"
                      type="text" 
                      placeholder="Add custom stat (e.g. Health)"
                      maxLength={18}
                      className="flex-1 bg-zinc-900 border border-zinc-850 focus:border-cyan-500 focus:outline-none rounded-md text-xs px-2.5 py-1.5 font-mono text-white placeholder-zinc-650"
                    />
                    <button 
                      type="submit"
                      className="px-3 bg-zinc-900 hover:bg-zinc-800 text-cyan-400 rounded-md font-mono text-[10px] cursor-pointer border border-zinc-800 transition-colors"
                    >
                      Initialize
                    </button>
                  </form>
                )}
              </div>

              {/* Dynamic Reactive System AI Commentary */}
              <div className="mt-4 p-3 bg-zinc-900/40 border-l-2 border-cyan-500 rounded-r-lg max-h-[100px] overflow-y-auto">
                <p className="text-[11px] italic text-zinc-400 font-mono leading-relaxed">
                  {getDynamicSystemNarration()}
                </p>
              </div>
            </section>

            {/* COLUMN 3: QUESTS LOG BOARD & WEEKLY CHALLENGE (4/12 cols) */}
            <section className="col-span-1 lg:col-span-4 flex flex-col space-y-4">
              
              {/* Daily Habit tracker panel */}
              <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl flex flex-col shadow-sm">
                <div className="flex justify-between items-center mb-2.5">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-orbitron flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                    Physical Conditioning
                  </h3>
                  <button 
                    onClick={handleResetDailyHabits}
                    className="text-[9px] text-zinc-500 hover:text-cyan-450 font-mono border border-zinc-800 bg-zinc-950 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Reset
                  </button>
                </div>

                <div className="space-y-1.5">
                  {dailyHabits.map((h) => (
                    <label 
                      key={h.id}
                      className="flex items-center gap-2.5 p-2 bg-zinc-950/40 hover:bg-zinc-900/60 border border-zinc-900/60 rounded-lg select-none cursor-pointer text-xs transition-colors"
                    >
                      <input 
                        type="checkbox" 
                        checked={h.completed}
                        onChange={() => toggleDailyHabit(h.id)}
                        className="accent-cyan-400 h-3.5 w-3.5 bg-zinc-900 border-zinc-800 rounded focus:ring-0 cursor-pointer"
                      />
                      <span className={`transition-all font-mono text-[11px] ${h.completed ? "text-zinc-500 line-through" : "text-zinc-300"}`}>
                        {h.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* CORE QUEST PANEL WITH TABS */}
              <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl flex-1 flex flex-col justify-between min-h-[350px] shadow-sm">
                
                <div>
                  {/* Category switcher */}
                  <div className="border-b border-zinc-900 pb-3.5 mb-3.5">
                    <div className="flex items-center justify-between gap-1 bg-zinc-950/80 p-1 border border-zinc-900 rounded-lg">
                      <div className="flex gap-0.5">
                        {["daily", "side", "main", "weekly"].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              playClick();
                              setActiveQuestTab(cat as any);
                            }}
                            className={`px-2 py-1 text-[9px] uppercase font-mono font-bold tracking-wider rounded-md transition-all cursor-pointer ${
                              activeQuestTab === cat 
                                ? "bg-zinc-800 text-cyan-400" 
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          playClick();
                          setShowQuestCreator(true);
                        }}
                        className="text-[9px] font-mono text-cyan-400 hover:text-white uppercase flex items-center gap-1 cursor-pointer bg-cyan-950/20 border border-cyan-800/15 px-2 py-1 rounded-md hover:bg-cyan-950/40"
                      >
                        <PlusCircle className="w-3 h-3" /> Custom
                      </button>
                    </div>
                  </div>

                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block mb-2">
                    Clear Ratio &bull; {claimedQuestsCount} Cleaned
                  </span>

                  {/* Active Quest Item Loop */}
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {filteredActiveQuests.length === 0 ? (
                      <div className="text-center py-8 bg-zinc-950/20 border border-zinc-900 rounded-lg">
                        <p className="text-[10px] font-mono text-zinc-650 uppercase tracking-wider">
                          No Active Gateways Found
                        </p>
                      </div>
                    ) : (
                      filteredActiveQuests.map((q) => (
                        <div key={q.id} className="bg-zinc-950/40 border border-zinc-900/80 hover:border-zinc-800 p-3 rounded-lg transition-all">
                          <div className="flex justify-between items-start mb-0.5 gap-1">
                            <div>
                              <span className="text-[8px] font-mono font-bold text-cyan-400 uppercase tracking-widest block mb-0.5">
                                [RANK {q.difficulty}] &bull; {q.category}
                              </span>
                              <h4 className="text-xs font-bold text-white leading-snug">
                                {q.title}
                              </h4>
                            </div>
                            <button
                              onClick={() => handleAbandonQuest(q.id, q.title)}
                              className="text-[9px] font-mono text-zinc-600 hover:text-red-400 cursor-pointer transition-colors"
                              title="Abandon active objective"
                            >
                              Abandon
                            </button>
                          </div>
                          
                          <p className="text-[10px] text-zinc-400 leading-tight mb-2.5">
                            {q.description}
                          </p>

                          {/* Tasks checklists */}
                          <div className="space-y-1 border-t border-zinc-900/80 pt-2 mb-2.5">
                            {q.checklist.map((item) => (
                              <label key={item.id} className="flex items-center gap-2 text-[10px] text-zinc-350 cursor-pointer pointer-events-auto">
                                <input
                                  type="checkbox"
                                  checked={item.completed}
                                  onChange={() => toggleChecklistItem(q.id, item.id)}
                                  className="accent-[#00f2ff] h-3.5 w-3.5 bg-zinc-900 border-zinc-800 rounded cursor-pointer"
                                />
                                <span className={item.completed ? "text-zinc-500 line-through" : ""}>
                                  {item.text}
                                </span>
                              </label>
                            ))}
                          </div>

                          <div className="flex justify-between items-center pt-1 border-t border-zinc-900/60">
                            <span className="text-[8px] font-mono text-zinc-500 uppercase">
                              +{q.rewards.exp} XP // +{q.rewards.gold}G
                            </span>

                            {q.completed ? (
                              <button
                                onClick={() => claimQuestRewards(q)}
                                className="px-2 py-0.5 bg-emerald-600 text-black font-mono text-[9px] font-bold uppercase tracking-wider rounded cursor-pointer hover:bg-emerald-500 transition-colors"
                              >
                                CLAIM
                              </button>
                            ) : (
                              <span className="text-[8px] font-mono text-cyan-400 uppercase animate-pulse">
                                Active Gateway
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Footer Evaluation Option */}
                <div className="mt-4 pt-4 border-t border-zinc-900">
                  <button
                    onClick={handleTriggerWeeklyReview}
                    disabled={evaluationLoading}
                    className="w-full py-2.5 bg-zinc-950 hover:bg-cyan-500/[0.04] text-zinc-400 hover:text-cyan-400 font-mono text-xs uppercase tracking-widest border border-zinc-900 hover:border-cyan-500/20 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-20 disabled:pointer-events-none"
                  >
                    {evaluationLoading ? (
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-t-transparent border-cyan-450 rounded-full"></span>
                    ) : (
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    Generate Verdict Review
                  </button>
                </div>

              </div>
            </section>
          </main>

          {/* FOOTER METRICS INFO */}
          <footer className="mt-6 flex flex-col md:flex-row justify-between items-center gap-3 border-t border-zinc-900 pt-4 z-10 text-[9px]">
            <div className="flex space-x-2 order-2 md:order-1">
              {weeklyReviews.length > 0 && (
                <button
                  onClick={() => setShowEvaluationReport(weeklyReviews[0])}
                  className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-[#22d3ee] hover:bg-zinc-800 uppercase font-mono tracking-widest cursor-pointer rounded-md transition-colors"
                >
                  Verdict Records ({weeklyReviews.length})
                </button>
              )}
            </div>
            <div className="text-zinc-500 font-mono uppercase order-1 md:order-2 tracking-wider">
              GROWTH HUB v9.04 &bull; CLIENT: {stats.name}
            </div>
          </footer>
        </div>
      )}

      {/* --- FLOATING NOTIFICATION MODAL ALERTS --- */}

      {/* 1. System Alert Pop-up */}
      {systemAlertMessage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-[#111116] border border-[#00f2ff] shadow-cyan-glow p-6 max-w-md w-full relative rounded">
            <div className="absolute top-2 right-2">
              <button 
                onClick={() => { playClick(); setSystemAlertMessage(null); }}
                className="text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h4 className="text-[#00f2ff] font-orbitron font-bold tracking-widest text-sm uppercase mb-3">
              [NOTICE RECEIVAL]
            </h4>
            <p className="text-white text-sm font-mono leading-relaxed whitespace-pre-wrap">
              {systemAlertMessage}
            </p>
            <div className="mt-5 text-right">
              <button
                onClick={() => { playClick(); setSystemAlertMessage(null); }}
                className="px-4 py-1.5 bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] border border-[#00f2ff33] rounded font-mono text-xs uppercase cursor-pointer"
              >
                Acknowledge Directive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Level Up Hero Cinematic Screen */}
      {showLevelUpModal.active && showLevelUpModal.nextStats && (
        <div className="fixed inset-0 bg-[#050507]/95 flex items-center justify-center p-4 z-[99999] animate-fade-in">
          <div className="max-w-md w-full bg-slate-950 border-2 border-[#00f2ff] p-8 text-center shadow-[0_0_50px_#00f2ff33] rounded relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-[#00f2ff] animate-pulse"></div>
            
            <div className="w-20 h-20 bg-cyan-950/40 border-2 border-[#00f2ff] flex items-center justify-center rounded-full mx-auto my-4 shadow-[0_0_20px_#00f2ff44]">
              <Sparkles className="w-10 h-10 text-[#00f2ff] animate-spin" />
            </div>

            <h3 className="text-2xl font-black font-orbitron text-[#00f2ff] uppercase tracking-widest mb-1 italic">
              [LEVEL UP]
            </h3>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-6">
              "The limiters of mortal physiology have broken."
            </p>

            <div className="bg-[#111116] border border-slate-800 p-4 rounded mb-6 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500 uppercase">Attribute Parameter</span>
                <span className="text-white">Recalibration Value</span>
              </div>
              <div className="flex justify-between">
                <span>Roster Level:</span>
                <span className="text-white font-bold">{showLevelUpModal.prevStats?.level || 1} → {showLevelUpModal.nextStats.level}</span>
              </div>
              <div className="flex justify-between">
                <span>Attribute Points Claimed:</span>
                <span className="text-orange-400 font-bold">+5 Free points allocation</span>
              </div>
              <div className="flex justify-between">
                <span>Next Rank Tier status:</span>
                <span className={`font-bold ${showLevelUpModal.nextStats.rank === "S" ? "text-[#ff4e00]" : "text-white"}`}>Rank {showLevelUpModal.nextStats.rank}</span>
              </div>
            </div>

            <button
              onClick={() => {
                playClick();
                setShowLevelUpModal({ active: false });
              }}
              className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 text-white font-mono text-xs font-bold uppercase tracking-widest rounded cursor-pointer transition-colors hover:shadow-cyan-500/20 shadow-lg"
            >
              [ ENGAGE COUPLING PROTOCOLS ]
            </button>
          </div>
        </div>
      )}

      {/* 3. Custom Quest Creation Screen Modal */}
      {showQuestCreator && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-[#111116] border border-[#00f2ff33] rounded p-6 max-w-lg w-full relative shadow-cyan-glow">
            <button 
              onClick={() => { playClick(); setShowQuestCreator(false); }}
              className="absolute top-3 right-3 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black font-orbitron uppercase text-[#00f2ff] tracking-wider mb-4">
              [REGISTER CUSTOM PROGRESS GATE]
            </h3>

            <form onSubmit={handleCreateCustomQuest} className="space-y-4 text-xs font-mono">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 uppercase">Quest Core Title</label>
                <input
                  required
                  type="text"
                  placeholder="E.g. Clear Chapter 3 of LeetCode, Gym leg execution"
                  className="w-full bg-[#09090d] border border-slate-800 focus:border-[#00f2ff] focus:outline-none p-2.5 rounded text-white"
                  value={newQuestTitle}
                  onChange={(e) => setNewQuestTitle(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 uppercase">Narration description</label>
                <textarea
                  placeholder="The cold motivating reasons..."
                  rows={2}
                  className="w-full bg-[#09090d] border border-slate-800 focus:border-[#00f2ff] focus:outline-none p-2.5 rounded text-white resize-none"
                  value={newQuestDesc}
                  onChange={(e) => setNewQuestDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 uppercase">Difficulty level Rank</label>
                  <select
                    className="w-full bg-[#09090d] border border-slate-800 focus:border-[#00f2ff] focus:outline-none p-2 rounded text-white"
                    value={newQuestDifficulty}
                    onChange={(e) => setNewQuestDifficulty(e.target.value as any)}
                  >
                    <option value="E">E-Rank (Minor Habit)</option>
                    <option value="D">D-Rank (Standard Task)</option>
                    <option value="C">C-Rank (Moderate milestone)</option>
                    <option value="B">B-Rank (Significant assignment)</option>
                    <option value="A">A-Rank (Extreme effort block)</option>
                    <option value="S">S-Rank (Cataclysmic objective)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 uppercase">Category type</label>
                  <select
                    className="w-full bg-[#09090d] border border-slate-800 focus:border-[#00f2ff] focus:outline-none p-2 rounded text-white"
                    value={newQuestCategory}
                    onChange={(e) => setNewQuestCategory(e.target.value as any)}
                  >
                    <option value="daily">Daily Habit Quest</option>
                    <option value="side">Side Quest</option>
                    <option value="main">Main Quest</option>
                    <option value="weekly">Weekly Challenge</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-slate-400 uppercase font-bold text-[#00f2ff]/80">Target Attribute / Associated Skill</label>
                  <select
                    className="w-full bg-[#09090d] border border-slate-800 focus:border-[#00f2ff] focus:outline-none p-2 rounded text-white"
                    value={newQuestRelatedStat}
                    onChange={(e) => setNewQuestRelatedStat(e.target.value)}
                  >
                    {Object.keys(stats.customStats).map((stat) => (
                      <option key={stat} value={stat}>{stat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-slate-400 uppercase">Checklist steps (One bullet per line)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Task item 1&#10;Task item 2&#10;Task item 3"
                  className="w-full bg-[#09090d] border border-slate-800 focus:border-[#00f2ff] focus:outline-none p-2.5 rounded text-white font-mono placeholder:opacity-40"
                  value={newQuestTasksText}
                  onChange={(e) => setNewQuestTasksText(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-505 text-white font-mono font-bold uppercase tracking-wider rounded cursor-pointer mt-4"
              >
                [ SYNC REGISTRY DIRECTIVE ]
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Procrastination / Emergency trigger panel Trigger */}
      {showEmergencyTrigger && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-[#111116] border border-red-500/50 shadow-orange-glow p-6 max-w-md w-full relative rounded">
            <button 
              onClick={() => { playClick(); setShowEmergencyTrigger(false); }}
              className="absolute top-2 right-2 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1.5 text-red-500 mb-2">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <h3 className="text-sm font-black font-orbitron uppercase tracking-widest">[CRISIS PROTOCOL SIGNAL]</h3>
            </div>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Feeling stuck? Are sliding thoughts taking over? Disclose what procrastination thoughts have anchored your vessel. The sovereign System will prescribe extreme instant physical or cognitive recalibrations.
            </p>

            <form onSubmit={handleTriggerEmergencyQuest} className="space-y-4">
              <input
                required
                type="text"
                maxLength={90}
                placeholder="E.g., I have been doomscrolling on TikTok for 40 minutes and can't start code study..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 focus:outline-none rounded text-xs p-3 font-mono text-white"
                value={procrastinationIssue}
                onChange={(e) => setProcrastinationIssue(e.target.value)}
              />

              <button
                disabled={emergencyLoading}
                type="submit"
                className="w-full py-3 bg-red-650 hover:bg-red-550 border border-red-500/40 text-white font-mono text-xs font-bold uppercase tracking-widest cursor-pointer hover:shadow-lg disabled:opacity-20"
              >
                {emergencyLoading ? "OPENING GATEWAY CORRIDOR..." : "[ INITIALIZE IMMEDIATE EMERGENCY COUPLING ]"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Weekly Verdict Visualizer Screen */}
      {showEvaluationReport && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[9999] overflow-y-auto font-mono">
          <div className="bg-[#111116] border border-[#00f2ff44] shadow-cyan-glow p-6 max-w-lg w-full relative rounded-lg">
            <button
              onClick={() => { playClick(); setShowEvaluationReport(null); }}
              className="absolute top-3 right-3 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-3 border-b border-[#00f2ff33] mb-4">
              <span className="text-[10px] text-[#00f2ff] uppercase tracking-widest">[RECALIBRATION JOURNAL]</span>
              <h3 className="text-base font-bold font-orbitron uppercase tracking-wider text-white mt-1">
                {showEvaluationReport.verdict}
              </h3>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div>
                <span className="text-[#00f2ff] uppercase block mb-1 font-bold">[PERFORMANCE DIAGNOSIS]</span>
                <p className="bg-[#09090d] border border-slate-900 p-2.5 rounded text-white italic">
                  "{showEvaluationReport.analysis}"
                </p>
              </div>

              <div>
                <span className="text-red-400 uppercase block mb-1 font-bold">[IDENTIFIED STRATEGIC DEFICIENCIES]</span>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  {showEvaluationReport.weaknesses.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-green-400 uppercase block mb-1 font-bold font-sans">[PRESCRIPTIONS FROM SOVEREIGN]</span>
                <ul className="list-decimal pl-5 space-y-1 text-slate-400">
                  {showEvaluationReport.advices.map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between items-center bg-[#00f2ff10]/5 p-2 rounded">
                <span className="text-[10px] text-slate-400 uppercase font-mono">RECALIBRATION EXP RECOVERY</span>
                <span className="text-[#ffd700] font-bold">
                  +{showEvaluationReport.recalibrationBonus} EXP INJECTED
                </span>
              </div>
            </div>

            <div className="mt-5 text-center">
              <button
                onClick={() => { playClick(); setShowEvaluationReport(null); }}
                className="px-6 py-2 bg-slate-950 hover:bg-[#00f2ff22] text-[#00f2ff] border border-[#00f2ff22] font-mono text-xs uppercase cursor-pointer"
              >
                Sync directives & close log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Secure Progression Logs & Growth Curve Modal */}
      {showProgressHistoryModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-[#111116] border border-cyan-500/40 shadow-cyan-glow p-6 max-w-2xl w-full relative rounded-lg font-mono text-xs">
            {/* Close */}
            <button
              onClick={() => { playClick(); setShowProgressHistoryModal(false); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center pb-3 border-b border-[#00f2ff33] mb-4">
              <span className="text-[10px] text-[#00f2ff] uppercase tracking-widest flex items-center justify-center gap-1.5 font-bold">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                [CHRONO PROGRESSION INDEX // SYSTEM ARCHIVE]
              </span>
              <h3 className="text-base font-bold font-orbitron uppercase tracking-wider text-white mt-1">
                Player Growth Diagnostics
              </h3>
            </div>

            {/* Manual growth point entry */}
            <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-3.5 mb-5">
              <span className="text-[10px] text-[#00f2ff] uppercase tracking-wide block mb-1.5 font-semibold">
                [REGISTER MANUAL GROWTH CORE JOURNAL]
              </span>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const input = form.elements.namedItem("milestone_text") as HTMLInputElement;
                  const text = input?.value.trim();
                  if (text) {
                    playLevelUp();
                    addHistoryEntry("milestone", text);
                    input.value = "";
                  }
                }}
                className="flex gap-2"
              >
                <input
                  required
                  name="milestone_text"
                  type="text"
                  placeholder="E.g., Hit 100 deep squats, cleared 5 hours pure coding, or finished algorithms quiz..."
                  maxLength={150}
                  className="flex-1 bg-zinc-900/80 border border-zinc-800 focus:border-cyan-500 focus:outline-none rounded px-3 py-2 text-zinc-200 placeholder-zinc-650"
                />
                <button
                  type="submit"
                  className="px-4 bg-cyan-950/40 hover:bg-cyan-900/30 border border-cyan-700/30 text-cyan-400 font-bold uppercase text-[9px] tracking-widest rounded transition-colors cursor-pointer"
                >
                  LOG CORE
                </button>
              </form>
            </div>

            {/* Dynamic Interactive SVG Progress Chart */}
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-lg p-4 mb-5">
              <h4 className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mb-3 flex items-center justify-between">
                <span>[COEF TIER ASCENSION HISTORY]</span>
                <span className="text-[9px] text-[#00f2ff]">X-Axis: Timeline // Y-Axis: Roster Level</span>
              </h4>

              {progressHistory.length < 2 ? (
                <div className="h-40 flex flex-col items-center justify-center text-center text-zinc-650 bg-zinc-900/20 border border-zinc-900/50 rounded p-4">
                  <RotateCcw className="w-6 h-6 animate-spin mb-2 text-cyan-500/20" />
                  <p className="text-[10px] uppercase tracking-wider font-mono">
                    Insufficient data nodes to render trajectory curve
                  </p>
                  <p className="text-[9px] text-zinc-700 mt-1 lowercase">
                    Complete quests or trigger logins to populate trajectory
                  </p>
                </div>
              ) : (
                (() => {
                  const chronological = [...progressHistory].reverse();
                  
                  // Calculate dimensions
                  const width = 560;
                  const height = 140;
                  const paddingLeft = 30;
                  const paddingRight = 15;
                  const paddingTop = 15;
                  const paddingBottom = 20;

                  const chartWidth = width - paddingLeft - paddingRight;
                  const chartHeight = height - paddingTop - paddingBottom;

                  // Find min/max levels
                  const levels = chronological.map(e => e.level);
                  let minL = Math.min(...levels);
                  let maxL = Math.max(...levels);
                  
                  if (minL === maxL) {
                    minL = Math.max(1, minL - 1);
                    maxL = maxL + 1;
                  }

                  const points = chronological.map((e, index) => {
                    const x = paddingLeft + (index / (chronological.length - 1)) * chartWidth;
                    const y = paddingTop + chartHeight - ((e.level - minL) / (maxL - minL)) * chartHeight;
                    return { x, y, level: e.level, type: e.type, date: e.timestamp };
                  });

                  // Build line connection string
                  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  // Area path below coordinates
                  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

                  return (
                    <div className="relative">
                      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
                        <defs>
                          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.25"/>
                            <stop offset="100%" stopColor="#00f2ff" stopOpacity="0"/>
                          </linearGradient>
                        </defs>

                        {/* Y-axis ticks and guides */}
                        {[0, 0.5, 1].map((ratio, idx) => {
                          const val = Math.round(minL + ratio * (maxL - minL));
                          const y = paddingTop + chartHeight - ratio * chartHeight;
                          return (
                            <g key={idx} opacity="0.3">
                              <line 
                                x1={paddingLeft} 
                                y1={y} 
                                x2={width - paddingRight} 
                                y2={y} 
                                stroke="#1e293b" 
                                strokeDasharray="3 3"
                              />
                              <text 
                                x={paddingLeft - 8} 
                                y={y + 3} 
                                fill="#64748b" 
                                fontSize="8" 
                                textAnchor="end"
                                className="font-mono"
                              >
                                L.{val}
                              </text>
                            </g>
                          );
                        })}

                        {/* The fill area */}
                        <path d={areaPath} fill="url(#area-gradient)" />

                        {/* The line */}
                        <path d={linePath} fill="none" stroke="#00f2ff" strokeWidth="2" className="drop-shadow-[0_0_4px_rgba(0,242,255,0.4)]" />

                        {/* Dots */}
                        {points.map((p, i) => (
                          <g key={i} className="group cursor-pointer">
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r="3.5" 
                              fill="#09090d" 
                              stroke={p.type === "level_up" ? "#10b981" : "#00f2ff"} 
                              strokeWidth="2" 
                            />
                            {/* Larger hover circle to make hover easier */}
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r="8" 
                              fill="transparent" 
                              className="hover:fill-cyan-400 hover:opacity-10"
                            />
                            <title>
                              {`Level ${p.level} (${p.type.toUpperCase()})\nSnapshot: ${new Date(p.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                            </title>
                          </g>
                        ))}
                      </svg>
                      
                      {/* Timeline metadata markers */}
                      <div className="flex justify-between text-[8px] text-zinc-500 font-mono px-2.5 mt-1">
                        <span>{new Date(chronological[0].timestamp).toLocaleDateString([], {month: 'numeric', day: 'numeric'})}</span>
                        <span>{chronological.length} growth snapshots active</span>
                        <span>{new Date(chronological[chronological.length - 1].timestamp).toLocaleDateString([], {month: 'numeric', day: 'numeric'})}</span>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Timeline List of records */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              <h4 className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mb-2 block sticky top-0 bg-[#111116] py-1">
                [CHRONOLOGICAL TRAIL - SNAPSHOT RECORDS]
              </h4>
              
              {progressHistory.length === 0 ? (
                <div className="text-center py-8 bg-zinc-950/20 border border-zinc-900 rounded-lg">
                  <p className="text-[10px] font-mono text-zinc-650 uppercase">
                    No timeline shards found. Complete active habits to synchronize.
                  </p>
                </div>
              ) : (
                progressHistory.map((item) => (
                  <div key={item.id} className="bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 p-2.5 rounded-lg transition-all flex items-start gap-3">
                    <div className="mt-0.5 p-1 bg-zinc-900 border border-zinc-850 rounded">
                      {item.type === "login" && <Clock className="w-3.5 h-3.5 text-cyan-400" />}
                      {item.type === "level_up" && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                      {item.type === "quest_cleared" && <Swords className="w-3.5 h-3.5 text-[#00f2ff]" />}
                      {item.type === "calibration" && <Shield className="w-3.5 h-3.5 text-indigo-400" />}
                      {item.type === "milestone" && <Trophy className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`text-[8px] px-1 py-0.5 border font-bold uppercase rounded font-mono ${
                          item.type === "level_up" ? "bg-emerald-950/30 border-emerald-800/30 text-emerald-400" :
                          item.type === "milestone" ? "bg-yellow-950/30 border-yellow-800/30 text-yellow-400" :
                          item.type === "calibration" ? "bg-indigo-950/30 border-indigo-800/30 text-indigo-400" :
                          item.type === "quest_cleared" ? "bg-cyan-950/30 border-cyan-800/30 text-[#00f2ff]" :
                          "bg-zinc-900 border-zinc-800 text-zinc-400"
                        }`}>
                          {item.type}
                        </span>
                        
                        <span className="text-[9px] text-zinc-500 font-mono">
                          {new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <span className="text-[9px] text-cyan-400/80 font-mono ml-auto">
                          LVL {item.level} // {item.gold}G
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-zinc-350 font-sans mt-0.5 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Attribute attributes snapshot dropdown display */}
                      {item.customStats && Object.keys(item.customStats).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5 pt-1.5 border-t border-zinc-900/60 text-[8px] font-mono text-zinc-500">
                          <span className="text-zinc-650 uppercase font-bold">MUTATED STATS:</span>
                          {Object.entries(item.customStats).map(([statName, val]) => (
                            <span key={statName} className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-400">
                              {statName}: {val}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 text-center flex justify-between gap-4">
              <button
                onClick={() => {
                  if (confirm("[SYSTEM NOTIFICATION: PROGRESS RETRIEVAL TERMINATION]\nAre you sure you wish to wipe the historical progression records? Base levels and currently claimed stats will stay preserved.")) {
                    playClick();
                    setProgressHistory([]);
                    localStorage.removeItem(STORAGE_KEY_PROGRESS_HISTORY);
                  }
                }}
                className="text-[9px] uppercase tracking-wider text-red-500 hover:text-red-400 cursor-pointer text-left font-semibold"
              >
                [Wipe Trajectory logs]
              </button>
              
              <button
                onClick={() => { playClick(); setShowProgressHistoryModal(false); }}
                className="px-6 py-2 bg-slate-950 hover:bg-[#00f2ff22] text-[#00f2ff] border border-[#00f2ff22] font-mono text-xs uppercase cursor-pointer"
              >
                Acknowledge Directive
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
