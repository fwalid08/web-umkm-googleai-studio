import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStorageProvider } from "@/lib/storage";
import { unzipSync, strFromU8 } from "fflate";

interface SessionUser {
  id: string;
}

interface AssetMetadata {
  id: string;
  name: string;
  path: string;
  url: string;
  type: "image" | "script" | "style";
  size: number;
}

// Batas keamanan upload
const MAX_ZIP_SIZE = 25 * 1024 * 1024; // 25 MB (file .zip)
const MAX_UNCOMPRESSED_SIZE = 100 * 1024 * 1024; // 100 MB total hasil unzip
const MAX_ZIP_ENTRIES = 200; // proteksi zip bomb / entri berlebihan
const MAX_SINGLE_ASSET_SIZE = 10 * 1024 * 1024; // 10 MB per asset
const MAX_ASSETS = 50;
const MAX_TEMPLATE_JSON_SIZE = 5 * 1024 * 1024; // 5 MB untuk template.json
const MAX_BEHAVIOURS = 50;

const ALLOWED_ASSET_EXTS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "ico",
  "avif",
  "js",
  "css",
]);

const ALLOWED_THUMBNAIL_NAMES = new Set([
  "thumbnail.png",
  "thumbnail.jpg",
  "thumbnail.jpeg",
  "thumbnail.webp",
]);

function getSessionUser(session: unknown): SessionUser | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  if (!user?.id) return null;
  return user;
}

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

/** Tolak path traversal / path absolut di dalam ZIP. */
function isSafeZipPath(path: string): boolean {
  if (!path || path.includes("\\") || path.startsWith("/") || path.startsWith("~")) return false;
  const segments = path.split("/");
  if (segments.some((s) => s === ".." || s === "")) {
    // Izinkan trailing slash untuk direktori, tapi tolak segmen kosong di tengah & ".."
    const isDir = path.endsWith("/");
    const parts = isDir ? segments.slice(0, -1) : segments;
    if (parts.some((s) => s === "" || s === "..")) return false;
  }
  return true;
}

type TemplateKind = "template-v2" | "builder-config";

function validateTemplateData(data: unknown): { ok: true; kind: TemplateKind } | { ok: false; error: string } {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "Format template tidak valid: harus berupa objek JSON" };
  }
  const d = data as Record<string, unknown>;

  // Format Template v2 (hasil export ZIP / template builtin):
  // { theme, headers?, footers?, sections?, ... } atau { template: {...} }
  const inner = (d.template && typeof d.template === "object" && !Array.isArray(d.template)
    ? (d.template as Record<string, unknown>)
    : d) as Record<string, unknown>;

  if (inner.theme && typeof inner.theme === "object") {
    for (const key of ["headers", "footers", "sections"] as const) {
      if (inner[key] !== undefined && !Array.isArray(inner[key])) {
        return { ok: false, error: `Format template tidak valid: "${key}" harus berupa array` };
      }
    }
    if (Array.isArray(inner.sections) && inner.sections.length === 0) {
      return { ok: false, error: "Format template tidak valid: sections kosong" };
    }
    return { ok: true, kind: "template-v2" };
  }

  // Format legacy BuilderConfig: { layout: { rows }, core }
  const layout = d.layout as Record<string, unknown> | undefined;
  if (Array.isArray(layout?.rows) && d.core && typeof d.core === "object") {
    return { ok: true, kind: "builder-config" };
  }

  return {
    ok: false,
    error: "Format template tidak valid: wajib punya \"theme\" (format template) atau \"layout.rows\" + \"core\" (format builder)",
  };
}

function sanitizeName(input: unknown): string {
  return typeof input === "string" ? input.trim().slice(0, 200) : "";
}

async function uploadAsset(
  storage: ReturnType<typeof getStorageProvider>,
  userId: string,
  templateFolderId: string,
  filePath: string,
  content: Uint8Array
): Promise<{ url: string; fileSize: number; storagePath: string }> {
  const fileName = filePath.split("/").pop() || "asset";
  const folder = `template-assets/${userId}/${templateFolderId}`;
  const result = await storage.upload(new Uint8Array(content), {
    folder,
    fileName,
    signedUrl: true,
    signedUrlExpiresIn: 604800,
    metadata: { originalName: filePath },
  });
  if (!result.success || !result.file) {
    throw new Error(result.error || "Gagal mengunggah asset");
  }
  return { url: result.file.url ?? "", fileSize: content.length, storagePath: result.file.path };
}

function replaceAssetUrls(
  obj: unknown,
  assetMap: Map<string, string>
): unknown {
  if (typeof obj === "string") {
    let out = obj;
    // Ganti dari path terpanjang dulu agar tidak tertimpa prefix pendek.
    const entries = [...assetMap.entries()].sort((a, b) => b[0].length - a[0].length);
    for (const [localPath, url] of entries) {
      if (!localPath || !url || !out.includes(localPath)) continue;
      out = out.split(localPath).join(url);
    }
    return out;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => replaceAssetUrls(item, assetMap));
  }
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = replaceAssetUrls(value, assetMap);
    }
    return result;
  }
  return obj;
}

function extractAssetsFromConfig(config: unknown, assetPaths: Set<string>): void {
  if (typeof config === "string") {
    const urlMatches = config.match(/(https?:\/\/[^\s"'>]+)|(assets\/[^\s"'>]+)/g);
    if (urlMatches) {
      urlMatches.forEach((m) => assetPaths.add(m));
    }
  } else if (Array.isArray(config)) {
    config.forEach((item) => extractAssetsFromConfig(item, assetPaths));
  } else if (config && typeof config === "object") {
    for (const value of Object.values(config as Record<string, unknown>)) {
      extractAssetsFromConfig(value, assetPaths);
    }
  }
}

function sanitizeScript(script: string): string {
  const dangerousPatterns = [
    /\beval\s*\(/g,
    /\bFunction\s*\(/g,
    /\bsetTimeout\s*\(\s*["'`]/g,
    /\bsetInterval\s*\(\s*["'`]/g,
    /\bdocument\.write\s*\(/g,
    /\bdocument\.writeln\s*\(/g,
    /new\s+Function\s*\(/g,
    /\bwindow\.location\s*=/g,
    /\blocation\.href\s*=/g,
    /<script[\s>]/gi,
    /<\/script\s*>/gi,
    /\bon\w+\s*=/gi,
  ];

  let sanitized = script;
  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, "// BLOCKED");
  }
  return sanitized;
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

export async function POST(request: NextRequest) {
  const uploadedStoragePaths: string[] = [];
  try {
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    let templateData: Record<string, unknown>;
    let name: string;
    let thumbnailUrl = "";
    const assets: AssetMetadata[] = [];
    let animations: unknown[] = [];
    let behaviours: unknown[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      name = sanitizeName(formData.get("name"));

      if (!file || !name) {
        return NextResponse.json(
          { success: false, error: "File dan nama template wajib diisi" },
          { status: 400 }
        );
      }

      if (name.length < 3) {
        return NextResponse.json(
          { success: false, error: "Nama template minimal 3 karakter" },
          { status: 400 }
        );
      }

      if (!file.name.toLowerCase().endsWith(".zip")) {
        return NextResponse.json(
          { success: false, error: "File harus berformat .zip" },
          { status: 400 }
        );
      }

      if (file.size > MAX_ZIP_SIZE) {
        return NextResponse.json(
          { success: false, error: `Ukuran ZIP melebihi batas ${MAX_ZIP_SIZE / 1024 / 1024} MB` },
          { status: 413 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const zipData = new Uint8Array(arrayBuffer);
      let zip: Record<string, Uint8Array>;
      try {
        zip = unzipSync(zipData) as Record<string, Uint8Array>;
      } catch {
        return NextResponse.json(
          { success: false, error: "File ZIP rusak atau tidak bisa dibuka" },
          { status: 400 }
        );
      }

      const entries = Object.entries(zip);
      if (entries.length === 0 || entries.length > MAX_ZIP_ENTRIES) {
        return NextResponse.json(
          { success: false, error: "Jumlah file dalam ZIP tidak valid" },
          { status: 400 }
        );
      }

      let totalUncompressed = 0;
      for (const [path, content] of entries) {
        if (!isSafeZipPath(path)) {
          return NextResponse.json(
            { success: false, error: `Path tidak aman di dalam ZIP: ${path.slice(0, 100)}` },
            { status: 400 }
          );
        }
        totalUncompressed += content.length;
        if (totalUncompressed > MAX_UNCOMPRESSED_SIZE) {
          return NextResponse.json(
            { success: false, error: "Ukuran hasil ekstrak ZIP melebihi batas" },
            { status: 413 }
          );
        }
      }

      const templateFile = zip["template.json"];
      if (!templateFile) {
        return NextResponse.json(
          { success: false, error: "template.json tidak ditemukan di ZIP" },
          { status: 400 }
        );
      }

      if (templateFile.length > MAX_TEMPLATE_JSON_SIZE) {
        return NextResponse.json(
          { success: false, error: "template.json terlalu besar (maks 5 MB)" },
          { status: 413 }
        );
      }

      try {
        templateData = JSON.parse(strFromU8(templateFile));
      } catch {
        return NextResponse.json(
          { success: false, error: "template.json tidak valid JSON" },
          { status: 400 }
        );
      }

      // Normalisasi: dukung { template: {...} } maupun objek langsung
      if (
        templateData.template &&
        typeof templateData.template === "object" &&
        !Array.isArray(templateData.template)
      ) {
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

      // Thumbnail (opsional): upload lalu pakai sebagai thumbnail_url
      for (const thumbName of ALLOWED_THUMBNAIL_NAMES) {
        const thumb = zip[thumbName];
        if (!thumb || thumb.length === 0 || thumb.length > MAX_SINGLE_ASSET_SIZE) continue;
        try {
          const { url, storagePath } = await uploadAsset(
            storage,
            sessionUser.id,
            templateFolderId,
            thumbName,
            new Uint8Array(thumb)
          );
          uploadedStoragePaths.push(storagePath);
          thumbnailUrl = url;
        } catch (e) {
          console.error("Thumbnail upload failed:", e);
        }
        break;
      }

      // Behaviours dari folder behaviours/*.json (opsional)
      const parsedBehaviours: unknown[] = [];
      for (const [path, content] of entries) {
        if (!path.startsWith("behaviours/") || !path.toLowerCase().endsWith(".json")) continue;
        if (path === "behaviours/meta.json" || path.endsWith("/meta.json")) continue;
        if (content.length > 200_000) continue;
        try {
          const parsed = JSON.parse(strFromU8(content));
          if (Array.isArray(parsed)) parsedBehaviours.push(...parsed);
          else parsedBehaviours.push(parsed);
        } catch {
          // Abaikan file behaviour yang rusak, lanjutkan import
        }
        if (parsedBehaviours.length >= MAX_BEHAVIOURS) break;
      }

      // Assets dari folder assets/ (lewati meta.json hasil export)
      let assetCount = 0;
      for (const [path, content] of entries) {
        if (!path.startsWith("assets/")) continue;
        const relativeName = path.replace("assets/", "");
        if (!relativeName || relativeName.endsWith("/")) continue;
        if (relativeName === "meta.json" || relativeName.endsWith("/meta.json")) continue;
        if (assetCount >= MAX_ASSETS) {
          return NextResponse.json(
            { success: false, error: `Jumlah asset melebihi batas (${MAX_ASSETS})` },
            { status: 400 }
          );
        }
        const ext = relativeName.toLowerCase().split(".").pop() || "";
        if (!ALLOWED_ASSET_EXTS.has(ext)) {
          return NextResponse.json(
            { success: false, error: `Tipe file tidak diizinkan: ${relativeName.slice(0, 80)}` },
            { status: 400 }
          );
        }
        if (content.length === 0 || content.length > MAX_SINGLE_ASSET_SIZE) {
          return NextResponse.json(
            { success: false, error: `Ukuran asset tidak valid: ${relativeName.slice(0, 80)}` },
            { status: 400 }
          );
        }

        let bytes = new Uint8Array(content);
        // Sanitasi script/style sebelum disimpan
        if (ext === "js" || ext === "css") {
          try {
            const text = strFromU8(bytes);
            const clean = sanitizeScript(text.slice(0, 500_000));
            bytes = new TextEncoder().encode(clean);
          } catch {
            return NextResponse.json(
              { success: false, error: `Asset script tidak valid: ${relativeName.slice(0, 80)}` },
              { status: 400 }
            );
          }
        }

        const fileType = getFileType(relativeName);
        try {
          const { url, fileSize, storagePath } = await uploadAsset(
            storage,
            sessionUser.id,
            templateFolderId,
            path,
            bytes
          );
          uploadedStoragePaths.push(storagePath);
          assets.push({
            id: generateId(),
            name: relativeName,
            path: `assets/${relativeName}`,
            url,
            type: fileType,
            size: fileSize,
          });
          assetMap.set(`assets/${relativeName}`, url);
          assetMap.set(relativeName, url);
          assetCount += 1;
        } catch (e) {
          console.error("Asset upload failed:", relativeName, e);
          return NextResponse.json(
            { success: false, error: `Gagal mengunggah asset: ${relativeName.slice(0, 80)}` },
            { status: 500 }
          );
        }
      }

      const assetPaths = new Set<string>();
      const td = templateData as Record<string, unknown>;
      extractAssetsFromConfig(td.theme, assetPaths);
      extractAssetsFromConfig(td.sections, assetPaths);
      extractAssetsFromConfig(td.headers, assetPaths);
      extractAssetsFromConfig(td.footers, assetPaths);

      templateData = replaceAssetUrls(templateData, assetMap) as Record<string, unknown>;

      if (Array.isArray(templateData.animations)) {
        animations = (templateData.animations as unknown[]).slice(0, 100);
      }
      const inlineBehaviours = sanitizeBehaviours(templateData.behaviours);
      const folderBehaviours = sanitizeBehaviours(parsedBehaviours);
      behaviours = [...inlineBehaviours, ...folderBehaviours].slice(0, MAX_BEHAVIOURS);
      if (behaviours.length > 0) {
        templateData = { ...templateData, behaviours };
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== "object") {
        return NextResponse.json(
          { success: false, error: "Body JSON tidak valid" },
          { status: 400 }
        );
      }
      name = sanitizeName((body as Record<string, unknown>).name);
      const templateDataRaw = (body as Record<string, unknown>).template_data;

      if (!name || !templateDataRaw) {
        return NextResponse.json(
          { success: false, error: "Name dan template_data wajib diisi" },
          { status: 400 }
        );
      }

      if (name.length < 3) {
        return NextResponse.json(
          { success: false, error: "Nama template minimal 3 karakter" },
          { status: 400 }
        );
      }

      // Dukung wrapper hasil export: { data: {...} } atau langsung template_data
      const unwrapped =
        templateDataRaw &&
        typeof templateDataRaw === "object" &&
        !Array.isArray(templateDataRaw) &&
        "data" in (templateDataRaw as Record<string, unknown>)
          ? (templateDataRaw as Record<string, unknown>).data
          : templateDataRaw;

      const validation = validateTemplateData(unwrapped);
      if (!validation.ok) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }

      templateData = unwrapped as Record<string, unknown>;
      if (Array.isArray(templateData.animations)) {
        animations = (templateData.animations as unknown[]).slice(0, 100);
      }
      behaviours = sanitizeBehaviours(templateData.behaviours);
      if (behaviours.length > 0) {
        templateData = { ...templateData, behaviours };
      }
      const rawThumb = (body as Record<string, unknown>).thumbnail_url;
      if (typeof rawThumb === "string" && /^https?:\/\//.test(rawThumb)) {
        thumbnailUrl = rawThumb.slice(0, 500);
      }
    }

    const supabase = await createServerSupabaseClient();

    // Cegah nama duplikat per user
    const { data: existing } = await supabase
      .from("templates_library")
      .select("id")
      .eq("user_id", sessionUser.id)
      .eq("name", name)
      .limit(1);
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "Nama template sudah digunakan" },
        { status: 409 }
      );
    }

    const rawDescription = templateData.description;
    const insertData: Record<string, unknown> = {
      user_id: sessionUser.id,
      name,
      description:
        typeof rawDescription === "string" && rawDescription.trim()
          ? rawDescription.trim().slice(0, 2000)
          : "Imported template",
      thumbnail_url: thumbnailUrl,
      template_data: templateData,
      scope: "user",
      imported_from: null,
    };

    if (Array.isArray(assets) && assets.length > 0) {
      insertData.assets = assets;
    }
    if (animations.length > 0) {
      insertData.animations = animations;
    }
    if (behaviours.length > 0) {
      insertData.behaviours = behaviours;
    }

    const { data: template, error } = await supabase
      .from("templates_library")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Import error:", error);
      // Cleanup: hapus asset yang sudah ter-upload agar tidak orphaned
      if (uploadedStoragePaths.length > 0) {
        try {
          const storage = getStorageProvider();
          await storage.deleteMultiple(uploadedStoragePaths);
        } catch (cleanupErr) {
          console.error("Asset cleanup failed:", cleanupErr);
        }
      }
      return NextResponse.json(
        { success: false, error: "Gagal mengimpor template" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
      message: "Template berhasil diimpor",
    });
  } catch (error) {
    console.error("Import error:", error);
    if (uploadedStoragePaths.length > 0) {
      try {
        const storage = getStorageProvider();
        await storage.deleteMultiple(uploadedStoragePaths);
      } catch (cleanupErr) {
        console.error("Asset cleanup failed:", cleanupErr);
      }
    }
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
