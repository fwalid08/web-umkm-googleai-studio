import { NextRequest, NextResponse } from "next/server";
import { findDemoUser, getDemoActiveWebsite } from "@/lib/mock/store";
import { isDemoAuthEnabled } from "@/lib/auth/utils";

export async function POST(req: NextRequest) {
  try {
    if (!isDemoAuthEnabled()) {
      return NextResponse.json({ success: false, error: "Demo login nonaktif" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    // Wajib email+password — tidak ada login by-id / default password
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email dan password wajib diisi" }, { status: 400 });
    }
    const user = findDemoUser(email, password);

    if (!user) {
      return NextResponse.json({ success: false, error: "Akun demo tidak ditemukan" }, { status: 404 });
    }

    const activeSite = getDemoActiveWebsite(user.id);
    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      business_type: user.business_type,
      subdomain: activeSite?.subdomain ?? "tenant-demo",
      trial_ends_at: user.trial_ends_at,
    };

    const res = NextResponse.json({
      success: true,
      user: sessionUser,
      message: "Login demo berhasil",
    });

    // httpOnly agar tidak bisa dibaca XSS; Lax default, Secure hanya di prod
    const isProd = process.env.NODE_ENV === "production";
    const cookieOptions = {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax" as const,
      secure: isProd,
      httpOnly: true,
    };

    res.cookies.set("umkm_demo_user", user.id, cookieOptions);
    res.cookies.set("umkm_demo_id", user.id, cookieOptions);

    return res;
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json({ success: false, error: "Gagal login demo" }, { status: 500 });
  }
}
