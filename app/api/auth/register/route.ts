import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { signUpSchema } from "@/types";
import { ensureUniqueSubdomain, generateSubdomain, isValidSubdomain } from "@/lib/tenant/index";

// POST /api/auth/register - Register new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = signUpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, business_type } = validation.data;
    // Service-role client: bypasses RLS untuk admin ops (createUser + insert profile)
    const supabase = createServiceSupabaseClient();

    // Check if email already exists (via public.users — scalable, no full listUsers scan)
    const { data: existingProfile } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        business_type,
      },
    });

    if (authError || !authData.user) {
      console.error("Auth error:", authError);
      // Samakan respons jika email sudah ada di auth.users tapi belum di public.users
      const msg = String(authError?.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("exists") || msg.includes("duplicate")) {
        return NextResponse.json(
          { success: false, error: "Email sudah terdaftar" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: "Gagal membuat akun" },
        { status: 500 }
      );
    }

    // Generate unique subdomain (random, lowercase, clash retry 3x via helper)
    let base = generateSubdomain().toLowerCase();
    if (!isValidSubdomain(base)) base = generateSubdomain().toLowerCase();
    const subdomain = await ensureUniqueSubdomain(base, async (s) => {
      const { data: subClash } = await supabase
        .from("websites")
        .select("id")
        .eq("subdomain", s)
        .maybeSingle();
      return !!subClash;
    });

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create user profile (service-role bypasses RLS INSERT policy)
    // Sprint 03: kolom domain pindah ke websites; users.subdomain tidak lagi ditulis.
    const { data: user, error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        name,
        business_type,
        tier: "free",
        trial_ends_at: trialEndsAt.toISOString(),
        auth_provider: "credentials",
      })
      .select()
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      // Cleanup auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: "Gagal membuat profil user" },
        { status: 500 }
      );
    }

    // Sprint 03: website pertama ("Website Utama") + jadikan aktif
    const { data: site, error: siteError } = await supabase
      .from("websites")
      .insert({
        user_id: authData.user.id,
        name,
        business_type,
        subdomain,
      })
      .select("id, subdomain")
      .single();

    if (siteError || !site) {
      console.error("Website error:", siteError);
      await supabase.from("users").delete().eq("id", authData.user.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: "Gagal membuat website" },
        { status: 500 }
      );
    }
    await supabase.from("users").update({ active_website_id: site.id }).eq("id", authData.user.id);

    // Create default subscription record
    await supabase.from("subscriptions").insert({
      user_id: authData.user.id,
      tier: "free",
      status: "trialing",
      current_period_start: new Date().toISOString(),
      current_period_end: trialEndsAt.toISOString(),
      payment_gateway: "none",
    });

    return NextResponse.json({
      success: true,
      message: "Registrasi berhasil! Silakan masuk ke akun Anda.",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subdomain: site.subdomain,
          website_id: site.id,
        },
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}