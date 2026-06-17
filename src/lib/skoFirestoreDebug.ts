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
  const { code, message } = normalizeFirestoreError(err);
  return `${code}: ${message}`;
}

function authSnapshot() {
  const u = auth.currentUser;
  return {
    uid: u?.uid ?? null,
    email: u?.email ?? null,
    authenticated: Boolean(u),
  };
}

function normalizeFirestoreError(err: unknown): { code: string; message: string } {
  if (err && typeof err === "object") {
    const e = err as { code?: string; message?: string; name?: string };
    return {
      code: e.code ?? e.name ?? "unknown",
      message: e.message ?? String(err),
    };
  }
  return { code: "unknown", message: String(err) };
}

function formatErrorRecord(record: SkoFirestoreErrorRecord): string {
  return [
    `[SKO Firestore] ${record.operation} ${record.collection}`,
    record.docId ? `doc=${record.docId}` : null,
    `route=${record.route}`,
    `uid=${record.uid ?? "none"}`,
    `auth=${record.authenticated}`,
    `code=${record.code}`,
    `message=${record.message}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

/** Log and rethrow — never log secrets. */
export async function skoFirestoreOp<T>(
  context: SkoFirestoreLogContext,
  uid: string | null | undefined,
  fn: () => Promise<T>,
  options?: { quiet?: boolean },
): Promise<T> {
  const authInfo = authSnapshot();
  try {
    return await fn();
  } catch (err) {
    const { code, message } = normalizeFirestoreError(err);
    const record: SkoFirestoreErrorRecord = {
      route: context.route,
      collection: context.collection,
      operation: context.operation,
      docId: context.docId ?? null,
      uid: uid ?? authInfo.uid,
      email: authInfo.email,
      authenticated: authInfo.authenticated,
      code,
      message,
      at: new Date().toISOString(),
    };
    lastError = record;
    const line = formatErrorRecord(record);
    if (options?.quiet) {
      if (process.env.NODE_ENV === "development") {
        console.warn(line);
      }
    } else {
      console.error(line);
    }
    throw err;
  }
}
