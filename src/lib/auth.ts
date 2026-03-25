"use client";

import { useState, useEffect } from "react";
import { auth, signInAnonymously } from "./firebase/config";
import { onAuthStateChanged, User } from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to Auth State
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsLoading(false);
      } else {
        // Sign in anonymously on first visit
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous auth failed (Check Firebase config/rules):", error);
          setIsLoading(false);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, isLoading };
}
