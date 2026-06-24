import Link from "next/link";
import type { CertificationJourneyRecord } from "@/types/certificationSession";
import { getCertificationEnrichment } from "@/lib/certificationProfile";

interface SessionDetailLike {
  id: string;
  title: string;
  session_type?: string;
  activity_type?: string;
  certification_id?: string;
  certification_code?: string;
  certification_url?: string;
  guide_url?: string;
  certification_level?: string;
  skills_measured?: string[];
  recommended_background?: string[];
  estimated_preparation_hours?: number;
  related_session_ids?: string[];
  related_lab_ids?: string[];
  related_champion_ids?: string[];
  related_huddle_ids?: string[];
  related_community_ids?: string[];
  tracks?: {
    primary_track?: string;
    topics?: string[];
    products?: string[];
  };
  description?: string;
  summary?: string;
  difficulty?: string;
}

interface CertificationSessionDetailProps {
  session: SessionDetailLike;
  allSessions: Array<{ id: string; title: string; activity_type?: string; session_type?: string }>;
  onClose: () => void;
}

function relatedTitles(
  ids: string[] | undefined,
  allSessions: CertificationSessionDetailProps["allSessions"],
): string[] {
  if (!ids?.length) return [];
  return ids
    .map(id => allSessions.find(s => s.id === id))
    .filter(Boolean)
    .map(s => s!.title);
}

export default function CertificationSessionDetail({
  session,
  allSessions,
  onClose,
}: CertificationSessionDetailProps) {
  const certId = session.certification_id ?? session.id;
  const enrichment: CertificationJourneyRecord | undefined =
    getCertificationEnrichment(certId);

  const guideUrl = session.guide_url ?? enrichment?.guide_url;
  const certUrl = session.certification_url ?? enrichment?.certification_url;
  const skills = session.skills_measured ?? enrichment?.skills_measured ?? [];
  const background = session.recommended_background ?? enrichment?.recommended_background ?? [];
  const level = session.certification_level ?? enrichment?.certification_level;
  const hours = session.estimated_preparation_hours ?? enrichment?.estimated_preparation_hours;
  const code = session.certification_code ?? enrichment?.certification_code;
  const description = session.summary ?? session.description ?? enrichment?.description;
  const track = session.tracks?.primary_track ?? enrichment?.track;
  const topics = session.tracks?.topics ?? enrichment?.topics ?? [];
  const products = session.tracks?.products ?? enrichment?.products ?? [];
  const difficulty = session.difficulty ?? enrichment?.difficulty;

  const breakouts = relatedTitles(
    session.related_session_ids ?? enrichment?.related_session_ids,
    allSessions,
  );
  const labs = relatedTitles(
    session.related_lab_ids ?? enrichment?.related_lab_ids,
    allSessions,
  );
  const communities = relatedTitles(
    session.related_community_ids ?? enrichment?.related_community_ids,
    allSessions,
  );
  const huddles = relatedTitles(
    session.related_huddle_ids ?? enrichment?.related_huddle_ids,
    allSessions,
  );

  return (
    <>
      <p className="cert-detail-kicker">
        Certification journey{code ? ` · ${code}` : ""}{level ? ` · ${level}` : ""}
      </p>
      <h2 id="session-modal-title">{session.title}</h2>
      {description && <p className="cert-detail-lead">{description}</p>}

      <dl className="cert-detail-meta">
        {difficulty && (
          <>
            <dt>Difficulty</dt>
            <dd>{difficulty}</dd>
          </>
        )}
        {track && (
          <>
            <dt>Technology track</dt>
            <dd>{track}</dd>
          </>
        )}
        {hours != null && (
          <>
            <dt>Estimated preparation</dt>
            <dd>{hours} hours</dd>
          </>
        )}
      </dl>

      {products.length > 0 && (
        <div className="cert-detail-block">
          <p className="cert-detail-label">Products</p>
          <div className="chip-row">
            {products.map(p => <span key={p} className="chip">{p}</span>)}
          </div>
        </div>
      )}

      {topics.length > 0 && (
        <div className="cert-detail-block">
          <p className="cert-detail-label">Topics</p>
          <div className="chip-row">
            {topics.map(t => <span key={t} className="chip">{t}</span>)}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div className="cert-detail-block">
          <p className="cert-detail-label">Skills measured</p>
          <ul className="cert-detail-list">
            {skills.map(s => <li key={s}>{s}</li>)}
          </ul>
        </div>
      )}

      {background.length > 0 && (
        <div className="cert-detail-block">
          <p className="cert-detail-label">Recommended background</p>
          <ul className="cert-detail-list">
            {background.map(b => <li key={b}>{b}</li>)}
          </ul>
        </div>
      )}

      {(guideUrl || certUrl) && (
        <div className="cert-detail-block cert-detail-links">
          <p className="cert-detail-label">Preparation resources</p>
          {guideUrl && (
            <a href={guideUrl} target="_blank" rel="noopener noreferrer" className="action-chip">
              Official certification guide ↗
            </a>
          )}
          {certUrl && (
            <a href={certUrl} target="_blank" rel="noopener noreferrer" className="action-chip">
              Learn more on IBM Training ↗
            </a>
          )}
        </div>
      )}

      {breakouts.length > 0 && (
        <div className="cert-detail-block">
          <p className="cert-detail-label">Sessions that help</p>
          <ul className="cert-detail-list cert-detail-list--compact">
            {breakouts.map(t => <li key={t}>{t}</li>)}
          </ul>
        </div>
      )}

      {labs.length > 0 && (
        <div className="cert-detail-block">
          <p className="cert-detail-label">Labs that help</p>
          <ul className="cert-detail-list cert-detail-list--compact">
            {labs.map(t => <li key={t}>{t}</li>)}
          </ul>
        </div>
      )}

      {huddles.length > 0 && (
        <div className="cert-detail-block">
          <p className="cert-detail-label">Study groups</p>
          <ul className="cert-detail-list cert-detail-list--compact">
            {huddles.map(t => <li key={t}>{t}</li>)}
          </ul>
        </div>
      )}

      {communities.length > 0 && (
        <div className="cert-detail-block">
          <p className="cert-detail-label">Community meetups</p>
          <ul className="cert-detail-list cert-detail-list--compact">
            {communities.map(t => <li key={t}>{t}</li>)}
          </ul>
        </div>
      )}

      <p className="cert-detail-community-note">
        Certification success is often a community experience — study with peers, learn alongside experts,
        and celebrate achievements together.
      </p>

      <div className="cert-detail-actions">
        <Link href="/experience" className="action-chip" onClick={onClose}>
          See your journey on My Compass
        </Link>
      </div>
    </>
  );
}
