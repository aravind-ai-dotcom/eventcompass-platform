"use client";

import { useEffect, useState } from "react";
import { SkoSetupShell } from "@/components/setup/SkoSetupShell";
import { getActiveEdition, saveEdition } from "@/services/sko/skoFirestoreService";
import type { SkoEdition } from "@/types/sko";

export default function SkoEditionSetupPage() {
  const [edition, setEdition] = useState<SkoEdition | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void getActiveEdition().then(setEdition);
  }, []);

  async function handleSave() {
    if (!edition) return;
    await saveEdition(edition);
    setMessage("Edition saved.");
  }

  if (!edition) {
    return (
      <SkoSetupShell title="Edition Setup" subtitle="Loading edition…">
        <p className="setup-message">No edition found. Run npm run seed:sko-product first.</p>
      </SkoSetupShell>
    );
  }

  return (
    <SkoSetupShell title="Edition Setup" subtitle={`Edition ${edition.id}`}>
      <div className="setup-editor">
        <label className="setup-field">
          Label
          <input className="setup-input" value={edition.label} onChange={e => setEdition({ ...edition, label: e.target.value })} />
        </label>
        <label className="setup-field">
          Theme
          <input className="setup-input" value={edition.theme} onChange={e => setEdition({ ...edition, theme: e.target.value })} />
        </label>
        <label className="setup-field">
          Headline
          <input className="setup-input" value={edition.headline} onChange={e => setEdition({ ...edition, headline: e.target.value })} />
        </label>
        <label className="setup-check">
          <input type="checkbox" checked={edition.active} onChange={e => setEdition({ ...edition, active: e.target.checked })} />
          Active edition
        </label>
        <button type="button" className="setup-btn setup-btn--primary" onClick={() => void handleSave()}>Save edition</button>
        {message && <p className="setup-message">{message}</p>}
      </div>
    </SkoSetupShell>
  );
}
