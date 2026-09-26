import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSessionUserId } from "@/lib/auth/utils";
import { getDemoUser, isDemoUserId } from "@/lib/mock/store";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { TIER_WEBSITE_FALLBACK, Tier } from "@/types";

export async function GET() {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (isDemoUserId(userId)) {
      const demo = getDemoUser(userId);
      const tier = (demo?.tier || "free") as Tier;
      return NextResponse.json({
        success: true,
        data: {
          tier,
          status: "trialing",
          current_period_end: demo?.trial_ends_at || null,
          billing_cycle: "monthly",
          max_websites: TIER_WEBSITE_FALLBACK[tier] || 1,
        },
      });
    }

    try {
      const supabase = createServiceSupabaseClient();
      const { data: user } = await supabase
        .from("users")
        .select("tier")
        .eq("id", userId)
        .maybeSingle();

      // Select kolom baru (010) — fallback ke kolom lama bila migrasi belum jalan.
      interface SubRow {
        status?: string;
        current_period_end?: string | null;
        billing_cycle?: string | null;
      }
      let sub: SubRow | null = null;
      try {
        const r = await supabase
          .from("subscriptions")
          .select("status, current_period_end, billing_cycle")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        sub = (r.data as unknown) as SubRow | null;
      } catch {
        const r = await supabase
          .from("subscriptions")
          .select("status, current_period_end")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        sub = (r.data as unknown) as SubRow | null;
      }

      const tier = ((user?.tier as Tier) || "free") as Tier;
      return NextResponse.json({
        success: true,
        data: {
          tier,
          status: sub?.status || "trialing",
          current_period_end: sub?.current_period_end || null,
          billing_cycle: sub?.billing_cycle || "monthly",
          max_websites: TIER_WEBSITE_FALLBACK[tier] || 1,
        },
      });
    } catch {
      return NextResponse.json({
        success: true,
        data: {
          tier: "free",
          status: "trialing",
          current_period_end: null,
          billing_cycle: "monthly",
          max_websites: 1,
        },
      });
    }
  } catch (error) {
    console.error("GET billing status error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
