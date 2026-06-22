export const TXC_ADMIN_SESSION_KEY = "compass_admin_v1";

export function checkTxcAdminCredentials(username: string, password: string): boolean {
  return username === "admin" && password === "Compass1234!";
}

export function persistTxcAdminSession(): void {
  if (typeof window !== "undefined") sessionStorage.setItem(TXC_ADMIN_SESSION_KEY, "1");
}

export function clearTxcAdminSession(): void {
  if (typeof window !== "undefined") sessionStorage.removeItem(TXC_ADMIN_SESSION_KEY);
}

export function hasTxcAdminSession(): boolean {
  return typeof window !== "undefined" && sessionStorage.getItem(TXC_ADMIN_SESSION_KEY) === "1";
}
