"use client";
// =============================================================================
// EventCompass — Auth Context
// src/context/AuthContext.tsx
//
// Provides:
//   user          — current Firebase User (null when signed out)
//   profile       — Firestore UserProfile (null until loaded)
//   loading       — true while auth state is being determined
//   profileLoading— true while Firestore profile is being fetched
//
// Wrap the root layout with <AuthProvider> to make auth state
// available to every component.
// =============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth }                          from "@/lib/firebase";
import { getUserProfile, type UserProfile } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user:           User | null;
  profile:        UserProfile | null;
  loading:        boolean;
  profileLoading: boolean;
  /** Call after profile write so context refreshes without page reload */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user:           null,
  profile:        null,
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
  const [loading,        setLoading]        = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  async function loadProfile(u: User) {
    setProfileLoading(true);
    try {
      const p = await getUserProfile(u.uid);
      setProfile(p);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }

  async function refreshProfile() {
    if (user) await loadProfile(user);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileLoading, refreshProfile }}>
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
