import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { isAuthorizedCronRequest } from "@/lib/cron/secret";
import { removeDomainFromVercel } from "@/lib/vercel/domains";
import {
  daysUntilExpiry,
  logReminderNotifier,
  shouldSendReminder,
  type ReminderNotifier,
} from "@/lib/domains/reminders";

interface ActiveOrderRow {
  id: string;
  user_id: string;
  website_id: string;
  domain: string;
  expires_at: string | null;
  renewal_reminder_sent_at: string | null;
}

/**
 * POST /api/domains/renewal-reminders — cron harian 02:00 UTC (09:00 WIB).
 *
 * 1. Expired sweep: order `active` yang melewati `expires_at` → `expired` +
 *    website fallback ke subdomain (custom_domain di-null-kan) + lepas dari
 *    Vercel (best-effort). [Asumsi]: tak ada cron lain yang mengerjakan
 *    transisi active → expired (matriks §3), jadi dikerjakan di sini.
 * 2. Reminder T-30/14/7/1 untuk order `active` (anti-spam via
 *    `shouldSendReminder` satu-kolom) → port `ReminderNotifier`
 *    (default log; WA/email penuh Sprint 3).
 */
export async function POST(request: NextRequest) {
  const notifier = logReminderNotifier;
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const now = new Date();
    const nowIso = now.toISOString();
    const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Expired sweep (cap 100/run).
    let expiredCount = 0;
    try {
      const { data: overdue } = await supabase
        .from("domain_orders")
        .select("id, user_id, website_id, domain, expires_at")
        .eq("status", "active")
        .lt("expires_at", nowIso)
        .limit(100);
      for (const o of (overdue ?? []) as Array<{
        id: string; user_id: string; website_id: string; domain: string; expires_at: string;
      }>) {
        const { error: expError } = await supabase
          .from("domain_orders")
          .update({ status: "expired", updated_at: nowIso })
          .eq("id", o.id);
        if (expError) {
          console.error(`[renewal-reminders] expire gagal ${o.domain}:`, expError);
          continue;
        }
        // Website fallback ke subdomain (custom link dicabut).
        await supabase
          .from("websites")
          .update({
            custom_domain: null,
            custom_domain_verified: false,
            custom_domain_verified_at: null,
            custom_domain_verification_token: null,
            updated_at: nowIso,
          })
          .eq("id", o.website_id)
          .eq("user_id", o.user_id);
        // Lepas dari Vercel (best-effort; tanpa token → skip diam-diam).
        if (process.env.VERCEL_TOKEN) {
          try {
            const r = await removeDomainFromVercel(o.domain);
            if (!r.ok) console.warn(`[renewal-reminders] vercel remove ${o.domain} gagal:`, r.error);
          } catch (err) {
            console.warn(`[renewal-reminders] vercel remove ${o.domain} error:`, err);
          }
        }
        await notifier.domainExpired({ websiteId: o.website_id, domain: o.domain, expiresAt: o.expires_at }).catch(() => {});
        expiredCount++;
      }
    } catch (err) {
      console.error("[renewal-reminders] expired sweep gagal:", err);
    }

    // 2. Reminder untuk active yang expiry ≤ 30 hari (cap 200/run).
    let remindedCount = 0;
    const results: Array<{ domain: string; bucket: number; days_left: number }> = [];
    try {
      const { data: expiring } = await supabase
        .from("domain_orders")
        .select("id, user_id, website_id, domain, expires_at, renewal_reminder_sent_at")
        .eq("status", "active")
        .gte("expires_at", nowIso)
        .lte("expires_at", in30d)
        .order("expires_at", { ascending: true })
        .limit(200);
      for (const o of (expiring ?? []) as ActiveOrderRow[]) {
        if (!o.expires_at) continue;
        const decision = shouldSendReminder(o.renewal_reminder_sent_at, o.expires_at, now);
        if (!decision.send || decision.bucket === null) continue;
        const daysLeft = daysUntilExpiry(o.expires_at, now);
        await notifier
          .renewalReminder({
            websiteId: o.website_id,
            domain: o.domain,
            daysLeft,
            bucket: decision.bucket,
            expiresAt: o.expires_at,
          })
          .catch(() => {});
        const { error: stampError } = await supabase
          .from("domain_orders")
          .update({ renewal_reminder_sent_at: nowIso, updated_at: nowIso })
          .eq("id", o.id);
        if (stampError) {
          console.error(`[renewal-reminders] stamp gagal ${o.domain}:`, stampError);
          continue;
        }
        remindedCount++;
        results.push({ domain: o.domain, bucket: decision.bucket, days_left: daysLeft });
      }
    } catch (err) {
      console.error("[renewal-reminders] reminder batch gagal:", err);
    }

    return NextResponse.json({
      success: true,
      data: { expired: expiredCount, reminded: remindedCount, results },
    });
  } catch (error) {
    console.error("POST domains renewal-reminders error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
