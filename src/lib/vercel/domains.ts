/**
 * Vercel Domains Client — Sprint 2.
 * Docs: https://vercel.com/docs/rest-api/endpoints#domains
 *
 * Env: VERCEL_TOKEN (Bearer), VERCEL_TEAM_ID (opsional, untuk team scope).
 * Semua fungsi return typed result (tidak throw untuk error API) kecuali
 * kredensial belum dikonfigurasi.
 */
const API_BASE = "https://api.vercel.com";

export interface VercelResult {
  ok: boolean;
  error?: string;
}

export interface VercelDomainConfig {
  token?: string;
  teamId?: string;
  fetchFn?: typeof fetch;
}

function resolveConfig(cfg: VercelDomainConfig = {}): { token: string; teamId?: string; fetchFn: typeof fetch } {
  const token = cfg.token ?? process.env.VERCEL_TOKEN;
  if (!token) throw new Error("VERCEL_TOKEN required untuk provisioning domain");
  return { token, teamId: cfg.teamId ?? process.env.VERCEL_TEAM_ID, fetchFn: cfg.fetchFn ?? fetch };
}

function teamQuery(teamId?: string): string {
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
}

async function parseError(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as { error?: { message?: string }; message?: string };
    return json?.error?.message || (typeof json?.message === "string" ? json.message : `HTTP ${res.status}`);
  } catch {
    return `HTTP ${res.status}`;
  }
}

/** Daftarkan domain ke project/team Vercel (idempoten: 409 dianggap ok). */
export async function addDomainToVercel(domain: string, cfg: VercelDomainConfig = {}): Promise<VercelResult> {
  const { token, teamId, fetchFn } = resolveConfig(cfg);
  try {
    const res = await fetchFn(`${API_BASE}/v10/domains/${encodeURIComponent(domain)}${teamQuery(teamId)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: domain }),
    });
    if (res.ok || res.status === 409) return { ok: true };
    return { ok: false, error: await parseError(res) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Vercel add domain failed" };
  }
}

/** Verifikasi ownership domain di Vercel (setelah TXT record terpasang). */
export async function verifyDomainOnVercel(domain: string, cfg: VercelDomainConfig = {}): Promise<VercelResult> {
  const { token, teamId, fetchFn } = resolveConfig(cfg);
  try {
    const res = await fetchFn(`${API_BASE}/v9/domains/${encodeURIComponent(domain)}/verify${teamQuery(teamId)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return { ok: true };
    return { ok: false, error: await parseError(res) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Vercel verify failed" };
  }
}

/** Lepas domain dari Vercel (saat domain expired/deleted). Best-effort. */
export async function removeDomainFromVercel(domain: string, cfg: VercelDomainConfig = {}): Promise<VercelResult> {
  const { token, teamId, fetchFn } = resolveConfig(cfg);
  try {
    const res = await fetchFn(`${API_BASE}/v9/domains/${encodeURIComponent(domain)}${teamQuery(teamId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok || res.status === 404) return { ok: true };
    return { ok: false, error: await parseError(res) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Vercel remove failed" };
  }
}
