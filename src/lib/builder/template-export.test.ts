import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import {
  buildTemplateExportZip,
  slugifyTemplateName,
  type ExportTemplateRow,
} from "@/lib/builder/template-export";

const OLD_LOGO_URL =
  "https://xyz.supabase.co/storage/v1/object/sign/product-images/abc/logo.png?token=aaa.bbb.ccc";
const OLD_HERO_URL =
  "https://xyz.supabase.co/storage/v1/object/sign/product-images/abc/hero.jpg?token=ddd.eee.fff";
const OLD_THUMB_URL =
  "https://xyz.supabase.co/storage/v1/object/sign/product-images/abc/thumb.png?token=ggg.hhh.iii";

function makeRow(): ExportTemplateRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Warung Kopi Senja",
    description: "Template kopi",
    template_data: {
      theme: {
        palette: { primary: "#111111" },
        components: { logoUrl: OLD_LOGO_URL, heroImage: OLD_HERO_URL },
      },
      headers: [],
      footers: [],
      sections: [
        {
          id: "hero",
          type: "hero",
          content: { image: OLD_HERO_URL, title: "Halo" },
        },
      ],
      animations: [{ id: "fade", type: "fade" }],
      behaviours: [{ id: "b1", trigger: "scroll", script: "console.log(1)" }],
      customTopLevel: { nested: [OLD_LOGO_URL] },
    },
    assets: [
      { id: "a1", name: "logo.png", path: "assets/logo.png", url: OLD_LOGO_URL, type: "image", size: 10 },
      { id: "a2", name: "hero.jpg", path: "assets/hero.jpg", url: OLD_HERO_URL, type: "image", size: 20 },
    ],
    thumbnail_url: OLD_THUMB_URL,
  };
}

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const JPG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 4, 5, 6]);

function okFetcher(map: Record<string, Uint8Array>) {
  return async (url: string) => map[url] ?? null;
}

describe("buildTemplateExportZip (round-trip import-compatible)", () => {
  it("menghasilkan ZIP dengan struktur import: template.json + thumbnail root + assets/", async () => {
    const built = await buildTemplateExportZip(makeRow(), {
      fetchBytes: okFetcher({
        [OLD_LOGO_URL]: PNG_BYTES,
        [OLD_HERO_URL]: JPG_BYTES,
        [OLD_THUMB_URL]: PNG_BYTES,
      }),
    });

    expect(built.fileName).toBe("template-warung-kopi-senja.zip");
    expect(built.warnings).toEqual([]);
    expect(built.thumbnailFile).toBe("thumbnail.png");
    expect(built.assetFiles).toContain("assets/logo.png");
    expect(built.assetFiles).toContain("assets/hero.jpg");

    const zip = unzipSync(built.bytes) as Record<string, Uint8Array>;
    const names = Object.keys(zip);
    // template.json di root (wajib import)
    expect(names).toContain("template.json");
    // thumbnail di root (bukan di assets/)
    expect(names).toContain("thumbnail.png");
    // file aset aktual
    expect(names).toContain("assets/logo.png");
    expect(names).toContain("assets/hero.jpg");
    // meta referensi (di-skip import by design)
    expect(names).toContain("assets/meta.json");
    // TIDAK ada behaviours/*.json individual (anti-duplikat saat re-import)
    expect(names.filter((n) => n.startsWith("behaviours/"))).toEqual([]);
    // TIDAK ada animations/ (import tidak punya pembacanya)
    expect(names.filter((n) => n.startsWith("animations/"))).toEqual([]);

    const tpl = JSON.parse(strFromU8(zip["template.json"])) as Record<string, any>;
    const serialized = JSON.stringify(tpl);
    // absolute URL lama hilang, terganti path relatif
    expect(serialized).not.toContain(OLD_LOGO_URL);
    expect(serialized).not.toContain(OLD_HERO_URL);
    expect(serialized).toContain("assets/logo.png");
    expect(serialized).toContain("assets/hero.jpg");
    // behaviours + animations tetap inline (import membacanya dari sini)
    expect(tpl.behaviours).toHaveLength(1);
    expect(tpl.animations).toHaveLength(1);
    // key lain tidak hilang (tidak lossy)
    expect(tpl.customTopLevel).toEqual({ nested: ["assets/logo.png"] });
    expect(tpl.theme.palette.primary).toBe("#111111");
  });

  it("tetap menghasilkan ZIP valid saat semua unduhan gagal (best-effort + warnings)", async () => {
    const built = await buildTemplateExportZip(makeRow(), {
      fetchBytes: async () => null,
    });

    expect(built.thumbnailFile).toBeNull();
    expect(built.assetFiles).toEqual([]);
    expect(built.warnings.length).toBeGreaterThan(0);

    const zip = unzipSync(built.bytes) as Record<string, Uint8Array>;
    expect(Object.keys(zip)).toContain("template.json");
    expect(Object.keys(zip)).toContain("assets/meta.json");
    // template.json tetap memuat URL lama (jujur: tidak bisa di-remap tanpa bytes,
    // tapi struktur tetap valid dan tidak corrupt)
    const tpl = JSON.parse(strFromU8(zip["template.json"]));
    expect(tpl.theme.components.logoUrl).toBe(OLD_LOGO_URL);
  });

  it("menormalisasi wrapper { template: {...} } seperti import", async () => {
    const built = await buildTemplateExportZip(
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "X",
        template_data: {
          description: "desc luar",
          template: { theme: { palette: {} }, sections: [{ id: "s1" }] },
        },
        assets: [],
      },
      { fetchBytes: async () => null },
    );
    const zip = unzipSync(built.bytes) as Record<string, Uint8Array>;
    const tpl = JSON.parse(strFromU8(zip["template.json"])) as Record<string, any>;
    expect(tpl.theme).toBeDefined();
    expect(tpl.sections).toHaveLength(1);
    expect(tpl.template).toBeUndefined();
  });

  it("melempar bila template_data bukan objek", async () => {
    await expect(
      buildTemplateExportZip(
        { id: "x", name: "X", template_data: "bukan-objek", assets: [] },
        { fetchBytes: async () => null },
      ),
    ).rejects.toThrow();
  });

  it("slugify menangani nama aneh", () => {
    expect(slugifyTemplateName("Warung Kopi Senja!")).toBe("warung-kopi-senja");
    expect(slugifyTemplateName("")).toBe("template");
    expect(slugifyTemplateName("  ---  ")).toBe("template");
  });
});
