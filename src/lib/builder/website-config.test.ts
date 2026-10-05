import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildActiveCustomConfig,
  buildDefaultCustomConfig,
  buildStoredCustomConfig,
  hasStoredCustomConfig,
  resolveNextIsPublished,
} from "./website-config";

function repoFile(...parts: string[]): string {
  return readFileSync(join(process.cwd(), ...parts), "utf-8");
}

/** Config yang tersimpan hasil "Simpan sebagai Template" + terapkan ulang. */
function savedConfig() {
  return {
    palette_override: { primary: "#f97316", background: "#0b1220" },
    sections: [
      { id: "s1", type: "hero", variant: "hero-split", config: { headline: "Halo" } },
    ],
    header: { variant: "hdr-klasik", siteTitle: "Bengkel" },
    footer: { style: "ftr-inline" },
    theme: { typography: { headingFont: "Poppins" } },
    core: { site_title: "Bengkel" },
    seo: { title: "Bengkel", description: "Servis motor" },
    animations: [{ id: "a1", type: "slide" }],
    behaviours: [{ id: "b1", script: "/* noop */" }],
    customCss: '[data-tpl-type="hero"] { clip-path: ellipse(78% 88%); }',
    assets: [{ id: "img1", url: "https://cdn.example/a.jpg" }],
    catalog_template_id: "food",
    is_published: true,
    meta_title: "Bengkel",
    meta_description: "Servis motor",
    og_image_url: "https://cdn.example/og.jpg",
  };
}

describe("buildStoredCustomConfig — whitelist simpan (PUT)", () => {
  it("menyimpan palette_override, creative layer, dan assets apa adanya", () => {
    const cfg = buildStoredCustomConfig(savedConfig(), "food");
    expect(cfg.palette_override).toEqual({ primary: "#f97316", background: "#0b1220" });
    expect(Array.isArray(cfg.animations)).toBe(true);
    expect(Array.isArray(cfg.behaviours)).toBe(true);
    expect(String(cfg.customCss)).toContain("clip-path");
    expect(Array.isArray(cfg.assets)).toBe(true);
    expect(cfg.catalog_template_id).toBe("food");
  });

  it("tidak ikut menulis is_published (dipisah ke resolveNextIsPublished)", () => {
    // Kalau ikut, `resolveNextIsPublished` tak bisa membedakan "payload tidak
    // menyebut status tayang" dari "payload benar-benar bilang draft".
    const cfg = buildStoredCustomConfig(savedConfig(), "food");
    expect(Object.hasOwn(cfg, "is_published")).toBe(false);
  });

  it("default aman untuk config kosong", () => {
    const cfg = buildStoredCustomConfig(undefined, "food");
    expect(cfg.palette_override).toEqual({});
    expect(cfg.sections).toEqual([]);
    expect(cfg.animations).toEqual([]);
    expect(cfg.assets).toEqual([]);
    expect(cfg.customCss).toBe("");
  });

  it("menormalisasi sections: variant terisi dan anchorId yang ada dipertahankan", () => {
    const cfg = buildStoredCustomConfig(
      { sections: [{ id: "s1", type: "hero", anchorId: "beranda" }, { id: "s2", type: "hero" }] },
      "food",
    ) as { sections: Array<Record<string, unknown>> };
    // Type dikenal -> variant diisi default, tidak dibuang.
    expect(cfg.sections[0].variant).toBeTruthy();
    expect(cfg.sections[1].variant).toBeTruthy();
    // Anchor yang sudah ada tidak ditimpa ulang (nav tetap hidup).
    expect(cfg.sections[0].anchorId).toBe("beranda");
    // Section tanpa anchor tidak dikarang diam-diam: `defaultAnchorId` di
    // `migration.ts` sengaja `undefined`, jadi field-nya memang absen.
    expect(cfg.sections[1].anchorId).toBeUndefined();
  });
});

describe("REGRESI: config tersimpan wajib kembali lewat GET", () => {
  /**
   * Bug yang diperbaiki: whitelist GET lebih sempit dari whitelist PUT, jadi
   * `palette_override` (warna tema), `customCss`, `animations`, `behaviours`,
   * dan `assets` tidak pernah dikirim ke builder. Akibatnya reload selalu
   * mengembalikan kanvas ke warna bawaan template katalog, dan template hasil
   * "Simpan sebagai Template" tampak "tidak berubah" saat diterapkan lagi.
   *
   * Guard ini mengunci kedua arah tetap simetris.
   */
  it("buildActiveCustomConfig mengembalikan SEMUA field yang disimpan", () => {
    const active = buildActiveCustomConfig(savedConfig());
    // Wajib: tanpa ini tema/warna hilang.
    expect(active.palette_override).toEqual({ primary: "#f97316", background: "#0b1220" });
    expect(active.customCss).toContain("clip-path");
    expect(active.animations).toHaveLength(1);
    expect(active.behaviours).toHaveLength(1);
    expect(active.assets).toHaveLength(1);
    expect(active.catalog_template_id).toBe("food");
    // Sisanya tetap utuh.
    expect(active.sections).toHaveLength(1);
    expect(active.header).toEqual({ variant: "hdr-klasik", siteTitle: "Bengkel" });
    expect(active.seo.title).toBe("Bengkel");
  });

  it("setiap field hasil buildStoredCustomConfig punya pasangan di buildActiveCustomConfig", () => {
    // Uji simetri whitelist secara generik: kalau ada field baru yang ditulis
    // PUT tapi tidak dibaca GET, test ini gagal — bukan diam-diam sampai user
    // lapor "template tidak berubah".
    const stored = buildStoredCustomConfig(savedConfig(), "food");
    const active = buildActiveCustomConfig(savedConfig()) as unknown as Record<string, unknown>;
    for (const key of Object.keys(stored)) {
      expect(Object.hasOwn(active, key), `GET harus mengembalikan "${key}"`).toBe(true);
    }
  });

  it("nilai yang disimpan -> nilai yang kembali (round-trip)", () => {
    const stored = buildStoredCustomConfig(savedConfig(), "food");
    const active = buildActiveCustomConfig(stored);
    expect(active.palette_override).toEqual(stored.palette_override);
    expect(active.customCss).toBe(stored.customCss);
    expect(active.sections).toEqual(stored.sections);
    expect(active.catalog_template_id).toBe(stored.catalog_template_id);
  });

  it("config kosong/rusak tidak melempar, hanya dinormalisasi", () => {
    for (const bad of [null, undefined, "bukan objek", 42, [1, 2, 3]]) {
      const active = buildActiveCustomConfig(bad);
      expect(active.palette_override).toEqual({});
      expect(active.sections).toEqual([]);
      expect(active.is_published).toBe(true);
    }
  });

  it("palette_override di luar palet yang dikenal dibuang (aman untuk render)", () => {
    const active = buildActiveCustomConfig({
      ...savedConfig(),
      palette_override: { primary: "#123456", __evil__: "x", ukuran: 99 },
    });
    expect(active.palette_override).toEqual({ primary: "#123456" });
  });
});

describe("buildDefaultCustomConfig — website tanpa config", () => {
  it("konsisten dengan buildActiveCustomConfig supaya frontend tak perlu cek dua bentuk", () => {
    const keys = Object.keys(buildDefaultCustomConfig()).sort();
    expect(Object.keys(buildActiveCustomConfig(null)).sort()).toEqual(keys);
  });

  it("website baru tetap tayang (live site tidak boleh 404)", () => {
    expect(buildDefaultCustomConfig().is_published).toBe(true);
  });

  it("config default tidak lagi membawa design style", () => {
    // Migrasi 046: `design_style_id` dihapus, warna datang dari
    // `palette_override` + `theme.palette` template.
    expect(buildDefaultCustomConfig()).not.toHaveProperty("design_style_id");
    expect(buildDefaultCustomConfig().palette_override).toEqual({});
  });
});

describe("hasStoredCustomConfig", () => {
  it("false tanpa baris atau tanpa config", () => {
    expect(hasStoredCustomConfig(null, { design_style_id: "minimalist" })).toBe(false);
    expect(hasStoredCustomConfig({ id: 1 }, {})).toBe(false);
    expect(hasStoredCustomConfig({ id: 1 }, null)).toBe(false);
  });

  it("true untuk config legacy yang masih membawa design_style_id", () => {
    expect(hasStoredCustomConfig({ id: 1 }, { design_style_id: "minimalist" })).toBe(true);
  });

  /**
   * Regresi data-loss (migrasi 046): `design_style_id` dihapus dari JSON
   * baris yang punya `catalog_template_id`. Kalau sentinel ini tidak
   * lulus ke `catalog_template_id`, semua website yang sudah dikustomisasi
   * akan terbaca "default" lalu kanvasnya ter-reset diam-diam.
   */
  it("true setelah design_style_id dihapus, selama catalog_template_id ada", () => {
    expect(hasStoredCustomConfig({ id: 1 }, { catalog_template_id: "food" })).toBe(true);
    expect(hasStoredCustomConfig({ id: 1 }, { catalog_template_id: "food", sections: [] })).toBe(true);
  });

  it("true untuk config hasil editing yang punya sections", () => {
    expect(hasStoredCustomConfig({ id: 1 }, { sections: [{ id: "s1" }] })).toBe(true);
  });

  it("false untuk config benar-benar kosong (website baru)", () => {
    expect(hasStoredCustomConfig({ id: 1 }, { catalog_template_id: null, sections: [] })).toBe(false);
  });
});

describe("REGRESI: terapkan template tidak boleh meng-unpublish website", () => {
  /**
   * Bug yang diperbaiki: `is_published: custom_config.is_published === true`
   * membuat payload TANPA field itu tersimpan sebagai `false`. Padahal
   * `applyTemplateToWebsite` (katalog) & `applySavedTemplate` (library)
   * sengaja tidak mengirimnya — status tayang milik website. Hasilnya
   * menerapkan template diam-diam mengembalikan website ke Draft dan live
   * site (`buildSite`) ikut 404.
   */
  it("payload tanpa is_published mempertahankan status tersimpan", () => {
    expect(resolveNextIsPublished(undefined, { is_published: true })).toBe(true);
    expect(resolveNextIsPublished(undefined, { is_published: false })).toBe(false);
  });

  it("payload yang mengirim boolean tetap dihormati (Simpan / Tayangkan / SEO)", () => {
    expect(resolveNextIsPublished(true, { is_published: false })).toBe(true);
    expect(resolveNextIsPublished(false, { is_published: true })).toBe(false);
  });

  it("tanpa config tersimpan, default tetap Draft", () => {
    expect(resolveNextIsPublished(undefined, null)).toBe(false);
    expect(resolveNextIsPublished(undefined, {})).toBe(false);
  });

  it("nilai non-boolean diperlakukan sebagai 'tidak disebut'", () => {
    expect(resolveNextIsPublished("true", { is_published: true })).toBe(true);
    expect(resolveNextIsPublished(null, { is_published: true })).toBe(true);
  });

  it("route mencari config aktif SEBELUM slug tujuan (status ikut saat ganti template)", () => {
    // Kalau hanya slug tujuan yang dicek, apply template dengan slug berbeda
    // akan mendapat `null` -> website jatuh ke Draft padahal sebelumnya tayang.
    const src = repoFile("app", "api", "websites", "[websiteId]", "website", "route.ts");
    expect(src).toContain("readExistingActiveConfig(supabase, websiteId, [\n        siteSlug,\n        slug,\n      ])");
  });

  it("branch legacy tidak mengambil baris library saat partial update", () => {
    // Tanpa filter, `template_id` website bisa tertimpa slug `saved-<uuid>`
    // yang tidak dikenal katalog -> PUT berikutnya 404 "Template tidak ditemukan".
    const src = repoFile("app", "api", "websites", "[websiteId]", "website", "route.ts");
    const block = src.slice(
      src.indexOf("If partial update"),
      src.indexOf("websiteConfigSchema.safeParse"),
    );
    expect(block).toContain('.eq("is_library", false)');
  });
});

describe("REGRESI: route server wajib memakai helper bersama", () => {
  const route = () => repoFile("app", "api", "websites", "[websiteId]", "website", "route.ts");

  it("tidak lagi membangun whitelist config sendiri di route", () => {
    // Dua whitelist = bug yang pasti terlewat. Aturan config sekarang hanya
    // boleh hidup di `website-config.ts`.
    const src = route();
    expect(src).not.toContain("is_published: custom_config.is_published === true");
    expect(src).not.toContain("custom_config.is_published !== false");
  });

  it("GET memfilter baris library agar tidak jadi template aktif", () => {
    // Tanpa filter ini, baris `is_library` (slug `saved-<uuid>`) ikut masuk
    // kandidat `stored`; karena urut updated_at DESC, baris library terbaru
    // bisa menimpa config aktif website.
    const src = route();
    expect(src).toContain("buildActiveCustomConfig(storedConfig)");
    expect(src).toContain('.eq("is_library", false)');
  });

  it("kedua branch PUT memakai whitelist yang sama", () => {
    const calls = route().match(/buildStoredCustomConfig\(/g) ?? [];
    expect(calls.length).toBe(2);
  });
});