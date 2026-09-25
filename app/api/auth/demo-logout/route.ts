import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Logout demo berhasil" });
  const clearOptions = {
    path: "/",
    maxAge: 0,
    sameSite: "none" as const,
    secure: true,
  };
  res.cookies.set("umkm_demo_user", "", clearOptions);
  res.cookies.set("umkm_demo_id", "", clearOptions);
  return res;
}
