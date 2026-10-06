import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import z from "zod";
import {
  isDemoUserId,
  getDemoOwnedWebsite,
} from "@/lib/mock/store";

function getSessionUserId(session: unknown): string | null {
  const user = (session as { user?: { id?: string } } | null)?.user;
  return user?.id ?? null;
}

// Validation schema for website settings
const websiteSettingsSchema = z.object({
  // Currency & Localization
  currency: z.enum(["IDR", "USD"]).optional(),
  language: z.enum(["id", "en"]).optional(),
  timezone: z.string().optional(),

  // Payment Methods
  payment_methods: z.array(z.enum(["whatsapp", "midtrans", "xendit"])).optional(),

  // Notifications
  notify_whatsapp_new_order: z.boolean().optional(),
  notify_email_daily_summary: z.boolean().optional(),
  notify_email_low_stock: z.boolean().optional(),

  // Store Profile
  store_name: z.string().max(100).optional(),
  store_description: z.string().optional(),
  store_phone: z.string().max(20).optional(),
  store_email: z.string().email().optional().or(z.literal("")),
  store_address: z.string().optional(),
  operational_hours: z.record(z.string(), z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
  })).optional(),

  // SEO / Social
  meta_title: z.string().max(100).optional(),
  meta_description: z.string().max(300).optional(),
  og_image_url: z.string().url().optional().or(z.literal("")),
});

// Default settings for new websites
const defaultSettings = {
  currency: "IDR",
  language: "id",
  timezone: "Asia/Jakarta",
  payment_methods: ["whatsapp"],
  notify_whatsapp_new_order: true,
  notify_email_daily_summary: false,
  notify_email_low_stock: true,
  store_name: null,
  store_description: null,
  store_phone: null,
  store_email: null,
  store_address: null,
  operational_hours: null,
  meta_title: null,
  meta_description: null,
  og_image_url: null,
};

// GET /api/websites/[websiteId]/settings — get settings for a website
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { websiteId } = await params;

    // Demo user: use mock store
    if (isDemoUserId(userId)) {
      const website = getDemoOwnedWebsite(userId, websiteId);
      if (!website) {
        return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: { ...defaultSettings, website_id: websiteId },
      });
    }

    const supabase = createServiceSupabaseClient();

    // Verify website ownership
    const { data: website, error: websiteError } = await supabase
      .from("websites")
      .select("id")
      .eq("id", websiteId)
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (websiteError || !website) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }

    // Get settings
    const { data: settings, error } = await supabase
      .from("website_settings")
      .select("*")
      .eq("website_id", websiteId)
      .limit(1)
      .single();

    if (error) {
      console.error("Get website settings error:", error);
      return NextResponse.json({ success: false, error: "Gagal memuat pengaturan" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: settings || defaultSettings,
    });
  } catch (error) {
    console.error("Get website settings error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// PATCH /api/websites/[websiteId]/settings — update settings for a website
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { websiteId } = await params;
    const body = await request.json().catch(() => null);

    const parsed = websiteSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Demo user: use mock store (in-memory only)
    if (isDemoUserId(userId)) {
      const website = getDemoOwnedWebsite(userId, websiteId);
      if (!website) {
        return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
      }
      const merged = { ...defaultSettings, ...parsed.data, website_id: websiteId };
      return NextResponse.json({
        success: true,
        data: merged,
        message: "Pengaturan berhasil diperbarui (demo)",
      });
    }

    const supabase = createServiceSupabaseClient();

    // Verify website ownership
    const { data: website, error: websiteError } = await supabase
      .from("websites")
      .select("id")
      .eq("id", websiteId)
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (websiteError || !website) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }

    // Prepare update data (only include defined fields)
    const updateData: Record<string, unknown> = {};
    const data = parsed.data;

    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.payment_methods !== undefined) updateData.payment_methods = data.payment_methods;
    if (data.notify_whatsapp_new_order !== undefined) updateData.notify_whatsapp_new_order = data.notify_whatsapp_new_order;
    if (data.notify_email_daily_summary !== undefined) updateData.notify_email_daily_summary = data.notify_email_daily_summary;
    if (data.notify_email_low_stock !== undefined) updateData.notify_email_low_stock = data.notify_email_low_stock;
    if (data.store_name !== undefined) updateData.store_name = data.store_name;
    if (data.store_description !== undefined) updateData.store_description = data.store_description;
    if (data.store_phone !== undefined) updateData.store_phone = data.store_phone;
    if (data.store_email !== undefined) updateData.store_email = data.store_email || null;
    if (data.store_address !== undefined) updateData.store_address = data.store_address;
    if (data.operational_hours !== undefined) updateData.operational_hours = data.operational_hours;
    if (data.meta_title !== undefined) updateData.meta_title = data.meta_title;
    if (data.meta_description !== undefined) updateData.meta_description = data.meta_description;
    if (data.og_image_url !== undefined) updateData.og_image_url = data.og_image_url || null;

    // Upsert settings
    const { data: settings, error } = await supabase
      .from("website_settings")
      .upsert({
        website_id: websiteId,
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Update website settings error:", error);
      return NextResponse.json({ success: false, error: "Gagal memperbarui pengaturan" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: "Pengaturan berhasil diperbarui",
    });
  } catch (error) {
    console.error("Update website settings error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}