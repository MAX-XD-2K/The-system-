export interface Reward {
  exp: number;
  gold: number;
  statPoints: number;
  statIncreases?: { statName: string; value: number }[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  checklist: ChecklistItem[];
  difficulty: "E" | "D" | "C" | "B" | "A" | "S";
  rewards: Reward;
  completed: boolean;
  claimed: boolean;
  category: "main" | "side" | "daily" | "weekly";
  createdAt: string;
  relatedStat?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  goldReward: number;
}

export interface PlayerStats {
  name: string;
  level: number;
  exp: number;
  gold: number;
  rank: "E" | "D" | "C" | "B" | "A" | "S" | "National";
  statPoints: number;
  customStats: { [statName: string]: number };
  titles: string[];
  activeTitle: string;
  achievements: Achievement[];
}

export interface EmergencyQuestState {
  title: string;
  description: string;
  task: string;
  timeLimitMs: number;
  timeRemainingMs: number;
  penalty: string;
  rewards: { exp: number; gold: number; statPoints: number };
  active: boolean;
  createdAt?: string;
}

export interface WeeklyReviewReport {
  analysis: string;
  verdict: string;
  weaknesses: string[];
  advices: string[];
  recalibrationBonus: number;
  reviewedDate: string;
}

export interface ProgressHistoryEntry {
  id: string;
  timestamp: string;
  level: number;
  exp: number;
  gold: number;
  customStats: { [statName: string]: number };
  completedQuestsCount: number;
  completedHabitsCount: number;
  type: "login" | "milestone" | "quest_cleared" | "level_up" | "calibration";
  message: string;
}
