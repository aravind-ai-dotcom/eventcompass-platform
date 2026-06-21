import Link from "next/link";
import type { EventMomentHighlight } from "@/lib/eventMoments";

export default function FocusMomentCard({ moment }: { moment: EventMomentHighlight }) {
  return (
    <article className="opportunity-card focus-moment-card">
      <div className="card-meta">
        <span>Anchor moment</span>
        <span>{moment.day.split(",")[0]}</span>
      </div>
      <h3>{moment.title}</h3>
      <p className="session-card-meta">{moment.time} · {moment.location}</p>
      <p>{moment.description}</p>
      <div className="focus-session-card__actions">
        <Link href="/txc/sessions" className="action-chip action-chip--quiet">
          Info →
        </Link>
      </div>
    </article>
  );
}
