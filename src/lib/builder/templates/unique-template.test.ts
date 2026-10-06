import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { BUILT_IN_CATALOG, getCatalogTemplate } from "./catalog";
import { FONT_CATEGORIES } from "../font-categories";
import { renderVariantHtml, sanitizeTemplateCss } from "../behaviour-script";
import { buildRenderTemplate, buildThemeTokens, extractUsedCssVars } from "../theme-tokens";
import type { ConfigField } from "../template-types";

/**
 * Guard kontrak template unik (§18, UNIQUE_TEMPLATE_SPEC.md).
 *
 * Diterapkan pada template yang sudah dibangun ulang unik (milik sendiri,
 * bukan registry). `food` dikecualikan sampai dibangun ulang (§18.7) —
 * lihat UNIQUE_TEMPLATES di bawah.
 */
const UNIQUE_TEMPLATES = new Set(["laundry-emerald"]);

const uniqueTemplates = BUILT_IN_CATALOG.filter((t) => UNIQUE_TEMPLATES.has(t.id));

/** ID generik telanjang yang dilarang untuk template unik. */
const BARE_GENERIC_IDS = new Set([
  "hero-full", "hero-split", "hero-card", "hero-video-bg", "hero-carousel",
  "features-3col", "features-list", "features-stacked", "features-masonry",
  "product-4col", "product-3col", "product-2col",
  "pricing-3tier", "pricing-2tier", "pricing-single",
  "testimonials-grid", "testimonials-carousel", "testimonials-single",
  "gallery-grid", "gallery-masonry", "gallery-carousel",
  "contact-form", "contact-form-map", "contact-split",
  "about-left", "about-right", "about-centered",
  "faq-accordion", "faq-list", "faq-grid",
  "cta-banner", "cta-card", "cta-split",
  "video-full", "video-centered", "team-grid", "team-list",
  "menu-tabs", "menu-list", "steps-3col", "location-hours",
  "hero-split-arch", "pricing-spa-card", "stats-band-oval", "articles-grid",
]);

const HARDCODED_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /#[0-9a-fA-F]{3,8}\b/, label: "hex color" },
  { re: /\brgba?\s*\(/i, label: "rgb()/rgba()" },
  { re: /\bhsla?\s*\(/i, label: "hsl()/hsla()" },
  // Hanya nilai warna (setelah `:`) — `white-space:nowrap` bukan warna.
  { re: /:\s*white\b/i, label: "warna 'white'" },
  { re: /:\s*black\b/i, label: "warna 'black'" },
  // font-family yang nilainya bukan var(--font-*) = hardcoded.
  { re: /font-family\s*:\s*(?!var\()/i, label: "font-family literal" },
];

const IMPLICIT_KEYS = new Set([
  "showCta", "showNav", "showSocial", "contentWidth",
  "isExternal", "enabled", "key",
]);

function collectFieldKeys(fields: ConfigField[]): Set<string> {
  const keys = new Set<string>();
  for (const f of fields) {
    keys.add(f.key);
    if (Array.isArray(f.itemFields)) {
      for (const k of collectFieldKeys(f.itemFields)) keys.add(k);
    }
  }
  return keys;
}

function collectConfigKeys(value: unknown, depth = 0): string[] {
  if (depth > 4 || value === null || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((v) => collectConfigKeys(v, depth + 1));
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => {
    if (k === "id") return [];
    if (v && typeof v === "object") return [k, ...collectConfigKeys(v, depth + 1)];
    return [k];
  });
}

describe("kontrak template unik (§18)", () => {
  it("template unik terdaftar di katalog", () => {
    expect(uniqueTemplates.length).toBeGreaterThan(0);
    for (const id of UNIQUE_TEMPLATES) {
      expect(getCatalogTemplate(id), `template unik "${id}" tidak ada di katalog`).toBeDefined();
    }
  });

  it("font heading/body/accent terdaftar di FONT_CATEGORIES", () => {
    const known = new Set(FONT_CATEGORIES.flatMap((c) => c.fonts));
    for (const t of uniqueTemplates) {
      const typo = t.theme.typography as { headingFont: string; bodyFont: string; accentFont?: string };
      for (const font of [typo.headingFont, typo.bodyFont, typo.accentFont].filter(Boolean) as string[]) {
        expect(known.has(font), `${t.id}: font "${font}" tak ada di FONT_CATEGORIES`).toBe(true);
      }
      expect(typo.accentFont, `${t.id}: accentFont wajib diisi (§18.4)`).toBeTruthy();
    }
  });

  it("setiap varian section + header + footer punya html + ID namespaced", () => {
    for (const t of uniqueTemplates) {
      expect(t.headers.length).toBeGreaterThanOrEqual(5);
      expect(t.footers.length).toBeGreaterThanOrEqual(5);
      const all: Array<{ label: string; id: string; html?: unknown }> = [
        ...t.headers.map((h) => ({ label: `header/${h.id}`, id: h.id, html: h.html })),
        ...t.footers.map((f) => ({ label: `footer/${f.id}`, id: f.id, html: f.html })),
      ];
      for (const s of t.sections) {
        for (const v of s.variants) {
          all.push({ label: `${s.type}/${v.id}`, id: v.id, html: (v as { html?: unknown }).html });
        }
      }
      for (const v of all) {
        expect(typeof v.html === "string" && (v.html as string).trim().length > 0, `${t.id}/${v.label}: html wajib diisi`).toBe(true);
        expect(v.id.includes(":"), `${t.id}/${v.label}: id wajib namespaced "<template>:<nama>"`).toBe(true);
        expect(v.id.startsWith(`${t.id}:`), `${t.id}/${v.label}: id harus diawali "${t.id}:"`).toBe(true);
        const bare = v.id.split(":").pop() ?? v.id;
        expect(BARE_GENERIC_IDS.has(bare), `${t.id}/${v.label}: memakai id generik "${bare}"`).toBe(false);
      }
    }
  });

  it("nol warna/font hardcoded di html + customCss", () => {
    for (const t of uniqueTemplates) {
      const check = (label: string, html?: unknown) => {
        if (typeof html !== "string" || !html) return;
        for (const p of HARDCODED_PATTERNS) {
          expect(p.re.test(html), `${t.id}/${label}: mengandung ${p.label}`).toBe(false);
        }
      };
      for (const h of t.headers) check(`header/${h.id}`, h.html);
      for (const f of t.footers) check(`footer/${f.id}`, f.html);
      for (const s of t.sections) {
        for (const v of s.variants) check(`${s.type}/${v.id}`, (v as { html?: unknown }).html);
      }
      const css = (t.data as { customCss?: unknown }).customCss;
      if (typeof css === "string" && css) {
        for (const p of HARDCODED_PATTERNS) {
          expect(p.re.test(css), `${t.id}/customCss: mengandung ${p.label}`).toBe(false);
        }
        expect(sanitizeTemplateCss(css), `${t.id}/customCss: mengandung pola terblokir`).toBe(css);
      }
    }
  });

  it("setiap var(--x) yang dipakai tersedia di token kanvas & live", () => {
    // Regresi kasus nyata: kanvas tidak mendefinisikan --color-*/--font-*
    // sehingga variant.html tampil rusak di kanvas tapi sempurna di live.
    // Kedua permukaan kini memakai buildThemeTokens yang sama — test ini
    // mengunci kedua sisinya (dipakai vs disediakan).
    for (const t of uniqueTemplates) {
      const provided = new Set(
        Object.keys(buildThemeTokens(t.theme.palette, t.theme.typography, t.theme.components.borderRadius, {
          // Kontrak kontras template wajib ikut: token turunan
          // (`--color-accent-on-surface` dst) memang bagian dari token tema,
          // dan dihitung dari palet yang sama di kanvas maupun live site.
          contrast: t.contrast,
        })),
      );
      const check = (label: string, src?: unknown) => {
        if (typeof src !== "string" || !src) return;
        for (const v of extractUsedCssVars(src)) {
          expect(provided.has(v), `${t.id}/${label}: memakai ${v} yang tak disediakan token`).toBe(true);
        }
      };
      for (const h of t.headers) check(`header/${h.id}`, h.html);
      for (const f of t.footers) check(`footer/${f.id}`, f.html);
      for (const s of t.sections) {
        for (const v of s.variants) check(`${s.type}/${v.id}`, (v as { html?: unknown }).html);
      }
      check("customCss", (t.data as { customCss?: unknown }).customCss);
    }
  });

  it("tiap key defaultConfig punya form field", () => {
    for (const t of uniqueTemplates) {
      const check = (label: string, fields: ConfigField[], cfg: Record<string, unknown>) => {
        const editable = collectFieldKeys(fields);
        const orphans = [...new Set(collectConfigKeys(cfg))].filter(
          (k) => !editable.has(k) && !IMPLICIT_KEYS.has(k),
        );
        expect(orphans, `${t.id}/${label}: config tanpa form field`).toEqual([]);
      };
      for (const h of t.headers) check(`header/${h.id}`, h.configFields, h.defaultConfig);
      for (const f of t.footers) check(`footer/${f.id}`, f.configFields, f.defaultConfig);
      for (const s of t.sections) {
        for (const v of s.variants) check(`${s.type}/${v.id}`, v.configFields, v.defaultConfig as Record<string, unknown>);
      }
    }
  });

  it("posisi menu header berupa select Kiri/Tengah/Kanan", () => {
    // Regresi: `menuPosition` harus select (bukan text) agar merchant tidak
    // mengetik manual, dan nilainya harus cocok dengan aturan CSS
    // `[data-hdr-navpos]` di globals.css.
    for (const t of uniqueTemplates) {
      for (const h of t.headers) {
        const field = h.configFields.find((f) => f.key === "menuPosition");
        expect(field, `${t.id}/${h.id}: tanpa field menuPosition`).toBeDefined();
        expect(field!.type, `${t.id}/${h.id}: menuPosition bukan select`).toBe("select");
        const values = new Set((field!.options ?? []).map((o) => o.value));
        expect(values, `${t.id}/${h.id}: opsi menuPosition tidak lengkap`).toEqual(
          new Set(["center", "left", "right"]),
        );
        expect(h.defaultConfig.menuPosition, `${t.id}/${h.id}: default menuPosition`).toBe("center");
      }
    }
  });

  it("maxNavDepth seragam di seluruh varian header", () => {
    for (const t of uniqueTemplates) {
      const depths = new Set(t.headers.map((h) => h.maxNavDepth ?? 1));
      expect(depths.size).toBe(1);
    }
  });

  it("html me-render dengan defaultConfig tanpa [object Object]", () => {
    for (const t of uniqueTemplates) {
      const render = (label: string, html: string, cfg: Record<string, unknown>, fields: ConfigField[]) => {
        const htmlKeys = new Set(
          fields.filter((f) => f.type === "html").map((f) => f.key),
        );
        const out = renderVariantHtml(html, cfg, htmlKeys);
        expect(out, `${t.id}/${label}: render kosong`).toBeTruthy();
        expect(out.length, `${t.id}/${label}: render terlalu pendek`).toBeGreaterThan(50);
        expect(out, `${t.id}/${label}: mengandung [object Object]`).not.toContain("[object Object]");
      };
      for (const h of t.headers) {
        render(`header/${h.id}`, h.html as string, h.defaultConfig, h.configFields);
      }
      for (const f of t.footers) {
        render(`footer/${f.id}`, f.html as string, f.defaultConfig, f.configFields);
      }
      for (const s of t.sections) {
        for (const v of s.variants) {
          const vv = v as { html?: string; configFields: ConfigField[]; defaultConfig: Record<string, unknown> };
          render(`${s.type}/${v.id}`, vv.html as string, vv.defaultConfig, vv.configFields);
        }
      }
    }
  });

  const allFooters = () => uniqueTemplates.flatMap((t) => t.footers.map((f) => ({ t, f })));

  it("buildRenderTemplate(): live site & canvas WAJIB dapat field yang sama", () => {
    // Regresi yang sangat membingungkan: kanvas tampil benar, live site
    // tidak. Akarnya `app/page.tsx` menyalin field template satu per satu
    // (`id, name, description, category, theme, headers, footers, sections`)
    // sehingga `contrast` — dan semua field yang belum ada saat ditulis —
    // hilang di live site saja. Token kontras tak pernah dibuat, teks jatuh
    // ke warna warisan.
    //
    // Guard ini mengunci INVARIAN, bukan implementasi: field apa pun yang
    // ada di template katalog wajib ikut ke template render.
    for (const t of uniqueTemplates) {
      const live = buildRenderTemplate(t);
      const missing = Object.keys(t).filter((k) => !(k in live));
      expect(missing, `${t.id}: field hilang di template render: ${missing.join(', ')}`).toEqual([]);
      expect(live.contrast, `${t.id}: kontrak kontras hilang di template render`).toBeDefined();
      // Dan yang menentukan: token hasil render harus identik.
      const palette = t.theme.palette;
      const canvasTokens = buildThemeTokens(palette, t.theme.typography, t.theme.components.borderRadius, {
        contrast: t.contrast,
      });
      const liveTokens = buildThemeTokens(palette, live.theme.typography, live.theme.components.borderRadius, {
        contrast: live.contrast,
      });
      expect(liveTokens, `${t.id}: token kanvas ≠ token live`).toEqual(canvasTokens);
    }
  });

  it("buildRenderTemplate(): typography bisa dioverride tanpa kehilangan field", () => {
    for (const t of uniqueTemplates) {
      const typo = { ...t.theme.typography, headingFont: "Anton" };
      const live = buildRenderTemplate(t, typo);
      expect(live.theme.typography.headingFont).toBe("Anton");
      expect(live.contrast, 'override typography boleh merusak field lain').toBeDefined();
      expect(live.sections.length).toBe(t.sections.length);
    }
  });

  it("live site wajib membangun template lewat SPREAD, bukan menyalin field", () => {
    // Sumber bug "kanvas benar, live site salah": `app/page.tsx` dulu
    // menulis `template: { id, name, description, category, theme, headers,
    // footers, sections }`. Daftar seperti ini TIDAK PERNAH error ketika
    // field baru ditambahkan ke `Template` — fieldnya cuma hilang diam-diam
    // di live site. `contrast` (§19) hilang begitu, token `--color-*-on-*`
    // tak pernah dibuat di live site, dan `var(--color-accent-on-primary)`
    // jatuh ke warna warisan. Preview lolos karena ia memakai objek utuh.
    const page = readFileSync(join(process.cwd(), "app", "page.tsx"), "utf8");
    const src = page
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

    // `[^}]*` TIDAK bisa dipakai — `theme: {...}` bersarang memutus pencocokan
    // sebelum sampai `headers`. Self-test-nya wajib memakai struktur bersarang
    // yang meniru kode asli; contoh datar akan membuat guard vacuous.
    const BANNED = /template:\s*\{[\s\S]{0,800}?\bheaders:\s*\w+\.headers\b/;
    // Self-test: regex wajib match sumber sintetis bersarang, agar guard tak
    // pernah berhijau padahal polanya sudah tak cocok apa pun.
    expect(
      BANNED.test("template: { id: x.id, theme: { ...t.theme }, headers: x.headers }"),
    ).toBe(true);
    expect(BANNED.test("template: buildRenderTemplate(cat)")).toBe(false);

    expect(src, "app/page.tsx menyalin field template satu per satu").not.toMatch(BANNED);
    expect(src, "app/page.tsx tidak memakai buildRenderTemplate").toContain("buildRenderTemplate(");
  });

  it("tiap toggle footer benar-benar mengubah render (bukan field UI mati)", () => {
    // Regresi nyata: `FOOTER_BASE` mendeklarasikan `showNav`/`showSocial`
    // untuk kelima varian, tapi HTML-nya tidak pernah memakai `{{#if}}`-nya.
    // `inferFields` tetap membuat sakelar dari key itu, jadi user drag dan
    // tidak terjadi apa pun. Field UI yang berbohong lebih buruk dari
    // field yang tidak ada.
    for (const { t, f } of allFooters()) {
      const cfg = f.defaultConfig as Record<string, unknown>;
      const html = f.html as string;
      const hasToggle = typeof cfg.showNav === "boolean" || typeof cfg.showSocial === "boolean";
      if (typeof cfg.showNav === "boolean") {
        expect(html.includes("{{#if showNav}}"), `${t.id}/${f.id}: showNav tanpa {{#if}}`).toBe(true);
      }
      if (typeof cfg.showSocial === "boolean") {
        expect(html.includes("{{#if showSocial}}"), `${t.id}/${f.id}: showSocial tanpa {{#if}}`).toBe(true);
        // Sakelar tanpa data = tidak ada yang bisa dimunculkan.
        expect(Array.isArray(cfg.socials) && cfg.socials.length > 0,
          `${t.id}/${f.id}: showSocial tanpa data socials`).toBe(true);
      }
      // Varian tanpa nav/sosmed sama sekali tak boleh merendernya.
      if (!hasToggle) {
        expect(html, `${t.id}/${f.id}: nav tak dideklarasikan tapi dirender`).not.toContain("{{navItems}}");
      }

      // Bukti nyata: matikan toggle, cek isinya benar-benar hilang.
      const countLinks = (s: string) => (s.match(/<a /g) ?? []).length;
      if (typeof cfg.showNav === "boolean") {
        const off = renderVariantHtml(html, { ...cfg, showNav: false });
        const on = renderVariantHtml(html, cfg);
        expect(countLinks(off), `${t.id}/${f.id}: nav tetap muncul saat showNav=false`)
          .toBeLessThan(countLinks(on));
      }
      if (typeof cfg.showSocial === "boolean") {
        const off = renderVariantHtml(html, { ...cfg, showSocial: false });
        const on = renderVariantHtml(html, cfg);
        expect(off.length, `${t.id}/${f.id}: sosmed tetap muncul saat showSocial=false`)
          .toBeLessThan(on.length);
      }
    }
  });

  it("varian tanpa toggle benar-benar bebas dari konten terkait", () => {
    let silent = 0;
    for (const { t, f } of allFooters()) {
      const c = f.defaultConfig as Record<string, unknown>;
      if (typeof c.showNav === "boolean" || typeof c.showSocial === "boolean") continue;
      silent++;
      expect((f.html as string).includes("{{navItems}}"),
        `${t.id}/${f.id}: nav dirender tanpa toggle`).toBe(false);
      expect(c.siteTitleInitial,
        `${t.id}/${f.id}: siteTitleInitial hanya dipakai brandMark (header)`).toBeUndefined();
    }
    expect(silent, "tidak ada varian tanpa toggle — guard ini jadi tak berarti").toBeGreaterThan(0);
  });

  it("setiap varian footer TIDAK menampilkan {year} mentah ke pengguna", () => {
    // Regresi nyata: `{year}` hanya diganti di branch renderer GENERIK
    // (`site-footer-shared.tsx`), sedangkan varian unik keluar lewat
    // early-return `variant.html` — sehingga live site menampilkan
    // "© {year} Emerald Laundry" apa adanya. Guard lama hanya mengecek
    // seed `data.footer.text` berisi `{year}`, bukan hasil render-nya.
    const year = String(new Date().getFullYear());
    for (const t of uniqueTemplates) {
      for (const f of t.footers) {
        const out = renderVariantHtml(f.html as string, f.defaultConfig);
        expect(out, `${t.id}/footer/${f.id}: {year} bocor ke tampilan`).not.toContain("{year}");
        // Kalau variannya memang punya copyright, pastikan tahun terpakai.
        if (typeof f.defaultConfig.text === "string" && String(f.defaultConfig.text).includes("{year}")) {
          expect(out, `${t.id}/footer/${f.id}: tahun tidak ter-render`).toContain(year);
        }
      }
    }
  });

  it("file template tidak mengimpor sistem generik", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    for (const t of uniqueTemplates) {
      const candidates = [`${t.id.replace(/:/g, "-")}.ts`, `${t.id}.ts`];
      const found = candidates.map((c) => join(here, c)).find((p) => {
        try {
          readFileSync(p, "utf8");
          return true;
        } catch {
          return false;
        }
      });
      // laundry-emerald → laundry-emerald.ts
      const raw = readFileSync(found ?? join(here, "laundry-emerald.ts"), "utf8");
      // Komentar diabaikan — yang dicek adalah kode impor aktual.
      const src = raw
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      expect(src, `${t.id}: mengimpor compose generik`).not.toContain("./compose");
      expect(src, `${t.id}: mengimpor registry generik`).not.toContain("sections/registry");
      expect(src, `${t.id}: memakai registrySections()`).not.toContain("registrySections(");
    }
  });
});
