import React, { useState } from "react";
import { Brain, Timer, Calendar, Swords, Plus, X, Loader2, User } from "lucide-react";
import { playClick, playSystemNotice } from "../utils/sound";
import { getApiUrl } from "../utils/api";

interface SurveyData {
  goals: string;
  hours: number;
  skills: string[];
  deadlines: string;
  name: string;
}

interface CalibrationProps {
  onCalibrate: (survey: SurveyData, generatedQuests: any) => void;
}

const DEFAULT_SKILLS = ["Coding", "DSA", "Fitness", "Discipline", "Learning"];

export default function InitialCalibration({ onCalibrate }: CalibrationProps) {
  const [playerName, setPlayerName] = useState("");
  const [goals, setGoals] = useState("");
  const [hours, setHours] = useState(3);
  const [skills, setSkills] = useState<string[]>(DEFAULT_SKILLS);
  const [newSkill, setNewSkill] = useState("");
  const [deadlines, setDeadlines] = useState("");
  const [deadlineMode, setDeadlineMode] = useState<"text" | "date">("text");
  const [isLoading, setIsLoading] = useState(false);
  const [calibrationPhase, setCalibrationPhase] = useState(0);

  const phases = [
    "[PROBING THE WILLPOWER OF PLAYER...]",
    "[MEASURING CONCENTRATION INDICES...]",
    "[CONSTRUCTING CORRESPONDING GATEWAYS...]",
    "[SYNCHRONIZING TEMPORAL DEADLINES...]",
    "[CALIBRATING COMPLETED. COUPLING COMPLETED!]"
  ];

  const handleAddSkill = () => {
    playClick();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    playClick();
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const startCalibrationLoop = (survey: SurveyData) => {
    let currentPhase = 0;
    setCalibrationPhase(0);
    
    // Cycle through text phases for Solo Leveling visual immersion!
    const interval = setInterval(() => {
      currentPhase++;
      if (currentPhase < phases.length) {
        setCalibrationPhase(currentPhase);
        playSystemNotice();
      } else {
        clearInterval(interval);
      }
    }, 1200);

    return interval;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goals.trim() || !deadlines.trim() || skills.length === 0) {
      alert("All parameters must be specified for System coupling.");
      return;
    }

    playClick();
    setIsLoading(true);

    const survey: SurveyData = {
      name: playerName.trim() || "maansgh21",
      goals,
      hours,
      skills,
      deadlines,
    };

    const intervalId = startCalibrationLoop(survey);

    try {
      const response = await fetch(getApiUrl("/api/generate-quests"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(survey),
      });

      if (!response.ok) {
        throw new Error("Probing unsuccessful. The Gates are unstable.");
      }

      const generatedData = await response.json();

      // Ensure loading experience lasts long enough for visual effect!
      setTimeout(() => {
        clearInterval(intervalId);
        setIsLoading(false);
        onCalibrate(survey, generatedData);
      }, 5500);

    } catch (err: any) {
      clearInterval(intervalId);
      setIsLoading(false);
      alert("System Overload: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div 
        id="loading-panel" 
        className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4"
      >
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-cyan-500 border-l-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full border border-t-transparent border-r-cyan-600/30 border-b-transparent border-l-cyan-400/20 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
          <Swords className="w-8 h-8 text-cyan-400 animate-pulse" />
        </div>

        <h2 className="text-lg font-mono text-cyan-400 tracking-widest animate-pulse max-w-md uppercase mb-2">
          {phases[calibrationPhase]}
        </h2>
        <p className="text-xs text-zinc-500 max-w-xs font-mono tracking-wide">
          Do not close current terminal link. Calibrating optimal progression metrics.
        </p>
      </div>
    );
  }

  return (
    <div 
      id="survey-card" 
      className="max-w-xl mx-auto bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md"
    >
      {/* Background soft ambiance */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="pb-5 mb-6 text-center border-b border-zinc-900">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/30 border border-cyan-800/20 rounded-full text-[10px] font-mono text-cyan-400 mb-3 uppercase tracking-widest">
          <Brain className="w-3 h-3" /> System Calibration Active
        </div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white mb-2 font-orbitron">
          System Initialization
        </h1>
        <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
          The System requires synchronization with your current parameters before generating custom-tailored challenges. Declare your limits honestly, Player.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 0. Player Name */}
        <div className="flex flex-col gap-1.5 animate-fade-in-index">
          <label className="text-xs font-semibold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 animate-pulse" />
            0. Declare Player Identity / Username
          </label>
          <input
            id="player-name-input"
            type="text"
            placeholder="Enter your name or alias... (defaults to 'maansgh21')"
            className="w-full bg-zinc-900/40 border border-zinc-800/80 focus:border-cyan-500 rounded-lg p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all shadow-inner font-mono"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </div>

        {/* 1. Goals */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-cyan-400/95 uppercase tracking-widest flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" />
            1. Current Primary Objectives
          </label>
          <textarea
            required
            id="goals-input"
            rows={3}
            placeholder="E.g., Complete backend modules, Master Algorithms/DSA, Train physically 4x/week, Read 2 business books..."
            className="w-full bg-zinc-900/40 border border-zinc-800/80 focus:border-cyan-500 rounded-lg p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all resize-none shadow-inner"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
          />
        </div>

        {/* 2. Hours per day */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-cyan-400/95 uppercase tracking-widest flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5" />
            2. Daily Hours Allotted
          </label>
          <div className="flex items-center gap-4 py-1.5">
            <input
              id="hours-slider"
              type="range"
              min="1"
              max="12"
              className="flex-1 accent-cyan-400 h-1.5 bg-zinc-900 rounded border border-zinc-800 cursor-pointer"
              value={hours}
              onChange={(e) => {
                playClick();
                setHours(Number(e.target.value));
              }}
            />
            <span className="text-sm font-mono font-medium text-white bg-zinc-900 px-3 py-1 border border-zinc-800 rounded min-w-[70px] text-center">
              {hours} Hours
            </span>
          </div>
        </div>

        {/* 3. Skills */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-cyan-400/95 uppercase tracking-widest flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5" />
            3. Skills / Attributes of Growth
          </label>
          
          <div className="flex flex-wrap gap-1.5 py-1">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/60 border border-zinc-800/80 text-zinc-300 rounded-md text-xs font-mono"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-red-400 focus:outline-none cursor-pointer transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 mt-1">
            <input
              id="skill-input"
              type="text"
              placeholder="Add skill (e.g., Learning, Study, Focus)"
              maxLength={20}
              className="flex-1 bg-zinc-900/40 border border-zinc-800/80 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
            />
            <button
              id="add-skill-btn"
              type="button"
              onClick={handleAddSkill}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-cyan-400 hover:text-cyan-300 rounded-lg px-4 font-mono text-xs cursor-pointer transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> ADD
            </button>
          </div>
        </div>

        {/* 4. Deadlines approaching */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-cyan-400/95 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              4. Critical Milestones / Deadlines
            </label>
            <div className="flex bg-zinc-900 border border-zinc-800 rounded p-0.5 text-[9px] font-mono">
              <button
                type="button"
                onClick={() => { playClick(); setDeadlineMode("text"); setDeadlines(""); }}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${deadlineMode === "text" ? "bg-cyan-950 text-cyan-400 font-bold border border-cyan-500/30" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                TEXT
              </button>
              <button
                type="button"
                onClick={() => { playClick(); setDeadlineMode("date"); setDeadlines(""); }}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${deadlineMode === "date" ? "bg-cyan-950 text-cyan-400 font-bold border border-cyan-500/30" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                DATE
              </button>
            </div>
          </div>
          
          {deadlineMode === "date" ? (
            <input
              required
              id="deadline-input"
              type="date"
              className="w-full bg-zinc-900/40 border border-zinc-800/80 focus:border-cyan-500 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none transition-all font-mono"
              value={deadlines}
              onChange={(e) => setDeadlines(e.target.value)}
            />
          ) : (
            <input
              required
              id="deadline-input"
              type="text"
              placeholder="E.g., June 15 for SQL, Hackathon in 2 weeks, Exam prep..."
              className="w-full bg-zinc-900/40 border border-zinc-800/80 focus:border-cyan-500 rounded-lg p-3 text-xs text-[#f4f4f5] placeholder-zinc-550 focus:outline-none transition-all"
              value={deadlines}
              onChange={(e) => setDeadlines(e.target.value)}
            />
          )}
          <span className="text-[9px] text-zinc-500 font-mono italic">
            * {deadlineMode === "date" ? "Select exact calendar deadline for prompt validation." : "Describe temporal targets flexibly in text."}
          </span>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            id="submit-calibration"
            type="submit"
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-black rounded-lg font-mono text-xs font-bold uppercase tracking-widest cursor-pointer hover:shadow-lg transition-all border border-cyan-400/30"
          >
            Initiate Link Process
          </button>
        </div>
      </form>
    </div>
  );
}
