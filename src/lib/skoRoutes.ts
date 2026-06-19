// =============================================================================
// SKO route detection — keeps SKO and TechXchange chrome separate
// =============================================================================

const SKO_PREFIXES = ["/sko", "/setup/sko"];

/** Legacy root paths that still redirect to /sko/* — use SKO chrome during redirect. */
const SKO_LEGACY_ROOT = new Set([
  "/compass",
  "/content",
  "/enroll",
  "/login",
  "/people",
  "/profile",
  "/pulse",
]);

export function isSkoRoute(pathname: string): boolean {
  if (SKO_LEGACY_ROOT.has(pathname)) return true;
  return SKO_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isTxcRoute(pathname: string): boolean {
  if (pathname.startsWith("/txc")) return true;
  if (pathname.startsWith("/setup/txc")) return true;
  const legacyTxc = [
    "/experience",
    "/explore",
    "/sessions",
    "/champions",
    "/communities",
    "/journey-maps",
    "/admin",
  ];
  return legacyTxc.some(r => pathname === r || pathname.startsWith(`${r}/`));
}
