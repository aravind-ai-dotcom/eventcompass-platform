// =============================================================================
// SKO route detection — keeps SKO and TechXchange chrome separate
// =============================================================================

const SKO_EXACT = new Set([
  "/login",
  "/enroll",
  "/profile",
  "/compass",
  "/content",
  "/pulse",
  "/people",
  "/setup",
  "/routes",
]);

const SKO_PREFIXES = ["/sko", "/setup/sko"];

export function isSkoRoute(pathname: string): boolean {
  if (SKO_EXACT.has(pathname)) return true;
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
