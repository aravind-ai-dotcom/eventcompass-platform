"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSkoAuth } from "@/context/SkoAuthContext";
import { downloadAgendaBriefPdf } from "@/lib/skoAgendaPdf";
import {
  addBriefEntry,
  isInBrief,
  loadBriefEntries,
  type SkoBriefEntry,
} from "@/lib/skoBriefStore";
import { resolveSkoVideoSource } from "@/lib/skoVideoEmbed";
import { SKO_SPEAKER_PORTRAITS } from "@/lib/skoSpeakerPortraits";
import {
  listContentAssets,
  listContentClips,
  listContentItems,
  listSpeakers,
} from "@/services/sko/skoFirestoreService";
import type {
  SkoAgendaType,
  SkoContentAsset,
  SkoContentClip,
  SkoContentItem,
  SkoSpeaker,
} from "@/types/sko";

const CATEGORY_LABELS: Record<string, string> = {
  opening: "Opening",
  conversation: "Client Conversation",
  strategy: "Growth Strategy",
  frontiers: "Must Win",
  product: "Product",
  tools: "RevTech",
  community: "Community",
  platform: "Platform",
  partner: "Partner",
  recharge: "Recharge",
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function speakerPortrait(speaker: SkoSpeaker): string {
  if (speaker.imageUrl?.startsWith("/speakers/")) return speaker.imageUrl;
  if (speaker.geoId === "Japan") return SKO_SPEAKER_PORTRAITS.maleJapanese;
  return SKO_SPEAKER_PORTRAITS.male01;
}

function IconW3() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text x="8" y="11" textAnchor="middle" fontSize="7" fill="currentColor" fontFamily="IBM Plex Sans, sans-serif">W3</text>
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor">
      <path d="M3.5 2A1.5 1.5 0 002 3.5v9A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0012.5 2h-9zM5 6h1.8v5.5H5V6zm.9-2.3a1 1 0 110 2 1 1 0 010-2zM7.8 6H9.6v.8c.3-.6 1.1-1 2-1 2.1 0 2.5 1.4 2.5 3.2V11.5H12.3V9.5c0-.8-.1-1.8-1.1-1.8-1.1 0-1.3.9-1.3 1.8v2H7.8V6z" />
    </svg>
  );
}

function IconSlack() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor">
      <path d="M3.5 9.5A1.5 1.5 0 012 8V6.5A1.5 1.5 0 013.5 5H5v4.5H3.5zM6.5 9.5V5H8a1.5 1.5 0 011.5 1.5V8a1.5 1.5 0 01-1.5 1.5H6.5zm3 0H8V5h1.5A1.5 1.5 0 0111 6.5V8a1.5 1.5 0 01-1.5 1.5H9.5zm3-3A1.5 1.5 0 0114 5V3.5A1.5 1.5 0 0112.5 2H11v4.5h1.5zM11 6.5V11h1.5A1.5 1.5 0 0114 9.5V8a1.5 1.5 0 00-1.5-1.5H11zm-4.5 3H5V11h1.5A1.5 1.5 0 018 9.5V8a1.5 1.5 0 00-1.5-1.5H6.5zM5 3.5A1.5 1.5 0 016.5 2H8v4.5H6.5A1.5 1.5 0 015 5V3.5z" />
    </svg>
  );
}

const ASSET_ICONS: Record<string, React.ReactNode> = {
  video: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="2" y="4" width="16" height="12" rx="1" />
      <polygon points="9,8 14,10 9,12" fill="currentColor" stroke="none" />
    </svg>
  ),
  pdf: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M5 2h8l4 4v12H5V2z" />
      <path d="M13 2v4h4" />
      <path d="M7 11h6M7 14h4" />
    </svg>
  ),
  pptx: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="3" y="3" width="14" height="14" rx="1" />
      <path d="M7 8h6M7 11h4" />
    </svg>
  ),
  docx: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M5 2h8l4 4v12H5V2z" />
      <path d="M7 10l2 3 2-3 2 3" />
    </svg>
  ),
  newsroom: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 4h14v12H3z" />
      <path d="M6 8h8M6 11h8M6 14h5" />
    </svg>
  ),
};

function categoryLabel(type: SkoAgendaType | string): string {
  return CATEGORY_LABELS[type] ?? type;
}

export default function SkoExploreView() {
  const { user } = useSkoAuth();
  const uid = user?.uid ?? "guest";

  const [agenda, setAgenda] = useState<SkoContentItem[]>([]);
  const [clips, setClips] = useState<SkoContentClip[]>([]);
  const [speakers, setSpeakers] = useState<SkoSpeaker[]>([]);
  const [assets, setAssets] = useState<SkoContentAsset[]>([]);
  const [selectedId, setSelectedId] = useState<string>("content-1");
  const [briefEntries, setBriefEntries] = useState<SkoBriefEntry[]>([]);
  const [embedFailed, setEmbedFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileRosOpen, setMobileRosOpen] = useState(false);

  useEffect(() => {
    setBriefEntries(loadBriefEntries(uid));
  }, [uid]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [items, allClips, allSpeakers, allAssets] = await Promise.all([
          listContentItems(),
          listContentClips(),
          listSpeakers(),
          listContentAssets(),
        ]);
        setAgenda(items);
        setClips(allClips);
        setSpeakers(allSpeakers);
        setAssets(allAssets);
        if (items[0] && !items.find(i => i.id === selectedId)) {
          setSelectedId(items[0].id);
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => agenda.find(i => i.id === selectedId) ?? agenda[0] ?? null,
    [agenda, selectedId],
  );

  const selectedClips = useMemo(
    () => clips.filter(c => c.contentId === selected?.id).slice(0, 4),
    [clips, selected],
  );

  const selectedSpeakers = useMemo(() => {
    if (!selected) return [];
    const ids = selected.speakerIds.slice(0, 3);
    return ids
      .map(id => speakers.find(s => s.id === id))
      .filter((s): s is SkoSpeaker => Boolean(s));
  }, [selected, speakers]);

  const selectedAssets = useMemo(
    () => assets.filter(a => a.contentId === selected?.id),
    [assets, selected],
  );

  const video = useMemo(
    () =>
      selected
        ? resolveSkoVideoSource(
            selected.mediaCenterUrl,
            selected.fallbackYoutubeUrl,
            selected.videoProvider,
          )
        : null,
    [selected],
  );

  useEffect(() => {
    setEmbedFailed(false);
  }, [selectedId]);

  const handleAddContent = useCallback(() => {
    if (!selected) return;
    const next = addBriefEntry(uid, {
      contentId: selected.id,
      title: selected.title,
      excerpt: selected.description,
      addedAt: new Date().toISOString(),
    });
    setBriefEntries(next);
  }, [selected, uid]);

  const handleAddClip = useCallback(
    (clip: SkoContentClip) => {
      const next = addBriefEntry(uid, {
        contentId: clip.contentId,
        clipId: clip.id,
        title: clip.title,
        excerpt: clip.teaserQuote,
        addedAt: new Date().toISOString(),
      });
      setBriefEntries(next);
    },
    [uid],
  );

  const contentAdded = selected ? isInBrief(briefEntries, selected.id) : false;
  const briefCount = briefEntries.length;

  function handleAssetClick(asset: SkoContentAsset) {
    if (asset.type === "pdf" && selected) {
      downloadAgendaBriefPdf(selected, selectedClips);
      return;
    }
    if (asset.url && asset.url !== "#") {
      window.open(asset.url, "_blank", "noopener,noreferrer");
    }
  }

  if (loading) {
    return (
      <section className="sko-section sko-explore">
        <p className="sko-muted">Loading Explore SKO…</p>
      </section>
    );
  }

  if (!selected) {
    return (
      <section className="sko-section sko-explore">
        <p className="sko-muted">No agenda items available.</p>
      </section>
    );
  }

  return (
    <section className="sko-section sko-explore">
      <header className="sko-explore-header">
        <div>
          <p className="sko-kicker">SKO2H 2026 · Run of Show Intelligence</p>
          <h1>Explore SKO</h1>
          <p className="sko-lead">
            Navigate the full SKO agenda, replay key moments, and add seller-ready intelligence to My Brief.
          </p>
        </div>
        {briefCount > 0 && (
          <span className="sko-brief-count" aria-label={`${briefCount} items in My Brief`}>
            My Brief · {briefCount}
          </span>
        )}
      </header>

      <div className="sko-explore-layout">
        <aside className={`sko-ros${mobileRosOpen ? " is-open" : ""}`}>
          <div className="sko-ros-head">
            <h2>Run of Show</h2>
            <button
              type="button"
              className="sko-ros-toggle"
              onClick={() => setMobileRosOpen(v => !v)}
              aria-expanded={mobileRosOpen}
            >
              {mobileRosOpen ? "Close" : "Agenda"}
            </button>
          </div>
          <ol className="sko-ros-list">
            {agenda.map(item => {
              const active = item.id === selected.id;
              const added = isInBrief(briefEntries, item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`sko-ros-item${active ? " is-active" : ""}`}
                    onClick={() => {
                      setSelectedId(item.id);
                      setMobileRosOpen(false);
                    }}
                  >
                    <span className="sko-ros-num">{String(item.agendaOrder).padStart(2, "0")}</span>
                    <span className="sko-ros-body">
                      <span className="sko-ros-title">{item.title}</span>
                      <span className="sko-ros-meta">
                        <span>{formatDuration(item.durationMinutes)}</span>
                        <span className="sko-pill sko-pill--sm">{categoryLabel(item.agendaType)}</span>
                        {added && <span className="sko-added-badge">Added</span>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="sko-explore-detail">
          <header className="sko-detail-header">
            <div className="sko-detail-intro">
              <h2>{selected.title}</h2>
              <p>{selected.description}</p>
              <div className="sko-chip-row">
                <span className="sko-pill">{categoryLabel(selected.agendaType)}</span>
                {selected.technologyTracks.map(t => (
                  <span key={t} className="sko-chip sko-chip--static">{t}</span>
                ))}
              </div>
            </div>
            <button
              type="button"
              className={`sko-btn sko-btn--primary sko-btn-brief${contentAdded ? " is-added" : ""}`}
              onClick={handleAddContent}
              disabled={contentAdded}
            >
              {contentAdded ? "Added to My Brief" : "Add to My Brief"}
            </button>
          </header>

          <div className="sko-video-panel">
            {video?.embedUrl && !embedFailed ? (
              <iframe
                title={`${selected.title} video`}
                src={video.embedUrl}
                className="sko-video-iframe"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={() => setEmbedFailed(true)}
              />
            ) : (
              <div className="sko-video-fallback">
                <span className="sko-media-badge">IBM Media Center</span>
                <p className="sko-video-fallback-title">{selected.title}</p>
                <p className="sko-muted">Session replay · {video?.label ?? "Video"}</p>
                {video?.openUrl && (
                  <a
                    href={video.openUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sko-btn sko-btn--secondary"
                  >
                    Open video
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="sko-detail-columns">
            <section className="sko-moments-panel">
              <h3>Moments That Matter</h3>
              <ul className="sko-moment-cards">
                {selectedClips.map(clip => {
                  const clipAdded = isInBrief(briefEntries, clip.contentId, clip.id);
                  return (
                    <li key={clip.id} className="sko-moment-card">
                      <time className="sko-moment-time">{clip.startTime}</time>
                      <h4>{clip.title}</h4>
                      <blockquote>{clip.teaserQuote}</blockquote>
                      <dl className="sko-moment-meta">
                        <div>
                          <dt>Why it matters</dt>
                          <dd>{clip.whyItMatters}</dd>
                        </div>
                        <div>
                          <dt>Suggested action</dt>
                          <dd>{clip.suggestedAction}</dd>
                        </div>
                      </dl>
                      <button
                        type="button"
                        className={`sko-btn sko-btn--ghost sko-btn-moment${clipAdded ? " is-added" : ""}`}
                        onClick={() => handleAddClip(clip)}
                        disabled={clipAdded}
                      >
                        {clipAdded ? "Moment added" : "Add moment to My Brief"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <div className="sko-side-panels">
              <section className="sko-speakers-panel">
                <h3>Speakers</h3>
                <ul className="sko-speaker-cards">
                  {selectedSpeakers.map(sp => (
                    <li key={sp.id} className="sko-speaker-card">
                      <Image
                        src={speakerPortrait(sp)}
                        alt={sp.displayName}
                        width={72}
                        height={72}
                        className="sko-speaker-photo"
                      />
                      <div className="sko-speaker-info">
                        <strong>{sp.displayName}</strong>
                        <span>{sp.title}</span>
                        <span className="sko-muted">{sp.organization}</span>
                        <div className="sko-speaker-links">
                          {sp.w3Url && (
                            <a href={sp.w3Url} target="_blank" rel="noopener noreferrer" aria-label={`${sp.displayName} W3`} title="W3">
                              <IconW3 />
                            </a>
                          )}
                          <a
                            href={sp.linkedinUrl ?? "https://www.linkedin.com"}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${sp.displayName} LinkedIn`}
                            title="LinkedIn"
                          >
                            <IconLinkedIn />
                          </a>
                          <a
                            href={sp.slackHandle ? `slack://user?team=&id=${sp.slackHandle}` : "#"}
                            aria-label={`${sp.displayName} Slack`}
                            title="Slack"
                          >
                            <IconSlack />
                          </a>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="sko-assets-panel">
                <h3>Assets</h3>
                <div className="sko-asset-bar">
                  {(selectedAssets.length
                    ? selectedAssets
                    : [
                        { id: "a-v", type: "video" as const, label: "Video" },
                        { id: "a-p", type: "pdf" as const, label: "PDF" },
                        { id: "a-pp", type: "pptx" as const, label: "PPTX" },
                        { id: "a-d", type: "docx" as const, label: "DOCX" },
                        { id: "a-n", type: "newsroom" as const, label: "News" },
                      ]
                  ).map(asset => (
                    <button
                      key={asset.id}
                      type="button"
                      className="sko-asset-btn"
                      title={asset.label}
                      onClick={() =>
                        "url" in asset && asset.url
                          ? handleAssetClick(asset as SkoContentAsset)
                          : asset.type === "pdf" && selected
                            ? downloadAgendaBriefPdf(selected, selectedClips)
                            : undefined
                      }
                    >
                      {ASSET_ICONS[asset.type] ?? ASSET_ICONS.pdf}
                      <span>{asset.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
