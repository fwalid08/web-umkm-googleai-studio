import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

// POST /api/domains/verify - Verify custom domain (cron/admin only)
// Auth: header x-cron-secret === CRON_SECRET. Tanpa itu → 401.
// Fallback: query ?secret=CRON_SECRET — karena Vercel Cron tidak mendukung
// custom headers (lihat vercel.json + docs/CRON_DOMAIN.md).
export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const provided =
      request.headers.get("x-cron-secret") ??
      new URL(request.url).searchParams.get("secret");
    if (!cronSecret || provided !== cronSecret) {
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
            results.push({ domain: user.custom_domain, status: "verified" });
            
            // Trigger Vercel custom domain provisioning (if using Vercel)
            // await provisionVercelDomain(user.custom_domain);
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

    return NextResponse.json({
      success: true,
      verified: verifiedCount,
      total_checked: users.length,
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