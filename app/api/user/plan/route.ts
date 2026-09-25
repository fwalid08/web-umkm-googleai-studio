import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSessionUserId } from "@/lib/auth/utils";
import { isDemoUserId, setDemoUserTier, getDemoUser } from "@/lib/mock/store";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { TIER_WEBSITE_FALLBACK, Tier } from "@/types";

const VALID_TIERS: Tier[] = ["free", "starter", "growth", "enterprise"];

export async function GET() {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (isDemoUserId(userId)) {
      const demo = getDemoUser(userId);
      const tier = demo?.tier || "free";
      return NextResponse.json({
        success: true,
        data: {
          tier,
          max_websites: TIER_WEBSITE_FALLBACK[tier] || 1,
          trial_active: true,
        },
      });
    }

    try {
      const supabase = createServiceSupabaseClient();
      const { data: user } = await supabase
        .from("users")
        .select("tier, trial_ends_at")
        .eq("id", userId)
        .maybeSingle();

      const tier = (user?.tier as Tier) || "free";
      return NextResponse.json({
        success: true,
        data: {
          tier,
          max_websites: TIER_WEBSITE_FALLBACK[tier] || 1,
          trial_ends_at: user?.trial_ends_at || null,
        },
      });
    } catch {
      return NextResponse.json({
        success: true,
        data: {
          tier: "free",
          max_websites: 1,
          trial_active: false,
        },
      });
    }
  } catch (error) {
    console.error("GET user plan error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { tier, billing_cycle = "monthly" } = body;

    if (!tier || !VALID_TIERS.includes(tier)) {
      return NextResponse.json(
        { success: false, error: "Pilihan paket tidak valid" },
        { status: 400 }
      );
    }

    if (isDemoUserId(userId)) {
      setDemoUserTier(userId, tier);
      return NextResponse.json({
        success: true,
        message: `Paket berhasil diperbarui ke ${tier.toUpperCase()}`,
        data: {
          tier,
          billing_cycle,
          max_websites: TIER_WEBSITE_FALLBACK[tier] || 1,
        },
      });
    }

    try {
      const supabase = createServiceSupabaseClient();
      await supabase.from("users").update({ tier }).eq("id", userId);
    } catch (e) {
      console.warn("Could not update tier in database:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Paket berhasil diaktifkan: ${tier.toUpperCase()}`,
      data: {
        tier,
        billing_cycle,
        max_websites: TIER_WEBSITE_FALLBACK[tier] || 1,
      },
    });
  } catch (error) {
    console.error("POST user plan error:", error);
    return NextResponse.json({ success: false, error: "Gagal memperbarui paket" }, { status: 500 });
  }
}
