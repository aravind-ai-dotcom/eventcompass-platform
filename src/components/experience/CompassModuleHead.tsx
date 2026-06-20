import type { ReactNode } from "react";
import CompassPanelIcon, { type CompassPanelIconName } from "@/components/experience/CompassPanelIcon";

interface CompassModuleHeadProps {
  kicker: string;
  title: string;
  description?: string;
  icon?: CompassPanelIconName;
  action?: ReactNode;
  className?: string;
}

/** Shared block title row for My Compass modules (boxed and unboxed). */
export default function CompassModuleHead({
  kicker,
  title,
  description,
  icon,
  action,
  className = "",
}: CompassModuleHeadProps) {
  return (
    <header
      className={[
        "compass-module-head",
        icon ? "compass-module-head--with-icon" : "",
        action ? "compass-module-head--with-action" : "",
        className,
      ].filter(Boolean).join(" ")}
    >
      {icon && <CompassPanelIcon name={icon} />}
      <div className="compass-module-head__copy">
        <p className="compass-module-head__kicker">{kicker}</p>
        <h2 className="compass-module-head__title">{title}</h2>
        {description && <p className="compass-module-head__desc">{description}</p>}
      </div>
      {action && <div className="compass-module-head__action">{action}</div>}
    </header>
  );
}
