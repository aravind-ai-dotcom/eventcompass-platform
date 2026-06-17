import SetupAuthGate from "@/components/setup/SetupAuthGate";
import Link from "next/link";

export default function SetupHubPage() {
  return (
    <SetupAuthGate>
      <section className="setup-hub">
        <h1>Compass Setup</h1>
        <p className="setup-hub-lead">Choose an event admin console. Password: Compass1234!</p>
        <div className="setup-hub-grid">
          <article className="setup-hub-card">
            <h2>SKO2H 2026</h2>
            <p>Seller product, ingest, pulse, bilingual knowledge, and Chinese translation memory.</p>
            <ul>
              <li><Link href="/setup/sko/edition">Edition Setup</Link></li>
              <li><Link href="/setup/sko/knowledge">Knowledge (EN + 中文)</Link></li>
              <li><Link href="/setup/sko/summaries">Summaries</Link></li>
              <li><Link href="/setup/sko/translations">Translations</Link></li>
              <li><Link href="/setup/sko/ingest">Ingest</Link></li>
            </ul>
            <Link href="/setup/sko/edition" className="setup-btn setup-btn--primary">Open SKO Admin →</Link>
          </article>
          <article className="setup-hub-card">
            <h2>TechXchange 2026</h2>
            <p>Knowledge, voice pronunciation, STT normalization, and analytics.</p>
            <ul>
              <li><Link href="/setup/txc/knowledge">Knowledge</Link></li>
              <li><Link href="/setup/txc/voice">Voice</Link></li>
              <li><Link href="/setup/txc/stt">STT</Link></li>
            </ul>
            <Link href="/setup/txc/knowledge" className="setup-btn setup-btn--secondary">Open TXC Admin →</Link>
          </article>
        </div>
        <p className="setup-hub-foot">
          Seller SKO experience: <Link href="/sko">/sko</Link> · <Link href="/sko/login">/sko/login</Link> · <Link href="/sko/compass">/sko/compass</Link>
        </p>
      </section>
    </SetupAuthGate>
  );
}
