import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getActiveWebsite } from "@/lib/websites/active";
import { tenantUrl } from "@/lib/urls";

// GET /api/user/domain-status — status domain website AKTIF (Sprint 03)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const site = await getActiveWebsite((session.user as any).id);
    if (!site) {
      return NextResponse.json(
        { success: false, error: "Belum ada website" },
        { status: 404 }
      );
    }

    let status: "none" | "subdomain" | "custom_pending" | "custom_verified" = "none";
    if (site.custom_domain_verified && site.custom_domain) {
      status = "custom_verified";
    } else if (site.custom_domain) {
      status = "custom_pending";
    } else if (site.subdomain) {
      status = "subdomain";
    }

    return NextResponse.json({
      success: true,
      data: {
        website_id: site.id,
        website_name: site.name,
        has_subdomain: !!site.subdomain,
        subdomain: site.subdomain,
        subdomain_url: tenantUrl(site.subdomain),
        custom_domain: site.custom_domain,
        custom_domain_verified: site.custom_domain_verified,
        custom_domain_verified_at: site.custom_domain_verified_at,
        status,
        full_url: site.custom_domain_verified && site.custom_domain
          ? `https://${site.custom_domain}`
          : tenantUrl(site.subdomain),
      }
    });
  } catch (error) {
    console.error("Error fetching domain status:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
