import {
  OAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "firebase/auth";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const EVENT_BASE = "organizations/ibm/events/txc2026";

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

type ExtendedParticipantProfile = Partial<UserProfile> & {
  tracks?: string[];
  needs?: string[];
  openTo?: string[];
  aspiration?: string;
  linkedin_url?: string;
  education?: {
    institution: string;
    degree?: string;
    field?: string;
    graduation_year?: string;
  }[];
  past_employers?: {
    company: string;
    role?: string;
    years?: string;
  }[];
  career_interests?: string[];
  networking_identity?: {
    open_to_alumni_connections?: boolean;
    open_to_past_colleague_connections?: boolean;
    open_to_university_connections?: boolean;
    open_to_career_conversations?: boolean;
  };
};

function splitDisplayName(displayName: string): {
  first_name: string;
  last_name: string;
  display_name: string;
} {
  const clean = displayName.trim();
  const parts = clean.split(/\s+/).filter(Boolean);

  return {
    first_name: parts[0] ?? "",
    last_name: parts.slice(1).join(" "),
    display_name: clean,
  };
}

function buildMatchingKeywords(profile: ExtendedParticipantProfile): string[] {
  return [
    ...(profile.goals ?? []),
    ...(profile.tracks ?? []),
    ...(profile.needs ?? []),
    ...(profile.openTo ?? []),
    ...(profile.career_interests ?? []),
    ...(profile.education ?? []).map((e) => e.institution),
    ...(profile.past_employers ?? []).map((e) => e.company),
    profile.organization ?? "",
    profile.role ?? "",
    profile.persona ?? "",
    profile.aspiration ?? "",
  ]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());
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
  const code = extractAuthErrorCode(error);
  const message =
    error && typeof error === "object" && typeof (error as { message?: string }).message === "string"
      ? (error as { message: string }).message
      : "";

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
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
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/invalid-api-key":
    case "auth/config-not-found":
      return "Firebase is not configured correctly. Check NEXT_PUBLIC_FIREBASE_* in .env.local.";
    default:
      if (code) console.error("Firebase auth error:", code, message || error);
      else console.error("Firebase auth error:", error);
      return message.replace(/^Firebase:\s*/i, "").trim()
        || (code ? `Auth error: ${code}` : "Sign-in failed. Please try again.");
  }
}

function extractAuthErrorCode(error: unknown): string {
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return "";

  const e = error as { code?: string; message?: string };
  if (typeof e.code === "string" && e.code.length > 0) return e.code;

  if (typeof e.message === "string") {
    const match = e.message.match(/\((auth\/[^)]+)\)/);
    if (match?.[1]) return match[1];
  }

  return "";
}

function requireAuth() {
  if (!auth) {
    throw Object.assign(new Error("Firebase Auth is not configured."), { code: "auth/config-not-found" });
  }
  return auth;
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

  const safeDisplayName = input.displayName.trim() || input.email;
  const nameParts = splitDisplayName(safeDisplayName);

  await createUserProfile({
    uid: cred.user.uid,
    email: input.email,
    displayName: safeDisplayName,
    organization: input.organization ?? "",
    role: input.role ?? "",
    persona: input.persona ?? "",
    authProvider: "password",
  });

  await setDoc(
    doc(db, `${EVENT_BASE}/participants/${cred.user.uid}`),
    {
      participant_id: cred.user.uid,
      id: cred.user.uid,

      first_name: nameParts.first_name,
      last_name: nameParts.last_name,
      display_name: nameParts.display_name,

      email: input.email,
      job_title: input.role ?? "",
      company: input.organization ?? "",
      organization: input.organization ?? "",
      persona: input.persona ?? "",

      linkedin_url: "",
      education: [],
      past_employers: [],
      career_interests: [],

      networking_identity: {
        open_to_alumni_connections: false,
        open_to_past_colleague_connections: false,
        open_to_university_connections: false,
        open_to_career_conversations: false,
      },

      event_signal_profile: {
        goals: [],
        tech_tracks: [],
        roles_at_txc: input.role ? [input.role] : [],
        open_to: [],
        intent: {
          needs: [],
          aspiration: "",
        },
      },

      compass_intelligence: {
        matching_keywords: buildMatchingKeywords({
          displayName: safeDisplayName,
          email: input.email,
          organization: input.organization ?? "",
          role: input.role ?? "",
          persona: input.persona ?? "",
        }),
      },

      registration: {
        attending: true,
        registered: true,
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
  return signInWithEmailAndPassword(requireAuth(), email, password);
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export async function signInWithIBM() {
  const provider = new OAuthProvider("oidc.ibm");
  return signInWithPopup(auth, provider);
}

export async function updateUserProfile(
  uid: string,
  profile: Partial<UserProfile>
): Promise<void> {
  await setDoc(
    doc(db, "users", uid),
    {
      ...profile,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateParticipantProfile(
  uid: string,
  profile: ExtendedParticipantProfile
): Promise<void> {
  const safeDisplayName =
    profile.displayName?.trim() ||
    profile.email?.trim() ||
    "Attendee";

  const nameParts = splitDisplayName(safeDisplayName);

  await setDoc(
    doc(db, `${EVENT_BASE}/participants/${uid}`),
    {
      participant_id: uid,
      id: uid,

      first_name: nameParts.first_name,
      last_name: nameParts.last_name,
      display_name: nameParts.display_name,

      email: profile.email ?? "",
      job_title: profile.role ?? "",
      company: profile.organization ?? "",
      organization: profile.organization ?? "",
      persona: profile.persona ?? "",

      linkedin_url: profile.linkedin_url ?? "",
      education: profile.education ?? [],
      past_employers: profile.past_employers ?? [],
      career_interests: profile.career_interests ?? [],

      networking_identity: {
        open_to_alumni_connections:
          profile.networking_identity?.open_to_alumni_connections ?? false,
        open_to_past_colleague_connections:
          profile.networking_identity?.open_to_past_colleague_connections ?? false,
        open_to_university_connections:
          profile.networking_identity?.open_to_university_connections ?? false,
        open_to_career_conversations:
          profile.networking_identity?.open_to_career_conversations ?? false,
      },

      event_signal_profile: {
        goals: profile.goals ?? [],
        tech_tracks: profile.tracks ?? [],
        open_to: profile.openTo ?? [],
        roles_at_txc: profile.role ? [profile.role] : [],
        intent: {
          needs: profile.needs ?? [],
          aspiration: profile.aspiration ?? "",
        },
      },

      compass_intelligence: {
        matching_keywords: buildMatchingKeywords(profile),
      },

      registration: {
        attending: true,
        registered: true,
        industry: "",
      },

      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error("No authenticated user.");
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function updateUserEmail(
  currentPassword: string,
  newEmail: string
): Promise<void> {
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error("No authenticated user.");
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updateEmail(user, newEmail);

  await setDoc(
    doc(db, "users", user.uid),
    {
      email: newEmail,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    doc(db, `${EVENT_BASE}/participants/${user.uid}`),
    {
      email: newEmail,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}