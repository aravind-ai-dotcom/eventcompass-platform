"use client";
// =============================================================================
// EventCompass — Agenda Panel
// src/components/experience/AgendaPanel.tsx
// Shows: Now · Upcoming · Later Today · My Agenda · Open Opportunities
// =============================================================================

import { useEffect, useState, useCallback } from "react";
import {
  getAgenda, removeAgendaItem, updateAgendaItemStatus,
  detectAgendaConflicts, findOpenTimeSlots, getAgendaSection, nowMinutes,
} from "@/services/agendaService";
import type { Agenda, AgendaItem, AgendaConflict, OpenTimeSlot } from "@/types/agenda";

// ── Demo seed shown when agenda is empty ──────────────────────────────────────

const DEMO_ITEMS: Omit<AgendaItem, "addedAt">[] = [
  { id:"d1", type:"session",          sourceCollection:"sessions",  sourceId:"s1",     title:"AI on IBM Z — Technical Breakout",      startTime:"09:00", endTime:"10:00", location:"Room 14B",          day:"Monday", status:"planned", track:"AI",    score:85, reason:"Top track match: AI" },
  { id:"d2", type:"champion_meeting", sourceCollection:"champions", sourceId:"c1",     title:"Meet Roy Boxwell — IBM Z Architect",    startTime:"12:00", endTime:"12:30", location:"Networking Lounge", day:"Monday", status:"planned",               reason:"Shared keywords: IBM Z, Architecture" },
  { id:"d3", type:"session",          sourceCollection:"sessions",  sourceId:"s2",     title:"Cloud Modernization Deep Dive",         startTime:"14:00", endTime:"15:00", location:"Hall A",            day:"Monday", status:"planned", track:"Cloud", score:72 },
  { id:"d4", type:"fun",              sourceCollection:"demo",      sourceId:"arcade", title:"TechXchange Arcade & Community Lounge", startTime:"17:30", endTime:"18:30", location:"Expo Zone",         day:"Monday", status:"planned",               reason:"Open slot — make it fun" },
];

const GAP_LINKS = [
  { label:"Meet a Champion",        href:"/champions",   icon:"◈" },
  { label:"Community Lounge",       href:"/communities", icon:"◉" },
  { label:"Meet the Expert",        href:"/champions",   icon:"◆" },
  { label:"Explore Sessions",       href:"/sessions",    icon:"▶" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <p style={{ color:"var(--accent)", fontSize:"0.68rem", fontWeight:680, textTransform:"uppercase", letterSpacing:"0.12em", margin:"0 0 10px" }}>{label}</p>;
}

function StatusBadge({ status }: { status: AgendaItem["status"] }) {
  const cfg: Record<string, [string, string]> = {
    planned:    ["transparent",  "var(--muted)"],
    registered: ["#DBEAFE",      "#1D4ED8"],
    attending:  ["#DCFCE7",      "#15803D"],
    completed:  ["#F3F4F6",      "var(--muted)"],
    dismissed:  ["#FEE2E2",      "#DC2626"],
  };
  const [bg, color] = cfg[status] ?? cfg.planned;
  return (
    <span style={{ fontSize:"0.65rem", padding:"1px 7px", background:bg, color, border:`1px solid ${color}22`, fontWeight:680, letterSpacing:"0.06em", textTransform:"uppercase" as const, whiteSpace:"nowrap" as const }}>
      {status}
    </span>
  );
}

function btnS(c: "accent"|"muted"|"danger") {
  const map = { accent:["var(--accent)","var(--accent)"], muted:["var(--line)","var(--muted)"], danger:["#DC2626","#DC2626"] };
  const [border, color] = map[c];
  return { display:"inline-flex" as const, alignItems:"center" as const, height:"28px", padding:"0 10px", border:`1px solid ${border}`, background:"transparent", color, fontSize:"0.75rem", fontFamily:"inherit", cursor:"pointer" as const, whiteSpace:"nowrap" as const };
}

function AgendaCard({ item, isNow, onRemove, onStatus }: {
  item: AgendaItem; isNow: boolean;
  onRemove: (id: string) => void;
  onStatus: (id: string, s: AgendaItem["status"]) => void;
}) {
  const typeLabel = item.type.replace(/_/g, " ");
  return (
    <div style={{ border: isNow ? "1px solid #EF4444" : "1px solid var(--line)", background:"var(--panel)", padding:"14px 16px", display:"flex", flexDirection:"column", gap:"8px" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"8px", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"6px", minWidth:0, flexWrap:"wrap" }}>
          {isNow && <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:"#EF4444", flexShrink:0, animation:"compass-pulse 1.2s ease-in-out infinite" }} />}
          <span style={{ color:"var(--text)", fontWeight:600, fontSize:"0.92rem", letterSpacing:"-0.01em" }}>{item.title}</span>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <p style={{ color:"var(--muted)", fontSize:"0.78rem", margin:0 }}>
        {[typeLabel, item.startTime && item.endTime ? `${item.startTime}–${item.endTime}` : "", item.location, item.track].filter(Boolean).join(" · ")}
      </p>
      {item.reason && <p style={{ color:"var(--accent)", fontSize:"0.78rem", margin:0, fontStyle:"italic" }}>{item.reason}</p>}
      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginTop:"2px" }}>
        {item.status !== "attending" && item.status !== "completed" && (
          <button style={btnS("accent")} onClick={() => onStatus(item.id, "attending")}>Mark attending</button>
        )}
        {item.status === "attending" && (
          <button style={{ ...btnS("accent"), borderColor:"#15803D", color:"#15803D" }} onClick={() => onStatus(item.id, "completed")}>✓ Done</button>
        )}
        <button style={btnS("muted")} onClick={() => onRemove(item.id)}>Remove</button>
      </div>
    </div>
  );
}

function ConflictCard({ conflict, onKeepBoth, onResolve }: {
  conflict: AgendaConflict; onKeepBoth: () => void; onResolve: () => void;
}) {
  return (
    <div style={{ padding:"12px 16px", background:"#FEF2F2", border:"1px solid #DC2626", display:"flex", flexDirection:"column", gap:"8px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
        <span style={{ color:"#DC2626", fontSize:"0.72rem", fontWeight:680, textTransform:"uppercase" as const, letterSpacing:"0.1em" }}>⚠ Schedule conflict</span>
        <span style={{ color:"#DC2626", fontSize:"0.78rem" }}>{conflict.overlapMinutes} min overlap</span>
      </div>
      <p style={{ color:"#991B1B", fontSize:"0.84rem", margin:0, lineHeight:1.4 }}>
        <strong>{conflict.itemA.title}</strong> overlaps with <strong>{conflict.itemB.title}</strong>
      </p>
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
        <button style={btnS("muted")} onClick={onKeepBoth}>Keep both</button>
        <button style={btnS("danger")} onClick={onResolve}>Remove conflict</button>
        <a href="/sessions" style={{ ...btnS("muted"), textDecoration:"none" }}>View options</a>
      </div>
    </div>
  );
}

function OpenSlotCard({ slot }: { slot: OpenTimeSlot }) {
  return (
    <div style={{ padding:"12px 16px", border:"1px dashed var(--line)", background:"var(--panel)", display:"flex", flexDirection:"column", gap:"8px" }}>
      <p style={{ color:"var(--muted)", fontSize:"0.72rem", fontWeight:680, textTransform:"uppercase" as const, letterSpacing:"0.1em", margin:0 }}>Open · {slot.label}</p>
      <p style={{ color:"var(--soft)", fontSize:"0.84rem", margin:0 }}>Compass can help fill this gap.</p>
      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
        {GAP_LINKS.map(g => (
          <a key={g.label} href={g.href} style={{ display:"inline-flex", alignItems:"center", gap:"4px", height:"26px", padding:"0 10px", border:"1px solid var(--line)", color:"var(--soft)", fontSize:"0.74rem", textDecoration:"none", whiteSpace:"nowrap" as const }}>
            <span aria-hidden style={{ fontSize:"0.6rem", color:"var(--accent)" }}>{g.icon}</span>{g.label}
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props { participantId: string; selectedDay?: string; }

export default function AgendaPanel({ participantId, selectedDay = "Monday" }: Props) {
  const [agenda,    setAgenda]    = useState<Agenda | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [conflicts, setConflicts] = useState<AgendaConflict[]>([]);
  const [openSlots, setOpenSlots] = useState<OpenTimeSlot[]>([]);
  const [isDemo,    setIsDemo]    = useState(false);
  const now = nowMinutes();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let ag = await getAgenda(participantId);
      if (ag.items.length === 0) {
        ag = { participantId, items: DEMO_ITEMS.map(i => ({ ...i, addedAt: new Date().toISOString() })) };
        setIsDemo(true);
      } else { setIsDemo(false); }
      setAgenda(ag);
      setConflicts(detectAgendaConflicts(ag.items));
      setOpenSlots(findOpenTimeSlots(ag.items, selectedDay));
    } catch { setAgenda({ participantId, items: [] }); }
    finally  { setLoading(false); }
  }, [participantId, selectedDay]);

  useEffect(() => { load(); }, [load]);

  function applyUpdate(updated: Agenda) {
    if (isDemo) return; // demo mutations are local only
    setAgenda(updated);
    setConflicts(detectAgendaConflicts(updated.items));
    setOpenSlots(findOpenTimeSlots(updated.items, selectedDay));
  }

  async function handleRemove(id: string) {
    if (isDemo) { setAgenda(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== id) } : prev); return; }
    applyUpdate(await removeAgendaItem(participantId, id));
  }

  async function handleStatus(id: string, status: AgendaItem["status"]) {
    if (isDemo) { setAgenda(prev => prev ? { ...prev, items: prev.items.map(i => i.id === id ? { ...i, status } : i) } : prev); return; }
    applyUpdate(await updateAgendaItemStatus(participantId, id, status));
  }

  const items      = agenda?.items ?? [];
  const dayItems   = items.filter(i => !i.day || i.day === selectedDay);
  const nowItems   = dayItems.filter(i => getAgendaSection(i, now) === "now");
  const upcoming   = dayItems.filter(i => getAgendaSection(i, now) === "upcoming");
  const later      = dayItems.filter(i => getAgendaSection(i, now) === "later");
  const otherDays  = items.filter(i => i.day && i.day !== selectedDay);

  if (loading) return <p style={{ color:"var(--muted)", fontSize:"0.9rem", padding:"16px 0" }}>Loading agenda…</p>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"24px" }}>

      {isDemo && (
        <div style={{ padding:"10px 14px", border:"1px solid var(--accent)", background:"var(--panel)" }}>
          <p style={{ color:"var(--accent)", fontSize:"0.78rem", margin:0 }}>
            Demo agenda. <a href="/enroll" style={{ color:"var(--accent)", fontWeight:650 }}>Build your real Compass</a> to save a personal plan.
          </p>
        </div>
      )}

      {conflicts.map((c, i) => (
        <ConflictCard key={i} conflict={c}
          onKeepBoth={() => setConflicts(p => p.filter((_,j) => j !== i))}
          onResolve={async () => { await handleRemove(c.itemB.id); setConflicts(p => p.filter((_,j) => j !== i)); }}
        />
      ))}

      {items.length === 0 && (
        <div style={{ padding:"32px 0", textAlign:"center" }}>
          <p style={{ color:"var(--text)", fontSize:"1.1rem", fontWeight:520, margin:"0 0 8px" }}>Build your first Compass plan.</p>
          <p style={{ color:"var(--muted)", fontSize:"0.9rem", margin:"0 0 20px" }}>Add sessions, schedule champion meetings, and join community events.</p>
          <div style={{ display:"flex", gap:"10px", justifyContent:"center", flexWrap:"wrap" }}>
            {[["Explore Sessions","/sessions"],["Meet Champions","/champions"],["Join Communities","/communities"]].map(([l,h]) => (
              <a key={h} href={h} className="btn-secondary" style={{ fontSize:"0.88rem" }}>{l}</a>
            ))}
          </div>
        </div>
      )}

      {nowItems.length > 0 && (
        <div><SectionLabel label="Now" />
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {nowItems.map(i => <AgendaCard key={i.id} item={i} isNow onRemove={handleRemove} onStatus={handleStatus} />)}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div><SectionLabel label="Upcoming" />
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {upcoming.map(i => <AgendaCard key={i.id} item={i} isNow={false} onRemove={handleRemove} onStatus={handleStatus} />)}
          </div>
        </div>
      )}

      {later.length > 0 && (
        <div><SectionLabel label="Later today" />
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {later.map(i => <AgendaCard key={i.id} item={i} isNow={false} onRemove={handleRemove} onStatus={handleStatus} />)}
          </div>
        </div>
      )}

      {otherDays.length > 0 && (
        <div><SectionLabel label="My agenda — other days" />
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {otherDays.map(i => <AgendaCard key={i.id} item={i} isNow={false} onRemove={handleRemove} onStatus={handleStatus} />)}
          </div>
        </div>
      )}

      {openSlots.length > 0 && (
        <div>
          <SectionLabel label="Open opportunities" />
          <p style={{ color:"var(--muted)", fontSize:"0.84rem", margin:"0 0 12px" }}>
            {openSlots.length} open window{openSlots.length > 1 ? "s" : ""} in your {selectedDay} schedule.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {openSlots.map((s, i) => <OpenSlotCard key={i} slot={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}
