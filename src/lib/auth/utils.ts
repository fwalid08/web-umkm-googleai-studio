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
