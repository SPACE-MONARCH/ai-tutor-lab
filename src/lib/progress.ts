"use client";

import { useState, useEffect } from "react";

export type ModuleProgress = {
  search: number;
  game: number;
  csp: number;
  agent: number;
  quiz: number;
};

export type LabProgress = {
  modules: ModuleProgress;
  xp: number;
};

const DEFAULT_PROGRESS: LabProgress = {
  modules: {
    search: 1,   // 100% completed
    game: 0.8,   // 80%
    csp: 1,      // 100%
    agent: 1,    // 100%
    quiz: 0.6    // 60%
  },
  xp: 1250
};

export function useLabProgress() {
  const [progress, setProgress] = useState<LabProgress>(DEFAULT_PROGRESS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("lab-progress");
    if (stored) {
      try {
        setProgress(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse progress", e);
      }
    } else {
      localStorage.setItem("lab-progress", JSON.stringify(DEFAULT_PROGRESS));
    }
    setIsLoaded(true);

    const handleSync = (e: any) => {
      try {
        const payload = e.detail || JSON.parse(e.newValue);
        if (payload && payload.modules) setProgress(payload);
      } catch (err) {}
    };

    window.addEventListener("lab-progress-updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("lab-progress-updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const saveProgress = (newProgress: LabProgress) => {
    setProgress(newProgress);
    localStorage.setItem("lab-progress", JSON.stringify(newProgress));
    window.dispatchEvent(new CustomEvent("lab-progress-updated", { detail: newProgress }));
  };

  const markQuizComplete = (score: number) => {
    const updated: LabProgress = {
      modules: { ...progress.modules, quiz: 1 },
      xp: progress.xp + score
    };
    saveProgress(updated);
  };

  const completedCount = Object.values(progress.modules).filter(v => v === 1).length;
  // Exclude module 1, total is 5
  const completionPercentage = (completedCount / 5) * 100;

  return { progress, completedCount, completionPercentage, isLoaded, markQuizComplete };
}
