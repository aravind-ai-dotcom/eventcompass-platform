"use client";
// =============================================================================
// EventCompass — Auth Context
// src/context/AuthContext.tsx
//
// Provides:
//   user          — current Firebase User (null when signed out)
//   profile       — Firestore UserProfile from users/{uid}
//   enrolled      — true when participants/{uid} has goals or tech_tracks
//   loading       — true while auth state is being determined
//   profileLoading— true while Firestore profile is being fetched
// =============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc }                   from "firebase/firestore";
import { auth, tryGetDb, firebaseConfigured } from "@/lib/firebase";
import { getUserProfile, type UserProfile } from "@/lib/auth";

const EVENT_BASE = "organizations/ibm/events/txc2026";

// ─────────────────────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user:           User | null;
  profile:        UserProfile | null;
  enrolled:       boolean;
  loading:        boolean;
  profileLoading: boolean;
  /** Call after profile write so context refreshes without page reload */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user:           null,
  profile:        null,
  enrolled:       false,
  loading:        true,
  profileLoading: false,
  refreshProfile: async () => {},
});

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,           setUser]           = useState<User | null>(null);
  const [profile,        setProfile]        = useState<UserProfile | null>(null);
  const [enrolled,       setEnrolled]       = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  async function loadProfile(u: User) {
    const db = tryGetDb();
    if (!db) {
      setProfile(null);
      setEnrolled(false);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    try {
      const [p, partSnap] = await Promise.all([
        getUserProfile(u.uid),
        getDoc(doc(db, `${EVENT_BASE}/participants/${u.uid}`)),
      ]);
      setProfile(p);
      if (partSnap.exists()) {
        const d = partSnap.data();
        const goals  = (d?.event_signal_profile?.goals  as unknown[]) ?? [];
        const tracks = (d?.event_signal_profile?.tech_tracks as unknown[]) ?? [];
        setEnrolled(goals.length > 0 || tracks.length > 0);
      } else {
        setEnrolled(false);
      }
    } catch {
      setProfile(null);
      setEnrolled(false);
    } finally {
      setProfileLoading(false);
    }
  }

  async function refreshProfile() {
    if (user) await loadProfile(user);
  }

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u);
      } else {
        setProfile(null);
        setEnrolled(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, profile, enrolled, loading, profileLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
