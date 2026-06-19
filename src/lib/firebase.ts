import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { initializeFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

/** True when required Firebase env vars are set (e.g. Vercel or local .env.local). */
export const firebaseConfigured =
  firebaseConfig.apiKey.length > 0 && firebaseConfig.projectId.length > 0;

let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

function getApp(): FirebaseApp {
  if (!firebaseConfigured) {
    throw new Error(
      "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* variables to .env.local (see .env.local.example)."
    );
  }
  if (!appInstance) {
    appInstance = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  }
  return appInstance;
}

function getAuthInstance(): Auth {
  if (!authInstance) authInstance = getAuth(getApp());
  return authInstance;
}

function getDbInstance(): Firestore {
  if (!dbInstance) {
    dbInstance = initializeFirestore(getApp(), {
      experimentalForceLongPolling: true,
    });
  }
  return dbInstance;
}

/** Safe Firestore access — returns null when env vars are missing. */
export function tryGetDb(): Firestore | null {
  if (!firebaseConfigured) return null;
  try {
    return getDbInstance();
  } catch {
    return null;
  }
}

/** Firebase Auth — only initialized when env vars are present. */
export const auth: Auth = firebaseConfigured ? getAuthInstance() : (null as unknown as Auth);

/**
 * Firestore instance. Prefer tryGetDb() in UI code so pages degrade gracefully
 * without NEXT_PUBLIC_FIREBASE_* in local .env.local.
 */
export const db: Firestore = firebaseConfigured
  ? getDbInstance()
  : (null as unknown as Firestore);
