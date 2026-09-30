import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { getSessionUserId } from "@/lib/auth/utils";
import { normalizeSearch, simulateAvailability, TLD_CATALOG } from "@/lib/domains/catalog";
import { retailPriceForProvider, usdToIdrRate } from "@/lib/domains/pricing";
import { getRegistrarProvider } from "@/lib/registrar/factory";
import { checkRateLimit } from "@/lib/rate/limit";
import type { DomainSearchResult } from "@/types/domains";

// Boundary validasi query (zod di semua input eksternal).
const searchQuerySchema = z.object({
  q: z.string().min(2, "Ketik minimal 2 huruf").max(100),
});

// Cache hasil 5 menit (in-memory, pola src/lib/rate/limit.ts: Map + MAX_KEYS).
// Best-effort per-instance; korektness tidak bergantung cache (checkout re-check).
interface SearchCacheEntry {
  results: DomainSearchResult[];
  sandbox: boolean;
  providerId: string;
  cachedAt: number;
}
const SEARCH_CACHE = new Map<string, SearchCacheEntry>();
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const SEARCH_CACHE_MAX_KEYS = 1000;

function readSearchCache(key: string, now = Date.now()): SearchCacheEntry | null {
  const entry = SEARCH_CACHE.get(key);
  if (!entry || now - entry.cachedAt > SEARCH_CACHE_TTL_MS) {
    if (entry) SEARCH_CACHE.delete(key);
    return null;
  }
  return entry;
}

function writeSearchCache(key: string, entry: SearchCacheEntry): void {
  SEARCH_CACHE.set(key, entry);
  if (SEARCH_CACHE.size > SEARCH_CACHE_MAX_KEYS) {
    const oldest = SEARCH_CACHE.keys().next().value as string | undefined;
    if (oldest !== undefined && oldest !== key) SEARCH_CACHE.delete(oldest);
  }
}

/** Reset cache (untuk test). */
export function resetDomainSearchCache(): void {
  SEARCH_CACHE.clear();
}

// GET /api/domains/search?q=tokoku — real-time via registrar driver aktif.
// Response: { success: true, data: { results, sandbox } } (+ warning "estimasi" bila fallback katalog).
export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = getSessionUserId(session);
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 30 req/menit/user (429 → client toast "Terlalu sering, coba lagi").
  const limit = await checkRateLimit(`domain-search:${userId}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, error: "Terlalu sering, coba lagi sebentar" },
      { status: 429 }
    );
  }

  const parsed = searchQuerySchema.safeParse({
    q: (request.nextUrl.searchParams.get("q") ?? "").trim(),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Kueri tidak valid" },
      { status: 400 }
    );
  }
  const q = parsed.data.q.toLowerCase();

  // Cache hit (key = kueri ternormalisasi; hasil per-TLD stabil 5 menit).
  const cacheKey = `q:${q}`;
  const cached = readSearchCache(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: { results: cached.results, sandbox: cached.sandbox } });
  }

  // Resolve driver — factory throw bila kredensial provider real belum diset.
  let registrar;
  try {
    registrar = getRegistrarProvider();
  } catch (err) {
    console.error("[domains/search] registrar misconfigured:", err);
    return NextResponse.json(
      { success: false, error: "Layanan domain belum dikonfigurasi. Coba lagi nanti." },
      { status: 502 }
    );
  }
  const providerId = registrar.id;
  const sandbox = providerId === "mock";

  const results: DomainSearchResult[] = [];
  let usedFallback = false;

  for (const t of TLD_CATALOG) {
    const domain = normalizeSearch(q, t.tld);
    if (!domain) continue;
    // buyable/requirement selalu dari katalog (driver tak punya konsep dokumen .id).
    const buyable = t.buyable;
    try {
      const check = await registrar.checkAvailability(domain);
      const priceYearly = retailPriceForProvider(providerId, check.priceYearly);
      if (priceYearly <= 0 && check.available) {
        // Harga grosir tak terbaca (mis. pricing API registrar down) → fallback katalog.
        usedFallback = true;
        results.push({
          domain,
          tld: t.tld,
          available: buyable && check.available,
          price_yearly: t.priceYearly,
          currency: "IDR",
          buyable,
          requirement: t.requirement,
          premium: check.premium,
        });
        continue;
      }
      const wholesaleUsd = providerId === "mock" ? undefined : check.priceYearly / usdToIdrRate();
      results.push({
        domain,
        tld: t.tld,
        available: buyable && check.available,
        price_yearly: priceYearly > 0 ? priceYearly : t.priceYearly,
        currency: "IDR",
        buyable,
        requirement: t.requirement ?? check.reason ?? null,
        premium: check.premium,
        premium_price: check.premium ? priceYearly : undefined,
        wholesale_price_usd:
          wholesaleUsd !== undefined && Number.isFinite(wholesaleUsd) && wholesaleUsd > 0
            ? Math.round(wholesaleUsd * 100) / 100
            : undefined,
      });
    } catch (err) {
      // Registrar down untuk TLD ini → fallback katalog + flag estimasi (checkout re-check real).
      console.warn(`[domains/search] driver gagal untuk ${domain}, fallback katalog:`, err);
      usedFallback = true;
      results.push({
        domain,
        tld: t.tld,
        available: buyable && simulateAvailability(domain),
        price_yearly: t.priceYearly,
        currency: "IDR",
        buyable,
        requirement: t.requirement,
        premium: false,
      });
    }
  }

  if (results.length === 0) {
    return NextResponse.json(
      { success: false, error: "Nama tidak valid (3–50 huruf/angka/strip)" },
      { status: 400 }
    );
  }

  writeSearchCache(cacheKey, { results, sandbox, providerId, cachedAt: Date.now() });

  return NextResponse.json({
    success: true,
    data: { results, sandbox },
    ...(usedFallback ? { warning: "Harga estimasi — layanan registrar sedang gangguan" } : {}),
  });
}
