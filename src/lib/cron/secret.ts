import type { NextRequest } from "next/server";

/**
 * Auth cron terpusat (Vercel Cron tak support custom header — pola sama di
 * semua cron domain: header `x-cron-secret` ATAU query `?secret=`).
 */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const provided =
    request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");
  return provided === cronSecret;
}
