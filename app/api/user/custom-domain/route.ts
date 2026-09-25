import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { customDomainSchema } from "@/types";
import { getActiveWebsite } from "@/lib/websites/active";
import { dnsTarget } from "@/lib/urls";

// PUT /api/user/custom-domain — submit custom domain website AKTIF (Sprint 03)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = customDomainSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { domain } = validation.data;
    const userId = (session.user as any).id as string;
    const site = await getActiveWebsite(userId);
    if (!site) {
      return NextResponse.json({ success: false, error: "Belum ada website" }, { status: 404 });
    }
    const supabase = createServiceSupabaseClient();

    // Normalize domain (remove www, protocol)
    const normalizedDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "");

    // Check if domain is already used by another website
    const { data: existing } = await supabase
      .from("websites")
      .select("id")
      .eq("custom_domain", normalizedDomain)
      .neq("id", site.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Domain sudah digunakan website lain" },
        { status: 409 }
      );
    }

    // Generate verification token
    const verificationCode = `saas-verify-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const { error } = await supabase
      .from("websites")
      .update({
        custom_domain: normalizedDomain,
        custom_domain_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", site.id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating custom domain:", error);
      return NextResponse.json(
        { success: false, error: "Gagal menyimpan domain" },
        { status: 500 }
      );
    }

    // Generate DNS instructions
    const dnsInstructions = [
      {
        type: "TXT",
        name: `_saas-verify.${normalizedDomain}`,
        value: verificationCode,
        description: "Untuk verifikasi kepemilikan domain",
      },
      {
        type: "CNAME",
        name: "@",
        value: dnsTarget(),
        description: "Arahkan ke platform SaaS",
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        website_id: site.id,
        domain: normalizedDomain,
        verification_code: verificationCode,
        dns_instructions: dnsInstructions,
      },
      message: "Domain disimpan. Silakan tambahkan record DNS untuk verifikasi.",
    });
  } catch (error) {
    console.error("Error submitting custom domain:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
