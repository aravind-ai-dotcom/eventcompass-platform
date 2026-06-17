"use client";

import { useMemo, useState } from "react";
import { useSkoAudioPlayer, useStopAudioOnRouteChange } from "@/hooks/useSkoAudioPlayer";
import { isChineseBriefingEnabled, labelForKey } from "@/lib/skoLocale";
import type { SkoPodcast, SkoPodcastFormat, SkoPodcastLanguage } from "@/types/sko";
import { SKO_PODCAST_FORMATS } from "@/types/sko";

interface Props {
  userId: string;
  geoId: string;
  marketId?: string;
  podcasts: SkoPodcast[];
}

const LANGUAGE_OPTIONS: { id: SkoPodcastLanguage; label: string }[] = [
  { id: "en-US", label: "English" },
  { id: "zh-CN", label: "简体中文" },
  { id: "zh-TW", label: "繁體中文" },
];

export default function SkoPodcastModule({ userId, geoId, marketId, podcasts }: Props) {
  const isApac = isChineseBriefingEnabled(geoId, marketId);
  const [format, setFormat] = useState<SkoPodcastFormat>("seller_podcast_15min");
  const [language, setLanguage] = useState<SkoPodcastLanguage>("en-US");
  const [voice, setVoice] = useState("Warm narrator");

  const selected = useMemo(() => {
    return podcasts.find(p => p.format === format && p.language === language)
      ?? podcasts.find(p => p.format === format)
      ?? podcasts[0];
  }, [podcasts, format, language]);

  const { playing, togglePlay, restart, stop, hasAudio } = useSkoAudioPlayer({
    audioUrl: selected?.audioUrl,
  });

  useStopAudioOnRouteChange(stop);

  return (
    <article id="podcast" className="sko-panel sko-podcast-module">
      <header>
        <p className="sko-kicker">Podcast · {isApac ? labelForKey("Podcast Summary", "zh-CN") : "Podcast"}</p>
        <h2>Your SKO Briefing Podcast</h2>
      </header>

      <div className="sko-podcast-formats">
        {SKO_PODCAST_FORMATS.map(f => (
          <button
            key={f.id}
            type="button"
            className={`sko-format-card${format === f.id ? " is-selected" : ""}`}
            onClick={() => setFormat(f.id)}
          >
            <strong>{f.label}</strong>
            <span>{f.minutes} min</span>
          </button>
        ))}
      </div>

      {isApac && (
        <div className="sko-enroll-section">
          <h3>{labelForKey("Listen in Chinese", "zh-CN")} / Language</h3>
          <div className="sko-chip-row">
            {LANGUAGE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                className={`sko-chip${language === opt.id ? " is-selected" : ""}`}
                onClick={() => setLanguage(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sko-field-row">
        <label className="sko-field">
          <span>Voice</span>
          <select className="sko-select" value={voice} onChange={e => setVoice(e.target.value)}>
            <option value="Warm narrator">Warm narrator</option>
            <option value="Executive brief">Executive brief</option>
            <option value="Field seller">Field seller</option>
          </select>
        </label>
      </div>

      <div className="sko-audio-controls">
        <button type="button" className="sko-btn sko-btn--primary" onClick={togglePlay} disabled={!hasAudio}>
          {playing ? "Pause" : "Play"}
        </button>
        <button type="button" className="sko-btn" onClick={restart} disabled={!hasAudio}>Restart</button>
        {selected?.audioUrl && (
          <a href={selected.audioUrl} download className="sko-btn sko-btn--ghost">Download MP3</a>
        )}
      </div>

      {!hasAudio && (
        <p className="sko-muted">
          Podcast audio will appear here once your briefing is generated for user {userId.slice(0, 8)}…
        </p>
      )}

      {selected?.script && (
        <details className="sko-script-details">
          <summary>View script</summary>
          <pre className="sko-pre">{selected.script}</pre>
        </details>
      )}
    </article>
  );
}
