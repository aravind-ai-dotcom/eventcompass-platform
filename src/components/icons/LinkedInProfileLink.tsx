import type { AnchorHTMLAttributes } from "react";

interface LinkedInProfileLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  label?: string;
  compact?: boolean;
}

export function LinkedInIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      className="linkedin-profile-link__icon"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      <rect x="0.5" y="0.5" width="15" height="15" rx="2.5" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeOpacity="0.35" />
      <path
        fill="currentColor"
        d="M4.2 6.4v4.6H2.6V6.4h1.6zm-.8-2a.92.92 0 1 1 0 1.84.92.92 0 0 1 0-1.84zM6.8 11h1.55V9.05c0-.58.11-1.14.83-1.14.71 0 .72.66.72 1.17V11H11V8.78c0-1.47-.39-2.6-2-2.6-1.02 0-1.7.56-1.98 1.1h-.03V6.4H6.8V11z"
      />
    </svg>
  );
}

export default function LinkedInProfileLink({
  label = "LinkedIn profile",
  compact = false,
  className = "",
  ...props
}: LinkedInProfileLinkProps) {
  return (
    <a
      {...props}
      className={`linkedin-profile-link${compact ? " linkedin-profile-link--compact" : ""}${className ? ` ${className}` : ""}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <LinkedInIcon size={compact ? 13 : 14} />
      <span className="linkedin-profile-link__label">{label}</span>
    </a>
  );
}
