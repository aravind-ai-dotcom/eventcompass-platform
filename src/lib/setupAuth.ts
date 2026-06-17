// =============================================================================
// Setup admin auth (shared by /setup/txc and /setup/sko)
// =============================================================================

const SESSION_KEY = "compass_setup_admin_v1";

export function checkSetupCredentials(username: string, password: string): boolean {
  return username === "admin" && password === "Compass1234!";
}

export function persistSetupSession(): void {
  if (typeof window !== "undefined") sessionStorage.setItem(SESSION_KEY, "1");
}

export function clearSetupSession(): void {
  if (typeof window !== "undefined") sessionStorage.removeItem(SESSION_KEY);
}

export function hasSetupSession(): boolean {
  return typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1";
}
