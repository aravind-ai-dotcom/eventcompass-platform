"use client";

import { SKO_COLLECTIONS } from "@/lib/skoCollections";
import { getLastSkoFirestoreError } from "@/lib/skoFirestoreDebug";
import { useSkoAuth } from "@/context/SkoAuthContext";

export default function SkoProfileDebugPanel() {
  if (process.env.NODE_ENV !== "development") return null;

  const { user, profile, profileComplete, profileError } = useSkoAuth();
  const lastFs = getLastSkoFirestoreError();
  const docPath = user ? `${SKO_COLLECTIONS.users}/${user.uid}` : "—";

  return (
    <aside className="sko-debug-panel" aria-label="SKO dev diagnostics">
      <p className="sko-debug-title">Dev — SKO profile debug</p>
      <dl className="sko-debug-list">
        <div><dt>Auth UID</dt><dd>{user?.uid ?? "—"}</dd></div>
        <div><dt>Email</dt><dd>{user?.email ?? "—"}</dd></div>
        <div><dt>Profile collection</dt><dd>{SKO_COLLECTIONS.users}</dd></div>
        <div><dt>Profile doc path</dt><dd><code>{docPath}</code></dd></div>
        <div><dt>Profile complete</dt><dd>{String(profileComplete)}</dd></div>
        <div><dt>Context error</dt><dd>{profileError ?? "—"}</dd></div>
        <div><dt>Last Firestore error</dt><dd>{lastFs ? `${lastFs.code}: ${lastFs.message}` : "—"}</dd></div>
        {lastFs && (
          <>
            <div><dt>FS route</dt><dd>{lastFs.route}</dd></div>
            <div><dt>FS collection</dt><dd>{lastFs.collection}</dd></div>
            <div><dt>FS operation</dt><dd>{lastFs.operation}</dd></div>
            <div><dt>FS authenticated</dt><dd>{String(lastFs.authenticated)}</dd></div>
          </>
        )}
        {profile && (
          <div><dt>product</dt><dd>{profile.product ?? "—"}</dd></div>
        )}
      </dl>
    </aside>
  );
}
