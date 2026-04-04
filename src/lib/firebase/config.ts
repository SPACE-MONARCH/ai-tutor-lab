import type { FirebaseApp } from "firebase/app";
import type { Auth, User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

// Dynamic wrapper avoiding node SSG crash
export const initFirebase = async () => {
  if (typeof window === "undefined") {
    return { app: null, auth: null, db: null };
  }

  if (app && auth && db) {
    return { app, auth, db };
  }

  try {
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const { getAuth } = await import("firebase/auth");
    const { getFirestore } = await import("firebase/firestore");

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    };

    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.warn("Firebase initialization failed:", error);
  }

  return { app, auth, db };
};

export const signInAnonymouslyAsync = async (): Promise<User | null> => {
  if (typeof window === "undefined") return null;
  try {
    const { signInAnonymously } = await import("firebase/auth");
    const { auth } = await initFirebase();
    if (auth) {
      const cred = await signInAnonymously(auth);
      return cred.user;
    }
  } catch (error) {
    console.error("Anonymous auth failed:", error);
  }
  return null;
};

export { app, auth, db };
