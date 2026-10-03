import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getStorageProvider } from "@/lib/storage";
import { unzipSync, strFromU8 } from "fflate";
import { sanitizeBehaviourScript, sanitizeTemplateHtml } from "@/lib/builder/behaviour-script";
import { autoMapAssets } from "@/lib/builder/asset-automap";
import { replaceAssetUrls } from "@/lib/builder/template-urls";
import { collectAnimationsFromZip, mergeAnimations } from "@/lib/builder/template-import";
import { findAssetCoverageIssues, validateTemplateV3, validateChromeHtml } from "@/lib/builder/template-schema";
import { requireAdmin } from "@/lib/admin/auth";

interface AssetMetadata {
  id: string;
  name: string;
  path: string;
  url: string;
  type: "image" | "script" | "style";
  size: number;
}

// Batas keamanan upload — SAMA dengan route user (docs/AI_TEMPLATE_PROMPT.md §2.2).
// Jangan bedakan diam-diam: ZIP yang lolos di satu sisi harus lolos di sisi lain.
const MAX_ZIP_SIZE = 25 * 1024 * 1024; // 25 MB (file .zip)
const MAX_UNCOMPRESSED_SIZE = 100 * 1024 * 1024; // 100 MB total hasil unzip
const MAX_ZIP_ENTRIES = 200; // proteksi zip bomb / entri berlebihan
const MAX_SINGLE_ASSET_SIZE = 10 * 1024 * 1024; // 10 MB per asset
const MAX_ASSETS = 50;
const MAX_TEMPLATE_JSON_SIZE = 5 * 1024 * 1024; // 5 MB untuk template.json
const MAX_BEHAVIOURS = 50;
const MAX_THUMBNAIL_URL_LENGTH = 2000;

const ALLOWED_ASSET_EXTS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "svg", "ico", "avif", "js", "css",
]);

const ALLOWED_THUMBNAIL_NAMES = new Set([
  "thumbnail.png", "thumbnail.jpg", "thumbnail.jpeg", "thumbnail.webp",
]);

function generateId(): string {
  return crypto.randomUUID();
}

function getFileType(filename: string): "image" | "script" | "style" {
  const ext = filename.toLowerCase().split(".").pop() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "ico", "avif"].includes(ext)) return "image";
  if (ext === "js") return "script";
  if (ext === "css") return "style";
  return "image";
}

/**
 * Kategori + tier baris template sistem. Sumber: form import admin
 * (bukan template.json — satu sumber kebenaran, sesuai dokumen §tier).
 * Nilai tak dikenal → 400 eksplisit (dropdown UI mencegahnya duluan).
 */
const VALID_IMPORT_CATEGORIES = ["food", "fashion", "retail", "handicraft", "services"] as const;
const VALID_IMPORT_TIERS = ["free", "starter", "growth", "enterprise"] as const;

function parseCategoryTier(input: { category?: unknown; tier_requirement?: unknown }): {
  ok: true;
  category: string;
  tier_requirement: string;
} | { ok: false; error: string } {
  const category = typeof input.category === "string" && input.category ? input.category : "retail";
  const tier_requirement =
    typeof input.tier_requirement === "string" && input.tier_requirement ? input.tier_requirement : "free";
  if (!(VALID_IMPORT_CATEGORIES as readonly string[]).includes(category)) {
    return {
      ok: false,
      error: `Invalid category: ${category.slice(0, 40)}. Must be one of ${(VALID_IMPORT_CATEGORIES as readonly string[]).join(", ")}`,
    };
  }
  if (!(VALID_IMPORT_TIERS as readonly string[]).includes(tier_requirement)) {
    return {
      ok: false,
      error: `Invalid tier_requirement: ${tier_requirement.slice(0, 40)}. Must be one of ${(VALID_IMPORT_TIERS as readonly string[]).join(", ")}`,
    };
  }
  return { ok: true, category, tier_requirement };
}

function isSafeZipPath(path: string): boolean {
  if (!path || path.includes("\\") || path.startsWith("/") || path.startsWith("~")) return false;
  const segments = path.split("/");
  if (segments.some((s) => s === ".." || s === "")) {
    const isDir = path.endsWith("/");
    const parts = isDir ? segments.slice(0, -1) : segments;
    if (parts.some((s) => s === "" || s === "..")) return false;
  }
  return true;
}

function validateTemplateData(data: unknown): { ok: true; kind: string } | { ok: false; error: string } {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "Invalid template format: must be a JSON object" };
  }
  const d = data as Record<string, unknown>;
  const inner = d.template && typeof d.template === "object" && !Array.isArray(d.template)
    ? (d.template as Record<string, unknown>)
    : d;
  if (inner.theme && typeof inner.theme === "object") {
    for (const key of ["headers", "footers", "sections"] as const) {
      if (inner[key] !== undefined && !Array.isArray(inner[key])) {
        return { ok: false, error: `Invalid format: "${key}" must be an array` };
      }
    }
    if (Array.isArray(inner.sections) && inner.sections.length === 0) {
      return { ok: false, error: "Template must have at least one section" };
    }
    return { ok: true, kind: "template-v2" };
  }
  const layout = d.layout as Record<string, unknown> | undefined;
  if (Array.isArray(layout?.rows) && d.core && typeof d.core === "object") {
    return { ok: true, kind: "builder-config" };
  }
  return { ok: false, error: "Template must have theme (v2) or layout.rows + core (legacy)" };
}

function sanitizeScript(script: string): string {
  return sanitizeBehaviourScript(script);
}

function sanitizeBehaviours(input: unknown): unknown[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, MAX_BEHAVIOURS).map((b) => {
    if (!b || typeof b !== "object") return b;
    const copy = { ...(b as Record<string, unknown>) };
    if (typeof copy.script === "string") {
      copy.script = sanitizeScript(copy.script.slice(0, 100_000));
    }
    return copy;
  });
}

const ALL_SECTION_TYPES_SET = new Set([
  "hero", "features", "product_grid", "testimonials", "faq", "cta", "contact", "booking",
  "about", "gallery", "video", "team", "pricing", "newsletter", "divider", "marquee",
  "menu_board", "steps", "location",
]);

function sanitizeHtmlValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return value;
  if (typeof value === "string") {
    if (value.includes("<") && value.includes(">")) return sanitizeTemplateHtml(value);
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => sanitizeHtmlValue(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = sanitizeHtmlValue(v, depth + 1);
    return out;
  }
  return value;
}

function sanitizeTemplateHtmlFields(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  const sanitizeVariants = (list: unknown) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      if (typeof rec.html === "string" && rec.html.length > 0) rec.html = sanitizeTemplateHtml(rec.html.slice(0, 50_000));
      if (Array.isArray(rec.variants)) sanitizeVariants(rec.variants);
    }
  };
  sanitizeVariants(out.headers);
  sanitizeVariants(out.footers);
  sanitizeVariants(out.sections);
  const active = (out.activeSections as unknown) ?? ((out.data as Record<string, unknown> | undefined)?.activeSections as unknown);
  if (Array.isArray(active)) {
    const cleaned = (active as unknown[]).filter((s) => ALL_SECTION_TYPES_SET.has(String(s)));
    out.activeSections = cleaned;
    if (out.data && typeof out.data === "object" && !Array.isArray(out.data)) {
      (out.data as Record<string, unknown>).activeSections = cleaned;
    }
  }
  try { validateTemplateV3(out); } catch {}
  return sanitizeHtmlValue(out) as Record<string, unknown>;
}

async function uploadAsset(
  storage: ReturnType<typeof getStorageProvider>,
  templateFolderId: string,
  filePath: string,
  content: Uint8Array
): Promise<{ url: string; fileSize: number; storagePath: string }> {
  const folder = `template-assets/admin/${templateFolderId}`;
  const baseName = (filePath.split("/").pop() || "asset").replace(/\.[^.]+$/, "");
  const result = await storage.upload(new Uint8Array(content), {
    folder,
    fileName: baseName || "asset",
    signedUrl: true,
    signedUrlExpiresIn: 604800,
    metadata: { originalName: filePath },
  });
  if (!result.success || !result.file) throw new Error(result.error || "Failed to upload asset");
  return { url: result.file.url ?? "", fileSize: content.length, storagePath: result.file.path };
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 401 });
  }

  const uploadedStoragePaths: string[] = [];
  try {
    const contentType = request.headers.get("content-type") || "";
    let templateData: Record<string, unknown>;
    let name: string;
    let thumbnailUrl = "";
    let category = "retail";
    let tier_requirement = "free";
    const assets: AssetMetadata[] = [];
    let animations: unknown[] = [];
    let behaviours: unknown[] = [];
    const contentWarnings: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const nameRaw = formData.get("name");
      name = typeof nameRaw === "string" ? nameRaw.trim().slice(0, 200) : "";

      if (!file || !name) {
        return NextResponse.json({ success: false, error: "File and name are required" }, { status: 400 });
      }
      if (name.length < 3) {
        return NextResponse.json({ success: false, error: "Name must be at least 3 characters" }, { status: 400 });
      }
      const ctParsed = parseCategoryTier({
        category: formData.get("category"),
        tier_requirement: formData.get("tier_requirement"),
      });
      if (!ctParsed.ok) {
        return NextResponse.json({ success: false, error: ctParsed.error }, { status: 400 });
      }
      category = ctParsed.category;
      tier_requirement = ctParsed.tier_requirement;
      if (!file.name.toLowerCase().endsWith(".zip")) {
        return NextResponse.json({ success: false, error: "File must be .zip format" }, { status: 400 });
      }
      if (file.size > MAX_ZIP_SIZE) {
        return NextResponse.json({ success: false, error: `ZIP size exceeds ${MAX_ZIP_SIZE / 1024 / 1024} MB` }, { status: 413 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const zipData = new Uint8Array(arrayBuffer);
      let zip: Record<string, Uint8Array>;
      try { zip = unzipSync(zipData) as Record<string, Uint8Array>; }
      catch { return NextResponse.json({ success: false, error: "Invalid or corrupted ZIP file" }, { status: 400 }); }

      const entries = Object.entries(zip);
      if (entries.length === 0 || entries.length > MAX_ZIP_ENTRIES) {
        return NextResponse.json({ success: false, error: "Invalid number of files in ZIP" }, { status: 400 });
      }

      let totalUncompressed = 0;
      for (const [path, content] of entries) {
        if (!isSafeZipPath(path)) {
          return NextResponse.json({ success: false, error: `Unsafe path in ZIP: ${path.slice(0, 100)}` }, { status: 400 });
        }
        totalUncompressed += content.length;
        if (totalUncompressed > MAX_UNCOMPRESSED_SIZE) {
          return NextResponse.json({ success: false, error: "Uncompressed size exceeds limit" }, { status: 413 });
        }
      }

      const templateFile = zip["template.json"];
      if (!templateFile) {
        return NextResponse.json({ success: false, error: "template.json not found in ZIP" }, { status: 400 });
      }
      if (templateFile.length > MAX_TEMPLATE_JSON_SIZE) {
        return NextResponse.json({ success: false, error: "template.json too large (max 10 MB)" }, { status: 413 });
      }

      try { templateData = JSON.parse(strFromU8(templateFile)); }
      catch { return NextResponse.json({ success: false, error: "template.json is not valid JSON" }, { status: 400 }); }

      if (templateData.template && typeof templateData.template === "object" && !Array.isArray(templateData.template)) {
        const inner = templateData.template as Record<string, unknown>;
        templateData = { ...inner, description: templateData.description ?? inner.description };
      }

      const validation = validateTemplateData(templateData);
      if (!validation.ok) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }

      const templateFolderId = generateId();
      const storage = getStorageProvider();
      const assetMap = new Map<string, string>();

      for (const thumbName of ALLOWED_THUMBNAIL_NAMES) {
        const thumb = zip[thumbName];
        if (!thumb || thumb.length === 0 || thumb.length > MAX_SINGLE_ASSET_SIZE) continue;
        try {
          const { url, storagePath } = await uploadAsset(storage, templateFolderId, thumbName, new Uint8Array(thumb));
          uploadedStoragePaths.push(storagePath);
          thumbnailUrl = url.slice(0, MAX_THUMBNAIL_URL_LENGTH);
        } catch (e) { console.error("Thumbnail upload failed:", e); }
        break;
      }

      const parsedBehaviours: unknown[] = [];
      for (const [path, content] of entries) {
        if (!path.startsWith("behaviours/") || !path.toLowerCase().endsWith(".json")) continue;
        if (path === "behaviours/meta.json" || path.endsWith("/meta.json")) continue;
        if (content.length > 200_000) continue;
        try {
          const parsed = JSON.parse(strFromU8(content));
          if (Array.isArray(parsed)) parsedBehaviours.push(...parsed);
          else parsedBehaviours.push(parsed);
        } catch {}
        if (parsedBehaviours.length >= MAX_BEHAVIOURS) break;
      }

      let assetCount = 0;
      for (const [path, content] of entries) {
        if (!path.startsWith("assets/")) continue;
        const relativeName = path.replace("assets/", "");
        if (!relativeName || relativeName.endsWith("/")) continue;
        if (relativeName === "meta.json" || relativeName.endsWith("/meta.json")) continue;
        if (assetCount >= MAX_ASSETS) {
          return NextResponse.json({ success: false, error: `Asset count exceeds limit (${MAX_ASSETS})` }, { status: 400 });
        }
        const ext = relativeName.toLowerCase().split(".").pop() || "";
        if (!ALLOWED_ASSET_EXTS.has(ext)) {
          return NextResponse.json({ success: false, error: `File type not allowed: ${relativeName.slice(0, 80)}` }, { status: 400 });
        }
        if (content.length === 0 || content.length > MAX_SINGLE_ASSET_SIZE) {
          return NextResponse.json({ success: false, error: `Invalid asset size: ${relativeName.slice(0, 80)}` }, { status: 400 });
        }

        let bytes = new Uint8Array(content);
        if (ext === "js" || ext === "css") {
          try {
            const text = strFromU8(bytes);
            bytes = new TextEncoder().encode(sanitizeScript(text.slice(0, 500_000)));
          } catch {
            return NextResponse.json({ success: false, error: `Invalid script asset: ${relativeName.slice(0, 80)}` }, { status: 400 });
          }
        }

        const fileType = getFileType(relativeName);
        try {
          const { url, fileSize, storagePath } = await uploadAsset(storage, templateFolderId, path, bytes);
          uploadedStoragePaths.push(storagePath);
          assets.push({ id: generateId(), name: relativeName, path: `assets/${relativeName}`, url, type: fileType, size: fileSize });
          assetMap.set(`assets/${relativeName}`, url);
          assetMap.set(relativeName, url);
          assetCount += 1;
        } catch (e) {
          console.error("Asset upload failed:", relativeName, e);
          return NextResponse.json({ success: false, error: `Failed to upload asset: ${relativeName.slice(0, 80)}` }, { status: 500 });
        }
      }

      const assetPaths = new Set<string>();
      const td = templateData as Record<string, unknown>;
      const extractAssets = (config: unknown) => {
        if (typeof config === "string") {
          const matches = config.match(/(https?:\/\/[^\s"'>]+)|(assets\/[^\s"'>]+)/g);
          if (matches) matches.forEach((m) => assetPaths.add(m));
        } else if (Array.isArray(config)) {
          config.forEach(extractAssets);
        } else if (config && typeof config === "object") {
          Object.values(config as Record<string, unknown>).forEach(extractAssets);
        }
      };
      extractAssets(td.theme);
      extractAssets(td.sections);
      extractAssets(td.headers);
      extractAssets(td.footers);

      templateData = replaceAssetUrls(templateData, assetMap) as Record<string, unknown>;

      // Animasi: inline dulu, lalu animations/meta.json (sama seperti user route).
      animations = mergeAnimations(templateData.animations, collectAnimationsFromZip(entries));
      if (animations.length > 0) {
        templateData = { ...templateData, animations };
      }
      const inlineBehaviours = sanitizeBehaviours(templateData.behaviours);
      const folderBehaviours = sanitizeBehaviours(parsedBehaviours);
      behaviours = [...inlineBehaviours, ...folderBehaviours].slice(0, MAX_BEHAVIOURS);
      if (behaviours.length > 0) templateData = { ...templateData, behaviours };
    } else {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== "object") {
        return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
      }
      name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
      const templateDataRaw = body.template_data;
      if (!name || !templateDataRaw) {
        return NextResponse.json({ success: false, error: "Name and template_data are required" }, { status: 400 });
      }
      if (name.length < 3) {
        return NextResponse.json({ success: false, error: "Name must be at least 3 characters" }, { status: 400 });
      }
      const ctParsedJson = parseCategoryTier({
        category: (body as Record<string, unknown>).category,
        tier_requirement: (body as Record<string, unknown>).tier_requirement,
      });
      if (!ctParsedJson.ok) {
        return NextResponse.json({ success: false, error: ctParsedJson.error }, { status: 400 });
      }
      category = ctParsedJson.category;
      tier_requirement = ctParsedJson.tier_requirement;

      const unwrapped = templateDataRaw && typeof templateDataRaw === "object" && !Array.isArray(templateDataRaw) && "data" in (templateDataRaw as Record<string, unknown>)
        ? (templateDataRaw as Record<string, unknown>).data
        : templateDataRaw;

      const validation = validateTemplateData(unwrapped);
      if (!validation.ok) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }

      templateData = unwrapped as Record<string, unknown>;
      animations = mergeAnimations(templateData.animations, []);
      if (animations.length > 0) {
        templateData = { ...templateData, animations };
      }
      behaviours = sanitizeBehaviours(templateData.behaviours);
      if (behaviours.length > 0) templateData = { ...templateData, behaviours };
      const rawThumb = body.thumbnail_url;
      if (typeof rawThumb === "string" && /^https?:\/\//.test(rawThumb)) {
        thumbnailUrl = rawThumb.slice(0, MAX_THUMBNAIL_URL_LENGTH);
      }
    }

    const supabase = createServiceSupabaseClient();

    let autofilled: string[] = [];
    try {
      const mapped = autoMapAssets(templateData, assets.map((a) => ({ name: a.name, url: a.url })));
      templateData = mapped.templateData;
      autofilled = mapped.filled;
    } catch {}

    templateData = sanitizeTemplateHtmlFields(templateData);

    const chromeValidation = validateChromeHtml({
      headers: (templateData.headers as Array<Record<string, unknown>>) || [],
      footers: (templateData.footers as Array<Record<string, unknown>>) || [],
    });
    if (chromeValidation.errors.length > 0) {
      return NextResponse.json({ success: false, error: chromeValidation.errors.join("; ") }, { status: 400 });
    }

    const v3Validation = validateTemplateV3(templateData);
    const coverageWarnings = [
      ...contentWarnings,
      ...chromeValidation.warnings,
      ...v3Validation.warnings,
      ...findAssetCoverageIssues(templateData, assets.map((a) => ({ name: a.name, url: a.url }))),
    ];

    const { data: existing } = await supabase
      .from("templates_library")
      .select("id")
      .eq("name", name)
      .eq("scope", "public")
      .limit(1);
    if (existing && existing.length > 0) {
      return NextResponse.json({ success: false, error: "Template name already exists" }, { status: 409 });
    }

    const rawDescription = templateData.description;
    const insertData: Record<string, unknown> = {
      user_id: null,
      website_id: null,
      name,
      description: typeof rawDescription === "string" && rawDescription.trim() ? rawDescription.trim().slice(0, 2000) : "Imported system template",
      thumbnail_url: thumbnailUrl,
      template_data: templateData,
      scope: "public",
      category,
      tier_requirement,
      is_system_template: true,
      sort_order: 0,
      imported_from: null,
    };

    if (assets.length > 0) insertData.assets = assets;
    if (animations.length > 0) insertData.animations = animations;
    if (behaviours.length > 0) insertData.behaviours = behaviours;

    const { data: template, error } = await supabase
      .from("templates_library")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Admin import error:", error);
      if (uploadedStoragePaths.length > 0) {
        try {
          const storage = getStorageProvider();
          await storage.deleteMultiple(uploadedStoragePaths);
        } catch (cleanupErr) { console.error("Asset cleanup failed:", cleanupErr); }
      }
      return NextResponse.json({ success: false, error: `Import failed: ${String(error.message || error).slice(0, 300)}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: template,
      message: "System template imported successfully",
      ...(coverageWarnings.length > 0 ? { warnings: coverageWarnings } : {}),
      ...(autofilled.length > 0 ? { autofilled } : {}),
    });
  } catch (error) {
    console.error("Admin import error:", error);
    if (uploadedStoragePaths.length > 0) {
      try {
        const storage = getStorageProvider();
        await storage.deleteMultiple(uploadedStoragePaths);
      } catch (cleanupErr) { console.error("Asset cleanup failed:", cleanupErr); }
    }
    return NextResponse.json({ success: false, error: "Server error during import" }, { status: 500 });
  }
}