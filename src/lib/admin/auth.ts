import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export interface AdminSession {
  user: {
    id: string;
    email: string;
    name: string;
    tier: string;
    subdomain: string | null;
    business_type: string;
  };
  permissions: string[];
}

export class AdminAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    throw new AdminAuthError("Authentication required");
  }

  const isAdmin = user.email === "admin@saas.com" && user.tier === "enterprise";
  if (!isAdmin) {
    throw new AdminAuthError("Admin access required: enterprise tier + admin@saas.com");
  }

  return {
    user: {
      id: (user as any).id,
      email: user.email!,
      name: (user as any).name || user.email!,
      tier: (user as any).tier,
      subdomain: (user as any).subdomain,
      business_type: (user as any).business_type,
    },
    permissions: ["*"],
  };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}

export function redirectIfNotAdmin(callbackUrl?: string): never {
  redirect(callbackUrl || "/signin?callbackUrl=/admin");
}