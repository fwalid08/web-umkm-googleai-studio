export interface SessionUser {
  id?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

export function getSessionUserId(session: unknown): string | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  return user?.id ?? null;
}

/**
 * Demo auth hanya untuk dev/preview. Prod default MATI kecuali
 * eksplisit ALLOW_DEMO_AUTH=true. Mencegah backdoor x-demo-user-id.
 */
export function isDemoAuthEnabled(): boolean {
  if (process.env.ALLOW_DEMO_AUTH === "true") return true;
  if (process.env.ALLOW_DEMO_AUTH === "false") return false;
  return process.env.NODE_ENV !== "production";
}

/** Client-side twin: baca NEXT_PUBLIC_ALLOW_DEMO_AUTH. */
export function isDemoAuthEnabledClient(): boolean {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ALLOW_DEMO_AUTH === "true") return true;
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ALLOW_DEMO_AUTH === "false") return false;
  // Secure default: di prod build, mati kecuali eksplisit true.
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "localhost" || h.endsWith(".localhost") || h === "127.0.0.1") return true;
  }
  return false;
}
