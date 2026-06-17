"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getSkoUserProfile } from "@/lib/skoAuth";
import type { SkoUserProfile } from "@/types/sko";

interface SkoAuthContextValue {
  user: User | null;
  profile: SkoUserProfile | null;
  profileComplete: boolean;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const SkoAuthContext = createContext<SkoAuthContextValue>({
  user: null,
  profile: null,
  profileComplete: false,
  isAdmin: false,
  loading: true,
  refreshProfile: async () => {},
});

export function SkoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SkoUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (u: User) => {
    const p = await getSkoUserProfile(u.uid);
    setProfile(p);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user);
  }, [user, loadProfile]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
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
