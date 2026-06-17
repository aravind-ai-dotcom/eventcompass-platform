// =============================================================================
// SKO Firestore — safe client-side operation logging (prototype diagnostics)
// =============================================================================

import { auth } from "@/lib/firebase";

export type SkoFirestoreOperation = "read" | "write";

export interface SkoFirestoreLogContext {
  route: string;
  collection: string;
  operation: SkoFirestoreOperation;
  docId?: string;
}

export interface SkoFirestoreErrorRecord {
  route: string;
  collection: string;
  operation: SkoFirestoreOperation;
  docId: string | null;
  uid: string | null;
  email: string | null;
  authenticated: boolean;
  code: string;
  message: string;
  at: string;
}

let lastError: SkoFirestoreErrorRecord | null = null;

export function getLastSkoFirestoreError(): SkoFirestoreErrorRecord | null {
  return lastError;
}

export function clearLastSkoFirestoreError(): void {
  lastError = null;
}

export function isFirestorePermissionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: string }).code;
  return code === "permission-denied" || code === "PERMISSION_DENIED";
}

export function firestoreErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") return "Unknown Firestore error";
  const e = err as { code?: string; message?: string };
  return [e.code, e.message].filter(Boolean).join(": ") || "Unknown Firestore error";
}

function authSnapshot() {
  const u = auth.currentUser;
  return {
    uid: u?.uid ?? null,
    email: u?.email ?? null,
    authenticated: Boolean(u),
  };
}

/** Log and rethrow — never log secrets. */
export async function skoFirestoreOp<T>(
  context: SkoFirestoreLogContext,
  uid: string | null | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  const authInfo = authSnapshot();
  try {
    return await fn();
  } catch (err) {
    const record: SkoFirestoreErrorRecord = {
      route: context.route,
      collection: context.collection,
      operation: context.operation,
      docId: context.docId ?? null,
      uid: uid ?? authInfo.uid,
      email: authInfo.email,
      authenticated: authInfo.authenticated,
      code: (err as { code?: string })?.code ?? "unknown",
      message: (err as { message?: string })?.message ?? String(err),
      at: new Date().toISOString(),
    };
    lastError = record;
    console.error("[SKO Firestore]", record);
    throw err;
  }
}
