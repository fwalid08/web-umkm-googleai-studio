import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

type TxStatus = string;

/**
 * Webhook Midtrans (public, tanpa auth).
 * Verifikasi: signature_key = sha512(order_id + status_code + gross_amount + SERVER_KEY).
 * Idempoten: bila subscription sudah active+paid untuk order yang sama, return sukses langsung.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      order_id?: string;
      status_code?: string;
      gross_amount?: string;
      signature_key?: string;
      transaction_status?: TxStatus;
      fraud_status?: string;
      payment_type?: string;
    };

    const { order_id, status_code, gross_amount, signature_key, transaction_status } = body;
    if (!order_id || !status_code || !gross_amount || !signature_key || !transaction_status) {
      return NextResponse.json({ success: false, error: "Payload tidak lengkap" }, { status: 400 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { success: false, error: "MIDTRANS_SERVER_KEY belum dikonfigurasi" },
        { status: 500 }
      );
    }

    const expected = createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");
    if (expected !== signature_key) {
      return NextResponse.json({ success: false, error: "Signature tidak valid" }, { status: 403 });
    }

    const supabase = createServiceSupabaseClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, user_id, tier, status, paid_at")
      .eq("payment_reference", order_id)
      .maybeSingle();

    if (!sub) {
      // Order tidak dikenal (mis. mock/dev) — balas 200 agar Midtrans tidak retry,
      // tapi tandai success:false agar terpantau di log.
      console.warn("[billing/webhook] order tidak dikenal:", order_id);
      return NextResponse.json({ success: false, error: "Order tidak ditemukan" }, { status: 200 });
    }

    const status = (transaction_status || "").toLowerCase();
    const fraud = (body.fraud_status || "").toLowerCase();

    // Idempotency: sudah lunas untuk order ini.
    if (sub.status === "active" && sub.paid_at) {
      return NextResponse.json({ success: true, data: { order_id, status: "active", deduped: true } });
    }

    if (status === "capture" || status === "settlement") {
      // Credit card capture butuh fraud accept; challenge = tunda (past_due).
      if (status === "capture" && fraud === "challenge") {
        await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("id", sub.id);
        return NextResponse.json({ success: true, data: { order_id, status: "past_due" } });
      }
      const now = new Date().toISOString();
      await supabase
        .from("subscriptions")
        .update({ status: "active", paid_at: now })
        .eq("id", sub.id);
      if (sub.tier && sub.tier !== "free") {
        await supabase.from("users").update({ tier: sub.tier }).eq("id", sub.user_id);
      }
      return NextResponse.json({ success: true, data: { order_id, status: "active" } });
    }

    if (status === "deny") {
      await supabase.from("subscriptions").update({ status: "past_due" }).eq("id", sub.id);
      return NextResponse.json({ success: true, data: { order_id, status: "past_due" } });
    }

    if (status === "expire" || status === "cancel") {
      await supabase
        .from("subscriptions")
        .update({ status: "canceled", canceled_at: new Date().toISOString() })
        .eq("id", sub.id);
      return NextResponse.json({ success: true, data: { order_id, status: "canceled" } });
    }

    // pending / authorize / dll: biarkan trialing, tetap 200.
    return NextResponse.json({
      success: true,
      data: { order_id, status: sub.status, ignored: transaction_status },
    });
  } catch (error) {
    console.error("POST billing webhook error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
