"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type CompassModuleId,
  type CompassSectionId,
  type CompassUiPreferences,
  COMPASS_MOBILE_BREAKPOINT,
  defaultCompassUiPreferences,
  readCompassUiPreferences,
  writeCompassUiPreferences,
} from "@/lib/compassUiPreferences";

export function useCompassUiPreferences() {
  const [prefs, setPrefs] = useState<CompassUiPreferences>(() =>
    defaultCompassUiPreferences(false),
  );
  const [isMobile, setIsMobile] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia(`(max-width: ${COMPASS_MOBILE_BREAKPOINT}px)`).matches;
    setIsMobile(mobile);
    setPrefs(readCompassUiPreferences(mobile));
    setHydrated(true);

    const mq = window.matchMedia(`(max-width: ${COMPASS_MOBILE_BREAKPOINT}px)`);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const persist = useCallback((next: CompassUiPreferences) => {
    setPrefs(next);
    writeCompassUiPreferences(next);
  }, []);

  const toggleSection = useCallback(
    (sectionId: CompassSectionId) => {
      const willExpand = !prefs.sections[sectionId];
      const nextSections = { ...prefs.sections };

      if (isMobile && willExpand) {
        for (const id of Object.keys(nextSections) as CompassSectionId[]) {
          nextSections[id] = false;
        }
      }
      nextSections[sectionId] = willExpand;

      persist({ ...prefs, sections: nextSections });
    },
    [prefs, isMobile, persist],
  );

  const setModuleVisible = useCallback(
    (moduleId: CompassModuleId, visible: boolean) => {
      persist({
        ...prefs,
        modules: { ...prefs.modules, [moduleId]: visible },
      });
    },
    [prefs, persist],
  );

  const isModuleVisible = useCallback(
    (moduleId: CompassModuleId) => prefs.modules[moduleId],
    [prefs.modules],
  );

  return {
    prefs,
    hydrated,
    isMobile,
    customizeOpen,
    setCustomizeOpen,
    toggleSection,
    setModuleVisible,
    isModuleVisible,
    isSectionExpanded: (id: CompassSectionId) => prefs.sections[id],
  };
}
