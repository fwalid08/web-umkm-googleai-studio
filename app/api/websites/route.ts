import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { createWebsiteSchema } from "@/types";
import { checkWebsiteLimit } from "@/lib/websites/limits";
import {
  createDemoWebsite,
  getDemoActiveWebsite,
  getDemoWebsites,
  isDemoUserId,
} from "@/lib/mock/store";

function getSessionUserId(session: unknown): string | null {
  const user = (session as { user?: { id?: string } } | null)?.user;
  return user?.id ?? null;
}

function autoSubdomain(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `toko-${rand}`;
}

// GET /api/websites — daftar website milik sendiri (+ active, count, max)
export async function GET() {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (isDemoUserId(userId)) {
      const list = getDemoWebsites(userId);
      const active = getDemoActiveWebsite(userId);
      const limit = await checkWebsiteLimit(userId);
      return NextResponse.json({
        success: true,
        data: {
          websites: list,
          active_website_id: active?.id ?? list[0]?.id ?? null,
          count: list.length,
          max: limit.max,
        },
      });
    }

    // Service-role + filter user_id: akurat untuk semua provider (termasuk Google).
    const supabase = createServiceSupabaseClient();
    const [{ data: sites }, { data: user }] = await Promise.all([
      supabase
        .from("websites")
        .select("id, name, business_type, subdomain, custom_domain, custom_domain_verified, current_template_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase.from("users").select("active_website_id").eq("id", userId).maybeSingle(),
    ]);
    const { max } = await checkWebsiteLimit(userId);
    const list = sites ?? [];
    return NextResponse.json({
      success: true,
      data: {
        websites: list,
        active_website_id:
          (user as { active_website_id?: string } | null)?.active_website_id ?? list[0]?.id ?? null,
        count: list.length,
        max,
      },
    });
  } catch (error) {
    console.error("List websites error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// POST /api/websites — buat website baru (fencing limit plan)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createWebsiteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const limit = await checkWebsiteLimit(userId);
    if (!limit.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Paket Anda maksimal ${limit.max} website. Upgrade untuk menambah website.`,
          upgrade_url: "/dashboard/settings/billing",
        },
        { status: 403 }
      );
    }

    if (isDemoUserId(userId)) {
      const site = createDemoWebsite(userId, {
        name: parsed.data.name,
        business_type: parsed.data.business_type,
        subdomain: parsed.data.subdomain,
      });
      return NextResponse.json(
        {
          success: true,
          data: { website: site, active_website_id: site.id },
          message: "Website berhasil dibuat",
        },
        { status: 201 }
      );
    }

    const supabase = createServiceSupabaseClient();
    let subdomain = (parsed.data.subdomain || "").trim().toLowerCase() || autoSubdomain();
    const { data: clash } = await supabase
      .from("websites")
      .select("id")
      .eq("subdomain", subdomain)
      .maybeSingle();
    if (clash) subdomain = `${subdomain}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: site, error } = await supabase
      .from("websites")
      .insert({
        user_id: userId,
        name: parsed.data.name,
        business_type: parsed.data.business_type ?? null,
        subdomain,
      })
      .select("id, name, subdomain")
      .single();
    if (error || !site) {
      console.error("Create website error:", error);
      return NextResponse.json({ success: false, error: "Gagal membuat website" }, { status: 500 });
    }

    await supabase.from("users").update({ active_website_id: site.id }).eq("id", userId);

    return NextResponse.json(
      {
        success: true,
        data: { website: site, active_website_id: site.id },
        message: "Website berhasil dibuat",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create website error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
