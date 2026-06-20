import type { ReactNode } from "react";
import CompassModuleHead from "@/components/experience/CompassModuleHead";
import type { CompassPanelIconName } from "@/components/experience/CompassPanelIcon";

interface CompassPanelProps {
  icon?: CompassPanelIconName;
  kicker?: string;
  title?: string;
  description?: string;
  variant?: "default" | "accent";
  className?: string;
  children: ReactNode;
}

export default function CompassPanel({
  icon,
  kicker,
  title,
  description,
  variant = "default",
  className = "",
  children,
}: CompassPanelProps) {
  const hasHead = icon || kicker || title || description;

  return (
    <div
      className={[
        "compass-panel",
        variant === "accent" ? "compass-panel--accent" : "",
        className,
      ].filter(Boolean).join(" ")}
    >
      {hasHead && kicker && title && (
        <CompassModuleHead
          icon={icon}
          kicker={kicker}
          title={title}
          description={description}
        />
      )}
      {children}
    </div>
  );
}
