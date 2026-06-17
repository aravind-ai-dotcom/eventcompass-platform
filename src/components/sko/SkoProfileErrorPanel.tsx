"use client";

import Link from "next/link";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function SkoProfileErrorPanel({ message, onRetry }: Props) {
  return (
    <section className="sko-section sko-error-panel">
      <p className="sko-kicker">SKO Compass</p>
      <h1>Profile unavailable</h1>
      <p className="sko-lead">
        {message ?? "We could not load your SKO profile yet."}
      </p>
      <p className="sko-muted">
        This is usually a Firestore permissions issue. Confirm you are signed in with an SKO seller account
        and that prototype rules are deployed for <code>sko_*</code> collections.
      </p>
      <div className="sko-error-actions">
        {onRetry && (
          <button type="button" className="sko-btn sko-btn--primary" onClick={() => void onRetry()}>
            Retry
          </button>
        )}
        <Link href="/login" className="sko-btn sko-btn--secondary">Sign in again</Link>
        <Link href="/enroll" className="sko-btn sko-btn--ghost">Go to enrollment</Link>
      </div>
    </section>
  );
}
