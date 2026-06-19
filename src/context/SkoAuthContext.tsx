"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, firebaseConfigured } from "@/lib/firebase";
import { getSkoUserProfile } from "@/lib/skoAuth";
import { clearLastSkoFirestoreError } from "@/lib/skoFirestoreDebug";
import type { SkoUserProfile } from "@/types/sko";

const PROFILE_LOAD_TIMEOUT_MS = 8000;

interface SkoAuthContextValue {
  user: User | null;
  profile: SkoUserProfile | null;
  profileComplete: boolean;
  isAdmin: boolean;
  loading: boolean;
  profileError: string | null;
  profileTimedOut: boolean;
  refreshProfile: () => Promise<void>;
}

const SkoAuthContext = createContext<SkoAuthContextValue>({
  user: null,
  profile: null,
  profileComplete: false,
  isAdmin: false,
  loading: true,
  profileError: null,
  profileTimedOut: false,
  refreshProfile: async () => {},
});

export function SkoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SkoUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileTimedOut, setProfileTimedOut] = useState(false);
  const loadGen = useRef(0);

  const loadProfile = useCallback(async (u: User, route: string) => {
    const gen = ++loadGen.current;
    setProfileError(null);
    setProfileTimedOut(false);

    const timeout = window.setTimeout(() => {
      if (loadGen.current === gen) {
        setProfileTimedOut(true);
        setLoading(false);
      }
    }, PROFILE_LOAD_TIMEOUT_MS);

    try {
      const result = await getSkoUserProfile(u.uid, route);
      if (loadGen.current !== gen) return;
      setProfile(result.profile);
      setProfileError(result.error);
      if (!result.error) clearLastSkoFirestoreError();
    } catch {
      if (loadGen.current !== gen) return;
      setProfile(null);
      setProfileError("We could not load your SKO profile yet.");
    } finally {
      window.clearTimeout(timeout);
      if (loadGen.current === gen) {
        setLoading(false);
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    await loadProfile(user, "SkoAuthContext.refreshProfile");
  }, [user, loadProfile]);

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setLoading(true);
        await loadProfile(u, "SkoAuthContext.onAuthStateChanged");
      } else {
        setProfile(null);
        setProfileError(null);
        setProfileTimedOut(false);
        setLoading(false);
      }
    });
    return unsub;
  }, [loadProfile]);

  return (
    <SkoAuthContext.Provider
      value={{
        user,
        profile,
        profileComplete: Boolean(profile?.profileComplete),
        isAdmin: profile?.accessType === "se_team",
        loading,
        profileError,
        profileTimedOut,
        refreshProfile,
      }}
    >
      {children}
    </SkoAuthContext.Provider>
  );
}

export function useSkoAuth() {
  return useContext(SkoAuthContext);
}
