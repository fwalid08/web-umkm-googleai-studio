import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { isAuthorizedCronRequest } from "@/lib/cron/secret";
import { addDomainToVercel, verifyDomainOnVercel } from "@/lib/vercel/domains";

// POST /api/domains/verify — verifikasi custom domain (cron 5 menit + admin).
// Auth: header x-cron-secret === CRON_SECRET atau ?secret=CRON_SECRET
// (Vercel Cron tidak mendukung custom headers — lihat vercel.json).
//
// Sprint 2 tambahan (§8.1):
// 1. TXT cocok → verifyDomainOnVercel() (best-effort, gagal → hasil "added, verify pending").
// 2. Website terverifikasi → domain_orders.verification_token = NULL.
// 3. Retry addDomainToVercel() untuk order active yang token-nya masih ada
//    (add awal gagal — best-effort, 409 = sudah ada = ok).
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();

    // Sprint 03: custom domain tinggal di websites (bukan users)
    // Get all websites with unverified custom domains (+ token eksak)
    const { data: users, error } = await supabase
      .from("websites")
      .select("id, custom_domain, custom_domain_verification_token")
      .not("custom_domain", "is", null)
      .eq("custom_domain_verified", false);

    if (error) {
      console.error("Error fetching unverified domains:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No domains to verify",
        verified: 0,
      });
    }

    let verifiedCount = 0;
    const results = [];

    for (const user of users as Array<{ id: string; custom_domain: string | null; custom_domain_verification_token?: string | null }>) {
      if (!user.custom_domain) continue;

      try {
        // Check DNS TXT record — cocokkan token eksak bila ada, fallback prefix legacy
        const expected = user.custom_domain_verification_token || null;
        const verified = await checkDNSTXTRecord(user.custom_domain, expected);

        if (verified) {
          // Update website as verified
          const { error: updateError } = await supabase
            .from("websites")
            .update({
              custom_domain_verified: true,
              custom_domain_verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (!updateError) {
            verifiedCount++;

            // Vercel: pastikan terdaftar (retry add, idempoten) + verifikasi ownership.
            // Best-effort: token Vercel belum diset (dev) → skipped, cron berikut retry.
            let vercel = "skipped";
            try {
              const added = await addDomainToVercel(user.custom_domain);
              if (added.ok) {
                const v = await verifyDomainOnVercel(user.custom_domain);
                vercel = v.ok ? "verified" : `added, verify pending (${v.error ?? "unknown"})`;
              } else {
                vercel = `add failed: ${added.error ?? "unknown"}`;
              }
            } catch (err) {
              vercel = `skipped: ${err instanceof Error ? err.message : "vercel unconfigured"}`;
            }

            // Token verifikasi tak diperlukan lagi → NULL (tandai selesai penuh).
            const { error: tokenError } = await supabase
              .from("domain_orders")
              .update({ verification_token: null, updated_at: new Date().toISOString() })
              .eq("domain", user.custom_domain)
              .not("verification_token", "is", null);
            if (tokenError) {
              console.warn(`[domains/verify] token clear gagal untuk ${user.custom_domain}:`, tokenError);
            }

            results.push({ domain: user.custom_domain, status: "verified", vercel });
          } else {
            results.push({ domain: user.custom_domain, status: "failed", error: updateError.message });
          }
        } else {
          results.push({ domain: user.custom_domain, status: "pending" });
        }
      } catch (error) {
        results.push({ domain: user.custom_domain, status: "error", error: String(error) });
      }
    }

    // Retry Vercel add untuk order active yang belum terverifikasi penuh
    // (token masih ada = verify TXT belum lolos / add awal gagal). Cap 20/run.
    let vercelRetried = 0;
    try {
      const { data: pendingOrders } = await supabase
        .from("domain_orders")
        .select("domain")
        .eq("status", "active")
        .not("verification_token", "is", null)
        .limit(20);
      for (const o of (pendingOrders ?? []) as Array<{ domain: string }>) {
        try {
          const r = await addDomainToVercel(o.domain);
          if (r.ok) vercelRetried++;
          else console.warn(`[domains/verify] retry add ${o.domain} gagal:`, r.error);
        } catch (err) {
          console.warn(`[domains/verify] retry add ${o.domain} skipped:`, err);
          break; // mis. VERCEL_TOKEN belum diset — hentikan loop, cron berikut retry.
        }
      }
    } catch (err) {
      console.warn("[domains/verify] retry batch gagal:", err);
    }

    return NextResponse.json({
      success: true,
      verified: verifiedCount,
      total_checked: users.length,
      vercel_retried: vercelRetried,
      results,
    });
  } catch (error) {
    console.error("Error verifying domains:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to check DNS TXT record
async function checkDNSTXTRecord(domain: string, expectedToken: string | null): Promise<boolean> {
  try {
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=_saas-verify.${domain}&type=TXT`,
      {
        headers: { accept: "application/dns-json" },
      }
    );

    const data = await response.json();

    if (data.Answer && data.Answer.length > 0) {
      for (const answer of data.Answer) {
        const txt: string = String(answer.data ?? "");
        if (expectedToken) {
          if (txt.includes(expectedToken)) return true;
        } else if (txt.includes("saas-verify-")) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error(`DNS check failed for ${domain}:`, error);
    return false;
  }
}
