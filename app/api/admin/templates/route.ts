import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin/auth";

interface TemplateFilters {
  scope?: "user" | "public" | "all";
  category?: string;
  tier_requirement?: string;
  is_system_template?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  // is_system_template: hanya filter bila param eksplisit dikirim ("true"/"false").
  // Versi lama memakai `get(...) === "true"` sehingga nilainya selalu boolean
  // (default false) dan query SELALU memfilter is_system_template=false —
  // akibatnya template sistem (is_system_template=true, termasuk semua hasil
  // import) tidak pernah muncul di tabel.
  const sysParam = searchParams.get("is_system_template");
  const filters: TemplateFilters = {
    scope: searchParams.get("scope") as TemplateFilters["scope"] || "all",
    category: searchParams.get("category") || undefined,
    tier_requirement: searchParams.get("tier_requirement") || undefined,
    is_system_template: sysParam === null || sysParam === "" ? undefined : sysParam === "true",
    search: searchParams.get("search") || undefined,
    page: parseInt(searchParams.get("page") || "1"),
    pageSize: Math.min(parseInt(searchParams.get("pageSize") || "20"), 100),
  };

  const supabase = createServiceSupabaseClient();

  let query = supabase
    .from("templates_library")
    .select(
      `
      id,
      user_id,
      website_id,
      name,
      description,
      thumbnail_url,
      category,
      tier_requirement,
      is_system_template,
      sort_order,
      scope,
      created_at,
      updated_at,
      user:users!templates_library_user_id_fkey(id, email, name, tier)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (filters.scope && filters.scope !== "all") {
    query = query.eq("scope", filters.scope);
  }
  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.tier_requirement) {
    query = query.eq("tier_requirement", filters.tier_requirement);
  }
  if (filters.is_system_template !== undefined) {
    query = query.eq("is_system_template", filters.is_system_template);
  }
  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  const { data: templates, error, count } = await query;

  if (error) {
    console.error("Admin templates list error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch templates" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: templates || [],
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    name,
    description,
    category,
    tier_requirement,
    thumbnail_url,
    template_data,
    scope = "public",
    is_system_template = true,
    sort_order = 0,
  } = body as {
    name?: string;
    description?: string;
    category?: string;
    tier_requirement?: string;
    thumbnail_url?: string;
    template_data?: unknown;
    scope?: "user" | "public";
    is_system_template?: boolean;
    sort_order?: number;
  };

  if (!name || !template_data) {
    return NextResponse.json({ success: false, error: "Name and template_data are required" }, { status: 400 });
  }

  if (name.length < 3) {
    return NextResponse.json({ success: false, error: "Name must be at least 3 characters" }, { status: 400 });
  }

  const validCategories = ["food", "fashion", "handicraft", "retail", "services", "marketplace"];
  if (category && !validCategories.includes(category)) {
    return NextResponse.json({ success: false, error: "Invalid category" }, { status: 400 });
  }

  const validTiers = ["free", "starter", "growth", "enterprise", null];
  if (tier_requirement && !validTiers.includes(tier_requirement)) {
    return NextResponse.json({ success: false, error: "Invalid tier requirement" }, { status: 400 });
  }

  if (!template_data || typeof template_data !== "object" || Array.isArray(template_data)) {
    return NextResponse.json({ success: false, error: "Invalid template_data format" }, { status: 400 });
  }

  const td = template_data as Record<string, unknown>;
  const inner = td.template && typeof td.template === "object" && !Array.isArray(td.template) ? (td.template as Record<string, unknown>) : td;
  const hasTheme = !!inner.theme && typeof inner.theme === "object";
  const layout = td.layout as Record<string, unknown> | undefined;
  const hasLegacy = Array.isArray(layout?.rows) && !!td.core && typeof td.core === "object";
  if (!hasTheme && !hasLegacy) {
    return NextResponse.json(
      { success: false, error: "Template must have theme or layout.rows + core" },
      { status: 400 }
    );
  }

  const supabase = createServiceSupabaseClient();

  const { data: existing } = await supabase
    .from("templates_library")
    .select("id")
    .eq("name", name)
    .eq("scope", "public")
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ success: false, error: "Template name already exists" }, { status: 409 });
  }

  const safeThumbnail = typeof thumbnail_url === "string" && /^https?:\/\//.test(thumbnail_url) ? thumbnail_url.slice(0, 2000) : "";
  const safeDescription = typeof description === "string" ? description.trim().slice(0, 2000) : "";

  const { data: template, error } = await supabase
    .from("templates_library")
    .insert({
      user_id: null,
      website_id: null,
      name: name.trim().slice(0, 200),
      description: safeDescription,
      thumbnail_url: safeThumbnail,
      template_data: template_data as any,
      scope,
      category: category || "retail",
      tier_requirement: tier_requirement || "free",
      is_system_template,
      sort_order,
    })
    .select()
    .single();

  if (error) {
    console.error("Admin create template error:", error);
    return NextResponse.json({ success: false, error: "Failed to create template" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: template, message: "Template created successfully" });
}