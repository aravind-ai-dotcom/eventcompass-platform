"use client";

import { useCallback, useEffect, useState } from "react";
import {
  defaultFocusCompassUiPreferences,
  readFocusCompassUiPreferences,
  writeFocusCompassUiPreferences,
  type FocusCompassBlockId,
  type FocusCompassUiPreferences,
} from "@/lib/focusCompassUiPreferences";

export function useFocusCompassUiPreferences() {
  const [prefs, setPrefs] = useState<FocusCompassUiPreferences>(() =>
    defaultFocusCompassUiPreferences(),
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(readFocusCompassUiPreferences());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: FocusCompassUiPreferences) => {
    setPrefs(next);
    writeFocusCompassUiPreferences(next);
  }, []);

  const setBlockVisible = useCallback(
    (blockId: FocusCompassBlockId, visible: boolean) => {
      persist({
        blocks: { ...prefs.blocks, [blockId]: visible },
      });
    },
    [prefs, persist],
  );

  const isBlockVisible = useCallback(
    (blockId: FocusCompassBlockId) => prefs.blocks[blockId],
    [prefs.blocks],
  );

  return {
    prefs,
    hydrated,
    customizeOpen,
    setCustomizeOpen,
    setBlockVisible,
    isBlockVisible,
  };
}
