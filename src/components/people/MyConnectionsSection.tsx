"use client";

import ConnectionVaultCard from "@/components/people/ConnectionVaultCard";
import type { ConnectionVaultRecord } from "@/types/connectionVault";

interface MyConnectionsSectionProps {
  records: ConnectionVaultRecord[];
  onViewProfile?: (personId: string) => void;
  onRemove?: (personId: string) => void;
  onUpdateNote?: (personId: string, notes: string) => void;
  embedded?: boolean;
}

export default function MyConnectionsSection({
  records,
  onViewProfile,
  onRemove,
  onUpdateNote,
  embedded = false,
}: MyConnectionsSectionProps) {
  const outerClass = embedded
    ? "compass-module-block connection-vault"
    : "section connection-vault";

  return (
    <section className={outerClass}>
      <header className="connection-vault__header">
        <p className="connection-vault__kicker">My Connections</p>
        <h2 className="connection-vault__title">People you want to remember and follow up with.</h2>
        <p className="connection-vault__note">
          Your relationship vault — context, notes, and quick actions for after TechXchange.
        </p>
      </header>

      {records.length > 0 ? (
        <div className="connection-vault__stack">
          {records.map(record => (
            <ConnectionVaultCard
              key={record.id}
              record={record}
              onViewProfile={onViewProfile}
              onRemove={onRemove}
              onUpdateNote={onUpdateNote}
            />
          ))}
        </div>
      ) : (
        <p className="connection-vault__empty">
          Save people from Recommended Connections — we&apos;ll ask why so you remember the context later.
        </p>
      )}
    </section>
  );
}
