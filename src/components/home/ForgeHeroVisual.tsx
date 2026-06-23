/** FORGE hero — engineered geometry (CSS/SVG, no stock imagery). */
export default function ForgeHeroVisual() {
  return (
    <div className="forge-hero-visual forge-orb" aria-hidden="true">
      <div className="forge-hero-visual__glow forge-orb__halo" />
      <svg
        className="forge-hero-visual__shape"
        viewBox="0 0 400 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="forge-edge-a" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="forge-face" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="rgb(99 102 241 / 0.22)" />
            <stop offset="100%" stopColor="rgb(20 20 28 / 0.65)" />
          </linearGradient>
          <linearGradient id="forge-face-side" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="rgb(59 130 246 / 0.12)" />
            <stop offset="100%" stopColor="rgb(139 92 246 / 0.18)" />
          </linearGradient>
          <filter id="forge-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Base glow */}
        <ellipse cx="200" cy="340" rx="120" ry="24" fill="url(#forge-edge-a)" opacity="0.25" />

        {/* Tetrahedron faces */}
        <path
          d="M200 60 L340 320 L60 320 Z"
          fill="url(#forge-face)"
          stroke="url(#forge-edge-a)"
          strokeWidth="1.5"
          opacity="0.9"
        />
        <path
          d="M200 60 L340 320 L200 320 Z"
          fill="url(#forge-face-side)"
          stroke="url(#forge-edge-a)"
          strokeWidth="1"
          opacity="0.75"
        />
        <path
          d="M200 60 L60 320 L200 320 Z"
          fill="rgb(99 102 241 / 0.08)"
          stroke="url(#forge-edge-a)"
          strokeWidth="1"
          opacity="0.6"
        />

        {/* Edge highlights */}
        <line x1="200" y1="60" x2="340" y2="320" stroke="url(#forge-edge-a)" strokeWidth="2" filter="url(#forge-blur)" />
        <line x1="200" y1="60" x2="60" y2="320" stroke="url(#forge-edge-a)" strokeWidth="2" filter="url(#forge-blur)" />
        <line x1="60" y1="320" x2="340" y2="320" stroke="#3B82F6" strokeWidth="1.5" opacity="0.7" />

        {/* Inner structure lines */}
        <line x1="200" y1="60" x2="200" y2="320" stroke="rgb(139 92 246 / 0.35)" strokeWidth="0.75" strokeDasharray="4 6" />
        <line x1="130" y1="220" x2="270" y2="220" stroke="rgb(59 130 246 / 0.25)" strokeWidth="0.75" />

        {/* Apex point */}
        <circle cx="200" cy="60" r="4" fill="#8B5CF6" opacity="0.9" />
        <circle cx="200" cy="60" r="12" fill="url(#forge-edge-a)" opacity="0.2" />
      </svg>
    </div>
  );
}
