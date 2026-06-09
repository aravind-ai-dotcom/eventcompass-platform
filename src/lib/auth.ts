import {
  OAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type AuthError,
} from "firebase/auth";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  organization?: string;
  role?: string;
  persona?: string;
  authProvider?: "password" | "ibm";
  goals?: string[];
  interests?: string[];
  consent?: {
    networking: boolean;
    mentoring: boolean;
    recruiting: boolean;
    partnerIntroductions: boolean;
  };
  createdAt?: unknown;
  updatedAt?: unknown;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  const ref = doc(db, "users", profile.uid);

  await setDoc(
    ref,
    {
      ...profile,
      goals: profile.goals ?? [],
      interests: profile.interests ?? [],
      consent: profile.consent ?? {
        networking: false,
        mentoring: false,
        recruiting: false,
        partnerIntroductions: false,
      },
      createdAt: profile.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function ensureUserProfile(profile: UserProfile): Promise<UserProfile> {
  const existing = await getUserProfile(profile.uid);
  if (existing) return existing;

  await createUserProfile(profile);
  return profile;
}

export function friendlyAuthError(error: unknown): string {
  const code = (error as AuthError)?.code ?? "";

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Email or password is not correct.";
    case "auth/wrong-password":
      return "Password is not correct.";
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/weak-password":
      return "Please use a stronger password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled yet.";
default:
  console.error("Firebase auth error:", error);
  return `Auth error: ${code || "unknown"}`;
  }
}

export async function signUpWithEmail(input: {
      email: string;
  password: string;
  displayName: string;
  organization?: string;
  role?: string;
  persona?: string;
}) {
  const cred = await createUserWithEmailAndPassword(
    auth,
    input.email,
    input.password
  );

  await createUserProfile({
    uid: cred.user.uid,
    email: input.email,
    displayName: input.displayName,
    organization: input.organization ?? "",
    role: input.role ?? "",
    persona: input.persona ?? "",
    authProvider: "password",
  });

 const participantRef = doc(
  db,
  `organizations/ibm/events/txc2026/participants/${cred.user.uid}`
);

await setDoc(
  participantRef,
  {
    id: cred.user.uid,
    display_name: input.displayName,
    email: input.email,
    job_title: input.role ?? "",
    company: input.organization ?? "",
    persona: input.persona ?? "",

    event_signal_profile: {
      goals: [],
      tech_tracks: [],
      roles_at_txc: input.role ? [input.role] : [],
      open_to: [],
      intent: {
        needs: [],
      },
    },

    compass_intelligence: {
      matching_keywords: [],
    },

    registration: {
      attending: true,
      industry: "",
    },

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  { merge: true }
);

  return cred;
}
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithIBM() {
  const provider = new OAuthProvider("oidc.ibm");
  return signInWithPopup(auth, provider);
}