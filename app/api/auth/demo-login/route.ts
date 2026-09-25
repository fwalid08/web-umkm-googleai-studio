import { NextRequest, NextResponse } from "next/server";
import { findDemoUser, getDemoActiveWebsite, getDemoUser } from "@/lib/mock/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, id } = body;

    let user = null;
    if (id) {
      user = getDemoUser(id);
    } else if (email && password) {
      user = findDemoUser(email, password);
    } else if (email) {
      user = findDemoUser(email, "Password123!");
    }

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

    // Set cookies with SameSite=None; Secure for iframe preview compatibility
    const cookieOptions = {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "none" as const,
      secure: true,
    };

    res.cookies.set("umkm_demo_user", user.id, cookieOptions);
    res.cookies.set("umkm_demo_id", user.id, cookieOptions);

    return res;
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json({ success: false, error: "Gagal login demo" }, { status: 500 });
  }
}
