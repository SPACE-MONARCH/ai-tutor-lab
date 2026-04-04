"use client";

import { useState, useEffect } from "react";
import type { User } from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;

    const setupAuth = async () => {
      try {
        const { initFirebase, signInAnonymouslyAsync } = await import("./firebase/config");
        const { onAuthStateChanged } = await import("firebase/auth");
        const { auth } = await initFirebase();

        if (!auth) {
          setIsLoading(false);
          return;
        }

        // Listen to Auth State
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
            setIsLoading(false);
          } else {
            // Sign in anonymously on first visit
            signInAnonymouslyAsync().then((cred) => {
              if (!cred) setIsLoading(false);
            }).catch((error) => {
              console.error("Anonymous auth failed (Check Firebase config/rules):", error);
              setIsLoading(false);
            });
          }
        });
      } catch (err) {
        setIsLoading(false);
      }
    };

    setupAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { user, isLoading };
}
