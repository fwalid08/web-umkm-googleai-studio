import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { zipSync, strToU8 } from "fflate";

interface SessionUser {
  id: string;
}

function getSessionUser(session: unknown): SessionUser | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  if (!user?.id) return null;
  return user;
}

interface AssetMetadata {
  id: string;
  name: string;
  path: string;
  url: string;
  type: "image" | "script" | "style";
  size: number;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: template, error } = await supabase
      .from("templates_library")
      .select("*")
      .eq("id", id)
      .eq("user_id", sessionUser.id)
      .single();

    if (error || !template) {
      return NextResponse.json({ success: false, error: "Template tidak ditemukan" }, { status: 404 });
    }

    // Check if we should return ZIP (has assets/animations/behaviours) or just JSON
    const hasAssets = Array.isArray(template.assets) && template.assets.length > 0;
    const hasAnimations = Array.isArray(template.animations) && template.animations.length > 0;
    const hasBehaviours = Array.isArray(template.behaviours) && template.behaviours.length > 0;
    
    const hasExtras = hasAssets || hasAnimations || hasBehaviours;

    if (!hasExtras) {
      // Return simple JSON for templates without extra assets/animations
      const exportData = {
        version: "1.0",
        name: template.name,
        description: template.description,
        exported_at: new Date().toISOString(),
        data: template.template_data,
      };

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="template-${template.name.toLowerCase().replace(/\s+/g, "-")}.json"`,
        },
      });
    }

    // Build ZIP package
    const files: Record<string, Uint8Array> = {};

    // 1. template.json
    const templateJson = {
      version: "2.0",
      name: template.name,
      description: template.description,
      category: template.template_data?.category || "services",
      theme: template.template_data?.theme || {},
      headers: template.template_data?.headers || [],
      footers: template.template_data?.footers || [],
      sections: template.template_data?.sections || [],
      animations: template.animations || [],
      behaviours: template.behaviours || [],
    };
    files["template.json"] = strToU8(JSON.stringify(templateJson, null, 2));

    // 2. Assets — sertakan file aktual bila masih bisa diunduh (best-effort),
    // agar hasil export bisa di-import ulang dengan asset-nya. Selalu sertakan
    // meta.json sebagai fallback bila URL sudah kedaluwarsa.
    if (Array.isArray(template.assets) && template.assets.length > 0) {
      const assetsMeta = (template.assets as AssetMetadata[]).slice(0, 50);
      files["assets/meta.json"] = strToU8(JSON.stringify(assetsMeta, null, 2));
      for (const asset of assetsMeta) {
        if (!asset?.url || !asset?.name || typeof asset.url !== "string") continue;
        if (!/^https?:\/\//.test(asset.url)) continue;
        const safeName = asset.name.replace(/\\/g, "/").split("/").pop() || "";
        if (!safeName || safeName === "meta.json" || safeName.includes("..")) continue;
        try {
          const res = await fetch(asset.url);
          if (!res.ok) continue;
          const buf = new Uint8Array(await res.arrayBuffer());
          if (buf.length === 0 || buf.length > 10 * 1024 * 1024) continue;
          files[`assets/${safeName}`] = buf;
        } catch {
          // Abaikan asset yang gagal diunduh; meta.json tetap tersedia
        }
      }
    }

    // 3. Behaviours
    if (Array.isArray(template.behaviours) && template.behaviours.length > 0) {
      files["behaviours/meta.json"] = strToU8(JSON.stringify(template.behaviours, null, 2));
    }

    // 4. Animations
    if (Array.isArray(template.animations) && template.animations.length > 0) {
      files["animations/meta.json"] = strToU8(JSON.stringify(template.animations, null, 2));
    }

    // Create ZIP
    const zip = zipSync(files, { level: 6 });
    const fileName = `template-${template.name.toLowerCase().replace(/\s+/g, "-")}.zip`;

    return new NextResponse(zip, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}