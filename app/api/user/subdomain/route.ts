import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { subdomainSchema } from "@/types";
import { getActiveWebsite } from "@/lib/websites/active";
import { tenantUrl } from "@/lib/urls";

function domainPayload(site: {
  id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  custom_domain_verified_at: string | null;
}) {
  const status = site.custom_domain_verified
    ? "custom_verified"
    : site.custom_domain
      ? "custom_pending"
      : site.subdomain
        ? "subdomain"
        : "none";
  return {
    website_id: site.id,
    website_name: site.name,
    has_subdomain: !!site.subdomain,
    subdomain: site.subdomain,
    subdomain_url: tenantUrl(site.subdomain),
    custom_domain: site.custom_domain,
    custom_domain_verified: site.custom_domain_verified,
    custom_domain_verified_at: site.custom_domain_verified_at,
    status,
    full_url:
      site.custom_domain_verified && site.custom_domain
        ? `https://${site.custom_domain}`
        : tenantUrl(site.subdomain),
  };
}

// GET /api/user/subdomain — domain website AKTIF (Sprint 03)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const site = await getActiveWebsite((session.user as any).id);
    if (!site) return NextResponse.json({ success: false, error: "Belum ada website" }, { status: 404 });
    return NextResponse.json({ success: true, data: domainPayload(site) });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/user/subdomain — ganti subdomain website AKTIF
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const validation = subdomainSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 });
    const { subdomain } = validation.data;
    const userId = (session.user as any).id as string;
    const site = await getActiveWebsite(userId);
    if (!site) return NextResponse.json({ success: false, error: "Belum ada website" }, { status: 404 });
    const supabase = createServiceSupabaseClient();
    const { data: existing } = await supabase.from("websites").select("id").eq("subdomain", subdomain).neq("id", site.id).maybeSingle();
    if (existing) return NextResponse.json({ success: false, error: "Subdomain sudah digunakan" }, { status: 409 });
    const { data: updated, error } = await supabase.from("websites").update({ subdomain, updated_at: new Date().toISOString() }).eq("id", site.id).eq("user_id", userId).select("subdomain").single();
    if (error) return NextResponse.json({ success: false, error: "Gagal memperbarui subdomain" }, { status: 500 });
    return NextResponse.json({ success: true, data: { website_id: site.id, subdomain: updated.subdomain, subdomain_url: tenantUrl(updated.subdomain) }, message: "Subdomain berhasil diperbarui" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
