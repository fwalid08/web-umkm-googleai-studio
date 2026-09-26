import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { cookies, headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { findDemoUser, getDemoActiveWebsite, getDemoUser, isDemoUserId } from "@/lib/mock/store";
import { isDemoAuthEnabled } from "@/lib/auth/utils";
import { ensureUniqueSubdomain, generateSubdomain, isValidSubdomain } from "@/lib/tenant/index";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
if (!NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET wajib diisi — generate: openssl rand -base64 32");
}
if (process.env.NODE_ENV === "production") {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("[auth] GOOGLE_CLIENT_ID/SECRET kosong di production — login Google nonaktif");
  }
}
const isSecureCookie = process.env.NODE_ENV === "production";

const nextAuth = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-google-client-secret",
      authorization: { params: { prompt: "consent", access_type: "offline", response_type: "code" } },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Akun Demo login instan — hanya jika demo auth diizinkan (dev)
        if (isDemoAuthEnabled()) {
          const demo = findDemoUser(credentials.email as string, credentials.password as string);
          if (demo) {
            const active = getDemoActiveWebsite(demo.id);
            return {
              id: demo.id,
              email: demo.email,
              name: demo.name,
              image: null,
              tier: demo.tier,
              subdomain: active?.subdomain ?? "tenant-demo",
              business_type: demo.business_type,
              trial_ends_at: demo.trial_ends_at,
            } as any;
          }
        }

        try {
          const supabase = await createServerSupabaseClient();
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          });
          if (error || !data.user) return null;
          const { data: profile } = await supabase
            .from("users")
            .select("id, name, business_type, tier, subdomain, trial_ends_at, avatar_url")
            .eq("id", data.user.id)
            .single();
          if (!profile) return null;
          // Sprint 03: subdomain session ikut website aktif (bukan kolom users legacy)
          const { data: active } = await supabase
            .from("websites")
            .select("subdomain")
            .eq("user_id", data.user.id)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();
          return {
            id: data.user.id,
            email: data.user.email!,
            name: profile.name || data.user.email!,
            image: profile.avatar_url || null,
            tier: (profile.tier as any) || "free",
            subdomain: active?.subdomain ?? profile.subdomain,
            business_type: profile.business_type,
            trial_ends_at: profile.trial_ends_at,
          } as any;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider === "google") {
        // Tolak email yang belum terverifikasi Google
        const verified = (profile as { email_verified?: boolean } | undefined)?.email_verified;
        if (verified === false) return false;
        try {
          // Service-role: bypasses RLS INSERT (anon tidak bisa insert tanpa auth.uid)
          const supabase = createServiceSupabaseClient();
          // Check if user already exists by email
          const { data: existing } = await supabase.from("users").select("id, tier, subdomain").eq("email", user.email).maybeSingle();
          if (!existing) {
            // Auto-create profile untuk Google user (no password, auth via NextAuth)
            const newId = crypto.randomUUID();
            let base = generateSubdomain().toLowerCase();
            if (!isValidSubdomain(base)) base = generateSubdomain().toLowerCase();
            // Clash retry 3x loop via helper testable
            const subdomain = await ensureUniqueSubdomain(base, async (s) => {
              const { data: subClash } = await supabase
                .from("websites")
                .select("id")
                .eq("subdomain", s)
                .maybeSingle();
              return !!subClash;
            });
            const trialEndsAt = new Date(); trialEndsAt.setDate(trialEndsAt.getDate() + 14);
            const { error } = await supabase.from("users").insert({
              id: newId,
              email: user.email!,
              name: user.name || user.email!.split("@")[0],
              business_type: "retail",
              tier: "free",
              trial_ends_at: trialEndsAt.toISOString(),
              avatar_url: user.image || null,
              auth_provider: "google",
              google_id: account?.providerAccountId || null,
            });
            if (error) console.error("Google auto-create profile error", error);
            const { data: site } = await supabase
              .from("websites")
              .insert({ user_id: newId, name: user.name || "Website Utama", business_type: "retail", subdomain })
              .select("id")
              .single();
            if (site) await supabase.from("users").update({ active_website_id: site.id }).eq("id", newId);
            (user as any).id = newId;
            (user as any).tier = "free";
            (user as any).subdomain = subdomain;
            (user as any).business_type = "retail";
            (user as any).trial_ends_at = trialEndsAt.toISOString();
          } else {
            (user as any).id = existing.id;
            (user as any).tier = (existing as any).tier;
            (user as any).subdomain = (existing as any).subdomain;
          }
        } catch (e) {
          console.warn("Google sign-in profile sync skipped", e);
        }
      }
      return true;
    },
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = (user as any).id || token.sub;
        token.tier = (user as any).tier;
        token.subdomain = (user as any).subdomain;
        token.business_type = (user as any).business_type;
        token.trial_ends_at = (user as any).trial_ends_at;
        if (account?.provider === "google") {
          token.provider = "google";
        }
      }
      // Demo user refresh — hanya jika demo diizinkan
      if (token.id && isDemoUserId(token.id as string)) {
        if (!isDemoAuthEnabled()) return token;
        const active = getDemoActiveWebsite(token.id as string);
        if (active) token.subdomain = active.subdomain;
        return token;
      }
      // Refresh tier/subdomain dari DB via service-role (bypass RLS).
      // Trigger: field penting missing ATAU cache > 10 menit. Jangan query tiap request.
      try {
        const now = Date.now();
        const last = typeof token.lastRefresh === "number" ? (token.lastRefresh as number) : 0;
        const missing =
          !token.tier || !token.subdomain;
        const stale = now - last > 10 * 60 * 1000;
        if ((missing || stale) && token.id && typeof token.id === "string") {
          const svc = createServiceSupabaseClient();
          const { data: u } = await svc
            .from("users")
            .select("tier, business_type, trial_ends_at, active_website_id, subdomain")
            .eq("id", token.id as string)
            .maybeSingle();
          const row = u as {
            tier?: string | null;
            business_type?: string | null;
            trial_ends_at?: string | null;
            active_website_id?: string | null;
            subdomain?: string | null;
          } | null;
          if (row) {
            if (row.tier) token.tier = row.tier;
            if (row.business_type) token.business_type = row.business_type;
            if (row.trial_ends_at) token.trial_ends_at = row.trial_ends_at;
            let resolved: string | null = null;
            if (row.active_website_id) {
              const { data: site } = await svc
                .from("websites")
                .select("subdomain")
                .eq("id", row.active_website_id)
                .maybeSingle();
              resolved = (site as { subdomain?: string | null } | null)?.subdomain ?? null;
            }
            if (!resolved) {
              if (row.subdomain) {
                resolved = row.subdomain;
              } else {
                const { data: first } = await svc
                  .from("websites")
                  .select("subdomain")
                  .eq("user_id", token.id as string)
                  .order("created_at", { ascending: true })
                  .limit(1)
                  .maybeSingle();
                resolved = (first as { subdomain?: string | null } | null)?.subdomain ?? null;
              }
            }
            if (resolved) token.subdomain = resolved;
          }
          token.lastRefresh = now;
        }
      } catch {}
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).tier = token.tier;
        (session.user as any).subdomain = token.subdomain;
        (session.user as any).business_type = token.business_type;
        (session.user as any).trial_ends_at = token.trial_ends_at;
        (session.user as any).provider = token.provider;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isSecureCookie,
      },
    },
    callbackUrl: {
      name: "authjs.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: isSecureCookie,
      },
    },
    csrfToken: {
      name: "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isSecureCookie,
      },
    },
  },
  secret: NEXTAUTH_SECRET,
});

export const { handlers, signIn, signOut } = nextAuth;

export async function auth() {
  try {
    const s = await nextAuth.auth();
    if (s?.user) return s;
  } catch {}

  // Demo fallback — MATI di prod kecuali ALLOW_DEMO_AUTH=true
  if (!isDemoAuthEnabled()) return null;

  try {
    // Check cookies for demo user
    const cookieStore = await cookies();
    const demoId = cookieStore.get("umkm_demo_user")?.value || cookieStore.get("umkm_demo_id")?.value;
    if (demoId && isDemoUserId(demoId)) {
      const demo = getDemoUser(demoId);
      if (demo) {
        const active = getDemoActiveWebsite(demo.id);
        return {
          user: {
            id: demo.id,
            email: demo.email,
            name: demo.name,
            image: null,
            tier: demo.tier,
            subdomain: active?.subdomain ?? "tenant-demo",
            business_type: demo.business_type,
            trial_ends_at: demo.trial_ends_at,
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        } as any;
      }
    }

    // Check request header for demo user (dev/preview iframe only)
    const headerStore = await headers();
    const headerId = headerStore.get("x-demo-user-id");
    if (headerId && isDemoUserId(headerId)) {
      const demo = getDemoUser(headerId);
      if (demo) {
        const active = getDemoActiveWebsite(demo.id);
        return {
          user: {
            id: demo.id,
            email: demo.email,
            name: demo.name,
            image: null,
            tier: demo.tier,
            subdomain: active?.subdomain ?? "tenant-demo",
            business_type: demo.business_type,
            trial_ends_at: demo.trial_ends_at,
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        } as any;
      }
    }
  } catch {}

  return null;
}

