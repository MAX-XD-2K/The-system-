import React, { useState } from "react";
import { Shield, Sparkles, Swords, Trophy, User, Plus, Edit2, Check, Trash2, X } from "lucide-react";
import { PlayerStats } from "../types";
import { playClick, playSystemNotice } from "../utils/sound";

interface StatusPanelProps {
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
}

export default function StatusPanel({ stats, onUpdateStats }: StatusPanelProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(stats.name);
  const [newStatName, setNewStatName] = useState("");
  const [showAddStat, setShowAddStat] = useState(false);

  // Experience threshold
  const expNeeded = stats.level * 100;
  const expPercentage = Math.min(100, Math.floor((stats.exp / expNeeded) * 100));

  const handleSaveName = () => {
    playClick();
    if (editedName.trim()) {
      onUpdateStats({ ...stats, name: editedName.trim() });
      setIsEditingName(false);
    }
  };

  const allocateStatPoint = (statName: string, amount: number) => {
    playClick();
    if (amount > 0 && stats.statPoints <= 0) return;
    if (amount < 0 && stats.customStats[statName] <= 0) return;

    const updatedStats = { ...stats };
    updatedStats.customStats[statName] = (updatedStats.customStats[statName] || 0) + amount;
    updatedStats.statPoints = updatedStats.statPoints - amount;
    onUpdateStats(updatedStats);
  };

  const handleAddNewStat = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    if (newStatName.trim()) {
      const formatted = newStatName.trim();
      if (stats.customStats[formatted] !== undefined) {
        alert("Stat already exists in the system registry.");
        return;
      }
      const updatedStats = { ...stats };
      updatedStats.customStats[formatted] = 10; // Start at general level 10
      onUpdateStats(updatedStats);
      setNewStatName("");
      setShowAddStat(false);
    }
  };

  const handleDeleteStat = (statName: string) => {
    playClick();
    const updatedStats = { ...stats };
    delete updatedStats.customStats[statName];
    onUpdateStats(updatedStats);
  };

  const selectActiveTitle = (title: string) => {
    playClick();
    onUpdateStats({ ...stats, activeTitle: title });
  };

  // Rank Styling
  const getRankColor = (rank: string) => {
    switch (rank) {
      case "S": return "text-red-500 border-red-500/30 bg-red-500/5";
      case "A": return "text-orange-400 border-orange-400/30 bg-orange-400/5";
      case "B": return "text-purple-400 border-purple-400/30 bg-purple-400/5";
      case "C": return "text-blue-400 border-blue-400/30 bg-blue-400/5";
      case "D": return "text-green-400 border-green-400/30 bg-green-400/5";
      case "National": return "text-yellow-400 border-yellow-400 border-dashed animate-pulse bg-yellow-400/10";
      default: return "text-slate-400 border-slate-700 bg-slate-800/10";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT: CHARACTER BIO & EXP CARD */}
      <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-2xl rounded-full"></div>
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className={`px-3 py-1 text-xs font-mono font-bold uppercase rounded border ${getRankColor(stats.rank)}`}>
              Rank {stats.rank}
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-mono text-[10px] uppercase">Gold Balance</span>
              <div className="text-yellow-400 font-mono font-bold flex items-center justify-end gap-1">
                🪙 {stats.gold}g
              </div>
            </div>
          </div>

          {/* Profile Name & Level */}
          <div className="flex flex-col items-center text-center py-4 border-b border-slate-800/60 mb-4 bg-slate-950/40 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-cyan-400/30 flex items-center justify-center mb-3 text-cyan-400 shadow-inner">
              <User className="w-8 h-8" />
            </div>

            {isEditingName ? (
              <div className="flex items-center gap-1.5 px-4 mb-1">
                <input
                  type="text"
                  className="bg-slate-900 border border-cyan-500 focus:outline-none rounded text-xs px-2 py-1 text-white font-mono"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  maxLength={15}
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 bg-cyan-950 border border-cyan-500/30 text-cyan-400 rounded cursor-pointer hover:bg-cyan-900"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold font-sans text-white uppercase tracking-tight">
                  {stats.name}
                </h3>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}

            <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
              {stats.activeTitle || "[ NO TITLE EQUIPPED ]"}
            </p>

            <div className="mt-4 text-3xl font-mono font-bold text-white flex items-baseline gap-1.5">
              <span className="text-slate-600 font-sans text-sm tracking-widest select-none font-medium">LV.</span>
              {stats.level}
            </div>
          </div>

          {/* EXP Bar */}
          <div className="space-y-1.5 mb-6">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400 uppercase">EXP Progress</span>
              <span className="text-cyan-400">{stats.exp} / {expNeeded} ({expPercentage}%)</span>
            </div>
            <div className="h-2 bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${expPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Titles inventory container */}
        <div className="border-t border-slate-800/80 pt-4 mt-auto">
          <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider block mb-2">Equip Title</span>
          <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
            <button
              onClick={() => selectActiveTitle("")}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                !stats.activeTitle
                  ? "bg-cyan-950 text-cyan-400 border-cyan-450/40"
                  : "bg-slate-950 text-slate-500 border-slate-900 hover:border-slate-800"
              }`}
            >
              None
            </button>
            {stats.titles.map((title) => (
              <button
                key={title}
                onClick={() => selectActiveTitle(title)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                  stats.activeTitle === title
                    ? "bg-cyan-950 text-cyan-400 border-cyan-400/40"
                    : "bg-slate-950 text-slate-400 border-slate-850 hover:border-slate-800"
                }`}
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MIDDLE: CUSTOM STATS ATTRIBUTES ALLOCATION */}
      <div className="col-span-1 lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between shadow-xl relative">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-cyan-400" /> [PLAYER INVENTORY STATS]
            </h3>
            {stats.statPoints > 0 && (
              <span className="animate-pulse px-2.5 py-0.5 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/30 text-[10px] font-mono uppercase tracking-wider">
                {stats.statPoints} Stat Points Available
              </span>
            )}
          </div>

          {/* Stats Roster */}
          <div className="space-y-3.5 pr-1 max-h-[300px] overflow-y-auto">
            {Object.entries(stats.customStats).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs font-mono text-slate-600 uppercase">Registry empty. Insert attributes below.</p>
              </div>
            ) : (
              Object.entries(stats.customStats).map(([statName, value]) => (
                <div
                  key={statName}
                  className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-lg transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-mono text-slate-100 uppercase tracking-widest">{statName}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-[10px] text-slate-500 font-mono">VALUE</div>
                    <div className="text-sm font-mono font-bold text-cyan-400 w-8 text-center">{value}</div>
                    
                    {/* Stat buttons if player has points */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => allocateStatPoint(statName, -1)}
                        disabled={value <= 0}
                        className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                      >
                        -
                      </button>
                      <button
                        onClick={() => allocateStatPoint(statName, 1)}
                        disabled={stats.statPoints <= 0}
                        className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 flex items-center justify-center text-xs font-bold cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleDeleteStat(statName)}
                        title="Delete custom stat"
                        className="w-6 h-6 rounded bg-red-950/20 hover:bg-red-900/30 text-red-500 flex items-center justify-center text-xs cursor-pointer ml-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Custom Stat UI Toggle */}
        <div className="border-t border-slate-800 pt-4 mt-6">
          {showAddStat ? (
            <form onSubmit={handleAddNewStat} className="flex gap-2">
              <input
                required
                type="text"
                placeholder="Stat name (e.g., Coding, MMA, DSA)"
                maxLength={18}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none rounded text-xs px-3 py-2 text-white font-mono"
                value={newStatName}
                onChange={(e) => setNewStatName(e.target.value)}
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-cyan-950 border border-cyan-500/30 font-mono text-xs text-cyan-400 rounded cursor-pointer hover:bg-cyan-900"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowAddStat(false)}
                className="p-1.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                playClick();
                setShowAddStat(true);
              }}
              className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-cyan-400 text-xs font-mono uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> [ REGISTER NEW CUSTOM ATTRIBUTE ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
