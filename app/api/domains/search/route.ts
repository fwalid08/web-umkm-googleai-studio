import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { normalizeSearch, simulateAvailability, TLD_CATALOG } from "@/lib/domains/catalog";

function getSessionUserId(session: unknown): string | null {
  const user = (session as { user?: { id?: string } } | null)?.user;
  return user?.id ?? null;
}

// GET /api/domains/search?q=tokoku — cek semua TLD katalog (simulasi Tahap 1)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!getSessionUserId(session)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ success: false, error: "Ketik minimal 2 huruf" }, { status: 400 });
  }
  const results = TLD_CATALOG.map((t) => {
    const domain = normalizeSearch(q, t.tld);
    if (!domain) return null;
    return {
      domain,
      tld: t.tld,
      available: simulateAvailability(domain),
      price_yearly: t.priceYearly,
      buyable: t.buyable,
      requirement: t.requirement,
    };
  }).filter((r) => r !== null);
  if (results.length === 0) {
    return NextResponse.json({ success: false, error: "Nama tidak valid (3–50 huruf/angka/strip)" }, { status: 400 });
  }
  return NextResponse.json({ success: true, data: { results, sandbox: true } });
}
