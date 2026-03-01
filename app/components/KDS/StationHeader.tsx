"use client";

import { useEffect, useState } from "react";

interface StationHeaderProps {
  title: string;
  accentColor: string;
  soundEnabled: boolean;
  completedVisible: boolean;
  connectionOk: boolean;
  newCount: number;
  inProgressCount: number;
  onToggleSound: () => void;
  onToggleCompleted: () => void;
  onEnableSound: () => void;
}

export default function StationHeader({
  title,
  accentColor,
  soundEnabled,
  completedVisible,
  connectionOk,
  newCount,
  inProgressCount,
  onToggleSound,
  onToggleCompleted,
  onEnableSound,
}: StationHeaderProps) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b border-gray-700"
      style={{ backgroundColor: "#1a1a2e" }}
    >
      {/* Left: title + connection */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-white" style={{ color: accentColor }}>
          {title}
        </h1>
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            connectionOk ? "bg-green-500" : "bg-red-500 animate-pulse"
          }`}
          title={connectionOk ? "Connected" : "Connection lost"}
        />
      </div>

      {/* Center: counts */}
      <div className="flex items-center gap-4 text-sm text-gray-300">
        <span>
          <span className="font-semibold text-yellow-400">{newCount}</span> new
        </span>
        <span>
          <span className="font-semibold text-blue-400">{inProgressCount}</span>{" "}
          in progress
        </span>
      </div>

      {/* Right: controls + clock */}
      <div className="flex items-center gap-3">
        <button
          onClick={soundEnabled ? onToggleSound : onEnableSound}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            soundEnabled
              ? "bg-green-700 text-white hover:bg-green-600"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          {soundEnabled ? "Sound ON" : "Enable Sound"}
        </button>

        <button
          onClick={onToggleCompleted}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            completedVisible
              ? "bg-gray-600 text-white hover:bg-gray-500"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
          }`}
        >
          {completedVisible ? "Hide Done" : "Show Done"}
        </button>

        <span className="font-mono text-lg text-gray-300 min-w-[80px] text-right">
          {clock}
        </span>
      </div>
    </header>
  );
}
