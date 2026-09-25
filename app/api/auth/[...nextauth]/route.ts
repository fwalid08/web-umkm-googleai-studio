import { handlers, auth } from "@/lib/auth/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const res = await handlers.GET(req);
  const url = new URL(req.url);
  if (url.pathname.endsWith("/session")) {
    try {
      const cloned = res.clone();
      const body = await cloned.json();
      if (!body || Object.keys(body).length === 0 || !body.user) {
        const session = await auth();
        if (session?.user) {
          return NextResponse.json(session);
        }
      }
    } catch {
      const session = await auth();
      if (session?.user) {
        return NextResponse.json(session);
      }
    }
  }
  return res;
}

export const POST = handlers.POST;
