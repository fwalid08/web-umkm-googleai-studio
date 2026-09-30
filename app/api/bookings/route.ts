import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { createBookingSchema } from "@/types";
import { checkRateLimit } from "@/lib/rate/limit";
import { notifyNewBooking } from "@/lib/notify/notify";
import { getOwnedWebsite } from "@/lib/websites/active";

function getSessionUserId(session: unknown): string | null {
  const user = (session as { user?: { id?: string } } | null)?.user;
  return user?.id ?? null;
}

function clientIp(request: NextRequest): string {
  const raw =
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(raw) || /^[0-9a-fA-F:]{3,45}$/.test(raw)) return raw.slice(0, 45);
  return "unknown";
}

function digitsOnly(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
  return cleaned;
}

// POST /api/bookings — submit booking PUBLIK (tanpa auth).
// Insert via service-role. Notif WA ke pemilik best-effort (mock bila tanpa provider).
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(`booking:${clientIp(request)}`, 10, 60000);
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { success: false, error: "Terlalu banyak booking. Coba lagi 1 menit." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const input = parsed.data;

    // Tanggal tidak boleh masa lalu
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(`${input.booking_date}T00:00:00`) < today) {
      return NextResponse.json(
        { success: false, error: "Tanggal booking tidak boleh masa lalu" },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    const { data: site } = await supabase
      .from("websites")
      .select("id, subdomain")
      .eq("id", input.website_id)
      .maybeSingle();
    if (!site) {
      return NextResponse.json({ success: false, error: "Toko tidak ditemukan" }, { status: 404 });
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        website_id: input.website_id,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        service_name: input.service_name,
        booking_date: input.booking_date,
        booking_time: input.booking_time,
        notes: input.notes || "",
        status: "baru",
      })
      .select("id")
      .single();
    if (error || !booking) {
      console.error("[bookings] insert gagal:", error);
      return NextResponse.json({ success: false, error: "Gagal menyimpan booking" }, { status: 500 });
    }

    // Notif WA ke pemilik (best-effort, tidak menggagalkan booking).
    // Nomor pemilik diambil dari konfigurasi forward_wa website bila ada.
    let ownerPhone: string | undefined;
    try {
      const { data: cfg } = await supabase
        .from("user_templates")
        .select("custom_config")
        .eq("website_id", input.website_id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const sections = ((cfg?.custom_config as Record<string, unknown> | null)?.sections ?? []) as Array<{
        type?: string;
        config?: Record<string, unknown>;
      }>;
      const b = sections.find((s) => s.type === "booking");
      const fw = b?.config?.forward_wa;
      if (typeof fw === "string" && digitsOnly(fw).length >= 9) ownerPhone = digitsOnly(fw);
    } catch {
      // abaikan — notif tetap jalan jalur mock/log
    }

    const subdomain = (site.subdomain as string | null) ?? "";
    notifyNewBooking({
      subdomain,
      bookingId: (booking.id as string).slice(0, 8),
      customerName: input.customer_name,
      serviceName: input.service_name,
      bookingDate: input.booking_date,
      bookingTime: input.booking_time,
      ownerPhone,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: { booking_id: booking.id, message: "Booking diterima! Kami akan konfirmasi via WhatsApp." },
    });
  } catch (err) {
    console.error("[bookings] POST error:", err);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// GET /api/bookings?website_id= — daftar booking milik owner (auth + ownership).
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const websiteId = request.nextUrl.searchParams.get("website_id") ?? "";
    if (!websiteId) {
      return NextResponse.json({ success: false, error: "website_id wajib diisi" }, { status: 400 });
    }
    const site = await getOwnedWebsite(userId, websiteId);
    if (!site) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("id, customer_name, customer_phone, service_name, booking_date, booking_time, notes, status, created_at")
      .eq("website_id", websiteId)
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true })
      .limit(200);
    if (error) {
      return NextResponse.json({ success: false, error: "Gagal memuat booking" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[bookings] GET error:", err);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
