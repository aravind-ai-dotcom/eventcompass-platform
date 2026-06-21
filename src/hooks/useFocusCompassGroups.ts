"use client";

import { useCallback, useEffect, useState } from "react";
import {
  COMPASS_MOBILE_BREAKPOINT,
  defaultFocusCompassGroups,
  type FocusCompassGroupId,
  type FocusCompassGroupState,
  readFocusCompassGroups,
  writeFocusCompassGroups,
} from "@/lib/focusCompassPreferences";

export function useFocusCompassGroups() {
  const [groups, setGroups] = useState<FocusCompassGroupState>(() =>
    defaultFocusCompassGroups(false),
  );
  const [isMobile, setIsMobile] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia(`(max-width: ${COMPASS_MOBILE_BREAKPOINT}px)`).matches;
    setIsMobile(mobile);
    setGroups(readFocusCompassGroups(mobile));
    setHydrated(true);

    const mq = window.matchMedia(`(max-width: ${COMPASS_MOBILE_BREAKPOINT}px)`);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const persist = useCallback((next: FocusCompassGroupState) => {
    setGroups(next);
    writeFocusCompassGroups(next);
  }, []);

  const toggleGroup = useCallback(
    (groupId: FocusCompassGroupId) => {
      const willExpand = !groups[groupId];
      const next = { ...groups };

      if (isMobile && willExpand) {
        for (const id of Object.keys(next) as FocusCompassGroupId[]) {
          next[id] = false;
        }
      }
      next[groupId] = willExpand;
      persist(next);
    },
    [groups, isMobile, persist],
  );

  const isGroupExpanded = useCallback(
    (groupId: FocusCompassGroupId) => groups[groupId],
    [groups],
  );

  return {
    hydrated,
    isMobile,
    toggleGroup,
    isGroupExpanded,
  };
}
