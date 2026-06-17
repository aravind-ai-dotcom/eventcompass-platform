// =============================================================================
// Compass SKO — Firebase Authentication + user profile
// =============================================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { SKO_COLLECTIONS } from "@/lib/skoCollections";
import type { SkoAccessType, SkoUserProfile } from "@/types/sko";
import { friendlyAuthError } from "@/lib/auth";

export { friendlyAuthError };

export async function getSkoUserProfile(uid: string): Promise<SkoUserProfile | null> {
  const snap = await getDoc(doc(db, SKO_COLLECTIONS.users, uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.product !== "sko") return null;
  return { uid, ...data } as SkoUserProfile;
}

export async function signUpSkoUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  slackHandle: string;
  password: string;
  accessType?: SkoAccessType;
}): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  const displayName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();

  await updateProfile(cred.user, { displayName });

  const profile: SkoUserProfile = {
    uid: cred.user.uid,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    displayName,
    email: input.email.trim(),
    slackHandle: input.slackHandle.trim(),
    accessType: input.accessType ?? "seller",
    product: "sko",
    profileComplete: false,
    technologyTracks: [],
    goals: [],
    verticals: [],
    partnerFocus: input.accessType === "partner",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, SKO_COLLECTIONS.users, cred.user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return cred.user;
}

export async function signInSkoUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  await setDoc(
    doc(db, SKO_COLLECTIONS.users, cred.user.uid),
    { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true },
  );
  return cred;
}

export async function sendSkoPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutSkoUser() {
  await signOut(auth);
}

export async function saveSkoIntentProfile(
  uid: string,
  intent: Partial<SkoUserProfile>,
): Promise<void> {
  await setDoc(
    doc(db, SKO_COLLECTIONS.users, uid),
    {
      ...intent,
      product: "sko",
      profileComplete: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function isSkoAdmin(profile: SkoUserProfile | null): boolean {
  return profile?.accessType === "se_team";
}
