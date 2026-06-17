"use client";

import { useMemo, useState } from "react";
import { useSkoPodcastPlayback } from "@/hooks/useSkoPodcastPlayback";
import { useStopAudioOnRouteChange } from "@/hooks/useSkoAudioPlayer";
import { isChineseBriefingEnabled, labelForKey } from "@/lib/skoLocale";
import { SKO_VOICE_OPTIONS, type SkoVoiceId } from "@/lib/skoPodcastVoice";
import type { SkoPodcast, SkoPodcastFormat, SkoPodcastLanguage } from "@/types/sko";
import { SKO_PODCAST_FORMATS } from "@/types/sko";

interface Props {
  geoId: string;
  marketId?: string;
  podcasts: SkoPodcast[];
}

const LANGUAGE_OPTIONS: { id: SkoPodcastLanguage; label: string }[] = [
  { id: "en-US", label: "English" },
  { id: "zh-CN", label: "简体中文" },
  { id: "zh-TW", label: "繁體中文" },
];

export default function SkoPodcastModule({ geoId, marketId, podcasts }: Props) {
  const isApac = isChineseBriefingEnabled(geoId, marketId);
  const [format, setFormat] = useState<SkoPodcastFormat>("seller_podcast_15min");
  const [language, setLanguage] = useState<SkoPodcastLanguage>("en-US");
  const [voiceId, setVoiceId] = useState<SkoVoiceId>("warm");

  const selected = useMemo(() => {
    return (
      podcasts.find(p => p.format === format && p.language === language)
      ?? podcasts.find(p => p.format === format)
      ?? podcasts[0]
    );
  }, [podcasts, format, language]);

  const {
    playing,
    loading,
    error,
    canPlay,
    togglePlay,
    restart,
    stop,
    previewVoice,
    hasStoredAudio,
  } = useSkoPodcastPlayback({
    script: selected?.script,
    language,
    voiceId,
    storedAudioUrl: selected?.audioUrl || undefined,
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

      <div className="sko-enroll-section">
        <h3>Language</h3>
        <div className="sko-chip-row">
          {LANGUAGE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              className={`sko-chip${language === opt.id ? " is-selected" : ""}`}
              onClick={() => setLanguage(opt.id)}
              disabled={opt.id !== "en-US" && !isApac}
              title={opt.id !== "en-US" && !isApac ? "Available for APAC, GCG, and HK markets" : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sko-enroll-section">
        <h3>Voice</h3>
        <div className="sko-voice-buttons">
          {SKO_VOICE_OPTIONS.map(voice => (
            <div key={voice.id} className="sko-voice-option">
              <button
                type="button"
                className={`sko-format-card sko-voice-card${voiceId === voice.id ? " is-selected" : ""}`}
                onClick={() => setVoiceId(voice.id)}
              >
                <strong>{voice.label}</strong>
              </button>
              <button
                type="button"
                className="sko-btn sko-btn--ghost sko-voice-preview"
                onClick={() => previewVoice(voice.sampleUrl)}
                aria-label={`Preview ${voice.label}`}
              >
                Preview
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="sko-audio-controls">
        <button
          type="button"
          className="sko-btn sko-btn--primary"
          onClick={() => void togglePlay()}
          disabled={!canPlay || loading}
        >
          {loading ? "Generating…" : playing ? "Pause" : "Play"}
        </button>
        <button type="button" className="sko-btn" onClick={() => void restart()} disabled={!canPlay || loading}>
          Restart
        </button>
      </div>

      {error && <p className="sko-error">{error}</p>}

      {!canPlay && (
        <p className="sko-muted">No briefing script available for this format yet.</p>
      )}

      {canPlay && !hasStoredAudio && language === "en-US" && (
        <p className="sko-muted">Audio is generated on demand using your selected voice.</p>
      )}

      {canPlay && language !== "en-US" && (
        <p className="sko-muted">Chinese playback uses browser speech synthesis for this prototype.</p>
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
