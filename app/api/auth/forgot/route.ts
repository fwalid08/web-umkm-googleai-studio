import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

const forgotSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

// Rate-limit sederhana in-memory (best-effort, reset saat restart/scale).
// Prod → ganti Redis/Upstash. Key dipisah per email & per IP.
const WINDOW_MS = 60 * 60 * 1000; // 1 jam
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;
const buckets = new Map<string, { count: number; resetAt: number }>();

function hitRateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  buckets.set(key, entry);
  return entry.count > max;
}

function clientIp(request: NextRequest): string {
  // Best-effort: X-Forwarded-For mudah dipalsukan client, jadi sanitasi ketat
  // dan hanya dipakai sebagai key rate-limit (bukan auth). Prod → ganti Redis.
  const raw =
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(raw) || /^[0-9a-fA-F:]{3,45}$/.test(raw)) return raw.slice(0, 45);
  return "unknown";
}

// POST /api/auth/forgot - Minta link reset password.
// Anti-enumerasi: SELALU return { success: true } untuk email berformat valid,
// baik email terdaftar maupun tidak. Jangan bocorkan status akun ke client.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const validation = forgotSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Rate-limit: 20/jam per IP + 5/jam per email. Return 429 jika over.
    // (429 boleh eksplisit — tidak membocorkan status akun.)
    if (hitRateLimit(`forgot:ip:${clientIp(request)}`, MAX_PER_IP)) {
      return NextResponse.json(
        { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429 }
      );
    }
    if (hitRateLimit(`forgot:email:${normalizedEmail}`, MAX_PER_EMAIL)) {
      return NextResponse.json(
        { success: false, error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429 }
      );
    }

    try {
      const supabase = createServiceSupabaseClient();
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
      const redirectTo = appUrl ? `${appUrl}/reset-password` : undefined;
      // Kirim email BENAR-BENAR via SMTP Supabase. generateLink hanya fallback.
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });
        if (error) throw error;
      } catch (sendErr) {
        console.error("Forgot resetPasswordForEmail fallback to generateLink:", sendErr);
        // Fallback: tetap buat token recovery agar tidak gagal total.
        await supabase.auth.admin.generateLink({
          type: "recovery",
          email,
          options: {
            redirectTo,
          },
        });
      }
    } catch (err) {
      // Sengaja ditelan: log server-side saja agar tidak bocor via respons.
      console.error("Forgot password error:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Jika email terdaftar, link reset password telah dikirim.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    // Tetap sukses generik (anti-enumerasi + tahan error tak terduga).
    return NextResponse.json({
      success: true,
      message: "Jika email terdaftar, link reset password telah dikirim.",
    });
  }
}
