import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getStorageProvider } from "@/lib/storage";
import { URL_REFRESH_EXPIRES_SECS } from "@/lib/builder/template-urls";
import {
  buildTemplateExportZip,
  createRouteFetchDeps,
  slugifyTemplateName,
} from "@/lib/builder/template-export";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * GET /api/admin/templates/[id]/export — export template APAPUN sebagai ZIP
 * import-compatible (termasuk system template milik user lain / user_id null).
 * Memakai service-role; proteksi via requireAdmin (admin@saas.com + enterprise).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 401 });
  }

  const { id } = await params;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ success: false, error: "Invalid template ID" }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data: template, error } = await supabase
      .from("templates_library")
      .select("id, name, description, template_data, assets, thumbnail_url")
      .eq("id", id)
      .single();

    if (error || !template) {
      if (error?.code === "PGRST116") {
        return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
      }
      console.error("Admin export fetch error:", error);
      return NextResponse.json({ success: false, error: "Failed to fetch template" }, { status: 500 });
    }

    const storage = getStorageProvider();
    const deps = createRouteFetchDeps({
      signStoragePath: async (storagePath: string) => {
        try {
          const r = await storage.getSignedUrl({ path: storagePath, expiresIn: URL_REFRESH_EXPIRES_SECS });
          return r.success && r.url ? r.url : null;
        } catch {
          return null;
        }
      },
    });

    let built;
    try {
      built = await buildTemplateExportZip(
        {
          id: template.id,
          name: template.name,
          description: template.description,
          template_data: template.template_data,
          assets: template.assets,
          thumbnail_url: template.thumbnail_url,
        },
        deps,
      );
    } catch (e) {
      console.error("Admin export build error:", e);
      return NextResponse.json(
        { success: false, error: "Template data is not valid for export" },
        { status: 500 },
      );
    }

    if (built.warnings.length > 0) {
      console.warn(`Admin export ${slugifyTemplateName(template.name)} warnings:`, built.warnings);
    }

    return new NextResponse(built.bytes, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${built.fileName}"`,
      },
    });
  } catch (error) {
    console.error("Admin export error:", error);
    return NextResponse.json({ success: false, error: "Server error during export" }, { status: 500 });
  }
}
