import type { ReactNode } from "react";
import CompassPanelIcon, { type CompassPanelIconName } from "@/components/experience/CompassPanelIcon";

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
      {hasHead && (
        <header className="compass-panel__head">
          {icon && <CompassPanelIcon name={icon} />}
          {(kicker || title || description) && (
            <div className="compass-panel__copy">
              {kicker && <p className="compass-panel__kicker">{kicker}</p>}
              {title && <h2 className="compass-panel__title">{title}</h2>}
              {description && <p className="compass-panel__desc">{description}</p>}
            </div>
          )}
        </header>
      )}
      {children}
    </div>
  );
}
