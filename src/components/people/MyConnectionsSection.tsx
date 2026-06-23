"use client";

import ConnectionVaultCard from "@/components/people/ConnectionVaultCard";
import CompassPanel from "@/components/experience/CompassPanel";
import type { ConnectionVaultRecord } from "@/types/connectionVault";
import { FORGE_EVENT } from "@/config/forgeBrand";

interface MyConnectionsSectionProps {
  records: ConnectionVaultRecord[];
  onViewProfile?: (personId: string) => void;
  onRemove?: (personId: string) => void;
  onUpdateNote?: (personId: string, notes: string) => void;
  embedded?: boolean;
  /** Renders as a column inside people-follow-up-split__layout */
  splitColumn?: boolean;
}

export default function MyConnectionsSection({
  records,
  onViewProfile,
  onRemove,
  onUpdateNote,
  embedded = false,
  splitColumn = false,
}: MyConnectionsSectionProps) {
  const content = (
    <>
      {!splitColumn && (
        <header className="people-follow-up-split__header">
          <p className="people-follow-up-split__kicker">My Connections</p>
          <h2 className="people-follow-up-split__title">People you want to remember and follow up with.</h2>
          <p className="people-follow-up-split__note">
            Your relationship vault — context, notes, and quick actions for after {FORGE_EVENT.name}.
          </p>
        </header>
      )}

      {records.length > 0 ? (
        <div className="people-follow-up-split__cards connection-cards-grid">
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
        <p className="people-follow-up-split__empty">
          Save people from Recommended Connections — we&apos;ll ask why so you remember the context later.
        </p>
      )}
    </>
  );

  if (splitColumn) {
    return (
      <CompassPanel
        icon="connections"
        kicker="My Connections"
        title="People you want to remember and follow up with."
        description={`Your relationship vault — context, notes, and quick actions for after ${FORGE_EVENT.name}.`}
        className="people-panel-box"
      >
        {content}
      </CompassPanel>
    );
  }

  const outerClass = embedded
    ? "compass-module-block connection-vault"
    : "section connection-vault";

  return <section className={outerClass}>{content}</section>;
}
