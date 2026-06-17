"use client";

import Link from "next/link";
import { isChineseBriefingEnabled, labelForKey, SKO_CHINESE_ACTIONS } from "@/lib/skoLocale";

interface Props {
  geoId?: string | null;
  marketId?: string | null;
  /** When on compass page, use in-page anchors; otherwise link to /sko/compass#… */
  onCompassPage?: boolean;
}

export default function SkoChineseBriefingBar({ geoId, marketId, onCompassPage = false }: Props) {
  if (!isChineseBriefingEnabled(geoId, marketId)) return null;

  return (
    <nav className="sko-chinese-bar" aria-label="Chinese briefing options">
      <p className="sko-chinese-bar-title">中文内容 · Chinese briefing</p>
      <div className="sko-chip-row">
        {SKO_CHINESE_ACTIONS.map(action => {
          const zhLabel = labelForKey(action.key, "zh-CN");
          const href = onCompassPage ? `#${action.anchor}` : action.href;
          return (
            <Link key={action.key} href={href} className="sko-chip sko-chip--zh">
              {zhLabel}
            </Link>
          );
        })}
      </div>
      <p className="sko-muted sko-chinese-bar-note">
        APAC · GCG · HK sellers — 简体中文 and 繁體中文 podcast options below.
      </p>
    </nav>
  );
}
