import { describe, expect, it } from "vitest";
import { buildWebsiteCustomConfig, resolveChromeConfig } from "./migration";
import { getTemplate } from "./template-store";
import type { TemplateSectionInstance } from "./template-types";
import type { Section } from "./types";

/** Section (format builder) siap dipakai sebagai `base.sections`. */
function builderSection(id: string, type = "hero"): Section {
  return {
    id,
    type: type as Section["type"],
    variant: "hero-full",
    config: { headline: `Judul ${id}` },
    style: { padding: { top: 48, right: 24, bottom: 48, left: 24 }, background: "transparent" },
    responsive: {},
  };
}

/** Instance (format template-store) — sumber edit kanvas. */
function instance(id: string, type = "hero"): TemplateSectionInstance {
  return {
    id,
    type,
    variantId: "hero-full",
    config: { headline: `Judul ${id}` },
    style: { padding: { top: 48, right: 24, bottom: 48, left: 24 }, background: "transparent" },
    responsive: {},
  };
}

const template = getTemplate("warung-makan")!;

/**
 * Skenario inti page-builder (guard anti-kebocoran lintas halaman):
 * menyimpan halaman NON-homepage harus mempertahankan sections global
 * (snapshot awal), sedangkan homepage menulis ulang sections global.
 * Logika pemilihan snapshot ada di halaman builder, tetapi hasil akhirnya
 * HARUS tercermin di config yang dibangun oleh buildWebsiteCustomConfig.
 */
describe("buildWebsiteCustomConfig — kontrak page-builder", () => {
  it("menyimpan sections dari instance kanvas (bukan base)", () => {
    const cfg = buildWebsiteCustomConfig({
      base: { sections: [builderSection("global-1")] },
      sections: [instance("canvas-1"), instance("canvas-2", "about")],
      header: { variant: "header-klasik" },
      footer: { variant: "footer-sederhana" },
      designStyleId: "minimalist",
      paletteOverride: { primary: "#EA580C" },
      seo: { title: "Toko A", description: "Deskripsi" },
      core: {},
    });

    const ids = (cfg.sections as Array<{ id: string }>).map((s) => s.id);
    expect(ids).toEqual(["canvas-1", "canvas-2"]);
    expect(ids).not.toContain("global-1");
  });

  it("halaman non-homepage: sections global (base) TIDAK berubah saat hanya chrome yang disimpan", () => {
    // Simulasi: pemanggil mengirim snapshot awal untuk `sections` (bukan live
    // kanvas) ketika halaman bukan homepage → sections global terjaga.
    const initialGlobal = [builderSection("home-hero"), builderSection("home-menu")];
    const cfg = buildWebsiteCustomConfig({
      base: { sections: initialGlobal },
      sections: initialGlobal.map((s) => instance(s.id)),
      header: { variant: "header-klasik", navItems: [{ id: "n1", label: "Baru", url: "/p/baru" }] },
      footer: { variant: "footer-sederhana" },
      designStyleId: "warm",
      paletteOverride: {},
      seo: { title: "", description: "" },
      core: {},
    });

    const ids = (cfg.sections as Array<{ id: string }>).map((s) => s.id);
    expect(ids).toEqual(["home-hero", "home-menu"]);
    // Chrome global tetap ikut tersimpan
    expect((cfg.header as { navItems: unknown[] }).navItems).toHaveLength(1);
  });

  it("homepage: sections live (kanvas) menggantikan sections global", () => {
    const initialGlobal = [builderSection("home-hero")];
    const live = [builderSection("home-hero"), builderSection("home-promo", "cta")];
    const cfg = buildWebsiteCustomConfig({
      base: { sections: initialGlobal },
      sections: live.map((s) => instance(s.id, s.type)),
      header: {},
      footer: {},
      designStyleId: "minimalist",
      paletteOverride: {},
      seo: { title: "Home", description: "" },
      core: {},
    });

    const ids = (cfg.sections as Array<{ id: string }>).map((s) => s.id);
    expect(ids).toEqual(["home-hero", "home-promo"]);
  });

  it("mempertahankan key base lain (design_style_id, theme, core) & menimpa dengan nilai baru", () => {
    const cfg = buildWebsiteCustomConfig({
      base: {
        catalog_template_id: "warung-makan",
        theme: { typography: { headingFont: "Lama", bodyFont: "Lama" } },
        core: { itemsPerRow: 2 },
      },
      sections: [],
      header: {},
      footer: {},
      designStyleId: "warm",
      paletteOverride: { primary: "#111111" },
      typographyOverride: { headingFont: "Baru" },
      seo: { title: "T", description: "D" },
      core: { itemsPerRow: 3 },
    });

    expect(cfg.catalog_template_id).toBe("warung-makan");
    expect(cfg.design_style_id).toBe("warm");
    expect((cfg.theme as { typography: Record<string, string> }).typography).toEqual({
      headingFont: "Baru",
      bodyFont: "Lama",
    });
    expect((cfg.core as { itemsPerRow: number }).itemsPerRow).toBe(3);
  });

  it("tidak menyertakan animations/behaviours/assets bila undefined (base tetap dipakai)", () => {
    const cfg = buildWebsiteCustomConfig({
      base: { animations: [{ id: "a1" }] },
      sections: [],
      header: {},
      footer: {},
      designStyleId: "minimalist",
      paletteOverride: {},
      seo: { title: "", description: "" },
      core: {},
    });
    expect(cfg.animations).toEqual([{ id: "a1" }]);
  });

  it("template store tersedia untuk id katalog (sanity)", () => {
    expect(template.id).toBe("warung-makan");
    expect(template.sections.length).toBeGreaterThan(0);
  });
});

/**
 * Submenu (dropdown 1 level) harus selamat di jalur save → load.
 *
 * Submenu ditambahkan lewat sidebar builder (`configFields.navItems.children`)
 * lalu disimpan ke `custom_config.header.navItems`. Bila ada lapisan yang
 * menyalin nav lalu membuang `children`, menu bertingkat hilang diam-diam di
 * live site — sulit dilacak karena tidak ada error.
 */
describe("submenu bertahan di jalur simpan header", () => {
  it("buildWebsiteCustomConfig meneruskan children apa adanya", () => {
    const navItems = [
      { id: "n1", label: "Katalog", url: "#katalog", enabled: true },
      {
        id: "n2",
        label: "Layanan",
        url: "#layanan",
        enabled: true,
        children: [
          { id: "c1", label: "Potong", url: "#potong", enabled: true },
          { id: "c2", label: "Pijat", url: "#pijat", enabled: false },
        ],
      },
    ];
    const cfg = buildWebsiteCustomConfig({
      base: {},
      sections: [],
      header: { variant: "header-klasik", navItems },
      footer: {},
      designStyleId: "minimalist",
      paletteOverride: {},
      seo: { title: "", description: "" },
      core: {},
    });

    const saved = (cfg.header as { navItems: typeof navItems }).navItems;
    expect(saved).toHaveLength(2);
    expect(saved[1].children).toHaveLength(2);
    expect(saved[1].children?.[0]).toMatchObject({ label: "Potong", url: "#potong" });
  });

  it("resolveChromeConfig tidak membuang children saat varian ganti", () => {
    const tpl = getTemplate("warung-makan")!;
    const resolved = resolveChromeConfig(
      tpl,
      {
        variant: "header-melayang",
        navItems: [
          {
            id: "n2",
            label: "Layanan",
            url: "#layanan",
            enabled: true,
            children: [{ id: "c1", label: "Potong", url: "#potong" }],
          },
        ],
      },
      "header",
    );
    const items = resolved.config.navItems as Array<{ children?: unknown[] }>;
    expect(items[0].children).toHaveLength(1);
  });

  it("navItems tanpa children tetap aman (backward compat data lama)", () => {
    const tpl = getTemplate("warung-makan")!;
    const resolved = resolveChromeConfig(tpl, { variant: "header-klasik" }, "header");
    expect(Array.isArray(resolved.config.navItems)).toBe(true);
  });
});
