"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";

export type ModuleProgress = {
  problem: number;
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
    problem: 0,  // 0%
    search: 1,   // 100% completed
    game: 0.8,   // 80%
    csp: 1,      // 100%
    agent: 1,    // 100%
    quiz: 0.6    // 60%
  },
  xp: 1250
};

export function useLabProgress() {
  const { user } = useAuth();
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

  // Sync to Cloud When User Auth Loads
  useEffect(() => {
    async function syncCloud() {
      if (!user || !db) return;
      try {
        const docRef = doc(db, "users", user.uid, "progress");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const cloudData = docSnap.data().data as LabProgress;
          if (cloudData && cloudData.modules) {
             setProgress(cloudData);
             localStorage.setItem("lab-progress", JSON.stringify(cloudData));
          }
        } else {
          // New cloud document, upload local
          await setDoc(docRef, { data: progress }, { merge: true });
        }
      } catch (err) {
        console.warn("Cloud sync failed. Operating locally.", err);
      }
    }
    syncCloud();
  }, [user]);

  const saveProgress = async (newProgress: LabProgress) => {
    setProgress(newProgress);
    localStorage.setItem("lab-progress", JSON.stringify(newProgress));
    window.dispatchEvent(new CustomEvent("lab-progress-updated", { detail: newProgress }));
    
    if (user && db) {
      try {
        await setDoc(doc(db, "users", user.uid, "progress"), { data: newProgress }, { merge: true });
      } catch (err) {
        console.warn("Cloud save failed.", err);
      }
    }
  };

  const markQuizComplete = (score: number) => {
    const updated: LabProgress = {
      modules: { ...progress.modules, quiz: 1 },
      xp: progress.xp + score
    };
    saveProgress(updated);
  };

  const markProblemComplete = (score: number = 250) => {
    if (progress.modules.problem === 1) return; // Already completed
    const updated: LabProgress = {
      modules: { ...progress.modules, problem: 1 },
      xp: progress.xp + score
    };
    saveProgress(updated);
  };

  const completedCount = Object.values(progress.modules).filter(v => v === 1).length;
  // Total is 6 modules
  const completionPercentage = (completedCount / 6) * 100;

  return { progress, completedCount, completionPercentage, isLoaded, markQuizComplete, markProblemComplete };
}
