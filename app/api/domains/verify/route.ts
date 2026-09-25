import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// POST /api/domains/verify - Verify custom domain (admin/cron job)
export async function POST(request: NextRequest) {
  try {
    // This endpoint should be called by a cron job or admin
    // In production, add authentication/authorization check here
    
    const supabase = await createServerSupabaseClient();

    // Sprint 03: custom domain tinggal di websites (bukan users)
    // Get all websites with unverified custom domains
    const { data: users, error } = await supabase
      .from("websites")
      .select("id, custom_domain")
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

    for (const user of users) {
      if (!user.custom_domain) continue;

      try {
        // Check DNS TXT record
        const verified = await checkDNSTXTRecord(user.custom_domain);
        
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
async function checkDNSTXTRecord(domain: string): Promise<boolean> {
  try {
    // In production, use a proper DNS library like 'dns2' or cloudflare DNS API
    // This is a simplified example using a public DNS over HTTPS
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=_saas-verify.${domain}&type=TXT`,
      {
        headers: { accept: "application/dns-json" },
      }
    );
    
    const data = await response.json();
    
    if (data.Answer && data.Answer.length > 0) {
      // Check if any TXT record contains our verification prefix
      for (const answer of data.Answer) {
        if (answer.data && answer.data.includes("saas-verify-")) {
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