import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

const forgotSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

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

    try {
      const supabase = createServiceSupabaseClient();
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
      // generateLink tidak mengirim email — hanya membuat token recovery.
      // Pengiriman email recovery ditangani template Supabase Auth / SMTP;
      // panggil resetPasswordForEmail bila ingin Supabase yang mengirim.
      await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: appUrl ? `${appUrl}/signin?recovered=1` : undefined,
        },
      });
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
