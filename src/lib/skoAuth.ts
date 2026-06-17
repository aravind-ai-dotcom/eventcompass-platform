// =============================================================================
// Compass SKO — Firebase Authentication + user profile (sko_users only)
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
import {
  firestoreErrorMessage,
  isFirestorePermissionError,
  skoFirestoreOp,
} from "@/lib/skoFirestoreDebug";
import type { SkoAccessType, SkoUserProfile } from "@/types/sko";
import { friendlyAuthError } from "@/lib/auth";

export { friendlyAuthError };

export type SkoProfileLoadResult =
  | { profile: SkoUserProfile; error: null }
  | { profile: null; error: null }
  | { profile: null; error: string };

export async function getSkoUserProfile(
  uid: string,
  route = "skoAuth.getSkoUserProfile",
): Promise<SkoProfileLoadResult> {
  try {
    const snap = await skoFirestoreOp(
      { route, collection: SKO_COLLECTIONS.users, operation: "read", docId: uid },
      uid,
      () => getDoc(doc(db, SKO_COLLECTIONS.users, uid)),
    );

    if (!snap.exists()) {
      return { profile: null, error: null };
    }

    const data = snap.data();

    if (data.product !== "sko") {
      return { profile: null, error: null };
    }

    return {
      profile: {
        uid,
        ...data,
        product: "sko",
        profileComplete: Boolean(data.profileComplete),
      } as SkoUserProfile,
      error: null,
    };
  } catch (err) {
    if (isFirestorePermissionError(err)) {
      return {
        profile: null,
        error: "We could not load your SKO profile yet.",
      };
    }
    return {
      profile: null,
      error: firestoreErrorMessage(err),
    };
  }
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

  await skoFirestoreOp(
    { route: "skoAuth.signUpSkoUser", collection: SKO_COLLECTIONS.users, operation: "write", docId: cred.user.uid },
    cred.user.uid,
    () =>
      setDoc(doc(db, SKO_COLLECTIONS.users, cred.user.uid), {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
  );

  return cred.user;
}

export async function signInSkoUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const ref = doc(db, SKO_COLLECTIONS.users, cred.user.uid);
  const existing = await getDoc(ref);
  if (existing.exists() && existing.data()?.product === "sko") {
    await skoFirestoreOp(
      { route: "skoAuth.signInSkoUser", collection: SKO_COLLECTIONS.users, operation: "write", docId: cred.user.uid },
      cred.user.uid,
      () =>
        setDoc(ref, { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }),
    );
  }
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
  await skoFirestoreOp(
    { route: "skoAuth.saveSkoIntentProfile", collection: SKO_COLLECTIONS.users, operation: "write", docId: uid },
    uid,
    () =>
      setDoc(
        doc(db, SKO_COLLECTIONS.users, uid),
        {
          uid,
          slackHandle: intent.slackHandle ?? "",
          ...intent,
          product: "sko",
          profileComplete: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
  );
}

export function isSkoAdmin(profile: SkoUserProfile | null): boolean {
  return profile?.accessType === "se_team";
}
