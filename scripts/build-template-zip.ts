/**
 * Build ZIP template yang bisa langsung di-import lewat
 * `POST /api/templates/library/import`.
 *
 * Dipakai untuk membuat reference ZIP dari template bawaan, supaya bentuk
 * `template.json` yang benar punya contoh nyata — bukan sekadar deskripsi.
 *
 * Pakai:
 *   bun scripts/build-template-zip.ts bengkel [keluaran.zip]
 *
 * Bentuk ZIP WAJIB mengikuti apa yang diterima import route:
 *   template.json          (root, wajib, `theme` + `sections` non-kosong)
 *   assets/*               (opsional, ekstensi tercantum di import route)
 *   behaviours/*.json      (opsional, `meta.json` dilewati)
 *   thumbnail.png|jpg|jpeg|webp (opsional, root)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { strToU8, zipSync } from "fflate";
import { BENGKEL_TEMPLATE } from "../src/lib/builder/templates/bengkel";

const TEMPLATES: Record<string, unknown> = { bengkel: BENGKEL_TEMPLATE };

const id = process.argv[2] ?? "bengkel";
const outPath = resolve(process.argv[3] ?? `dist/template-${id}.zip`);
const template = TEMPLATES[id] as {
  name: string;
  description: string;
  category: string;
  theme: Record<string, unknown>;
  headers: unknown[];
  footers: unknown[];
  data: {
    designStyleId?: string;
    paletteOverride?: Record<string, string>;
    customCss?: string;
    sections?: unknown[];
    header?: Record<string, unknown>;
    footer?: Record<string, unknown>;
    seo?: Record<string, unknown>;
    core?: Record<string, unknown>;
  };
};

if (!template) {
  console.error(`Template "${id}" tidak terdaftar di skrip ini.`);
  process.exit(1);
}

const data = template.data;
const seedSections = data.sections ?? [];

/**
 * Animasi deklaratif. `target` = CSS selector yang WAJIB diisi; runtime
 * (`behaviour-runtime.tsx`) menyalakannya sesuai `trigger`.
 *
 * Selector di bawah sengaja memakai struktur DOM nyata `features-3col`:
 *   <div id="keunggulan"><div class="py-12 px-6">
 *     <h2>…</h2><div class="grid …"><div> kartu </div> × 3
 * sehingga `#keunggulan .grid > div:nth-child(N)` menunjuk kartu ke-N.
 */
const animations = [
  {
    id: "reveal-hero",
    name: "Hero Fade Up",
    type: "slide",
    duration: 800,
    delay: 0,
    easing: "cubic-bezier(.16,1,.3,1)",
    trigger: "onLoad",
    target: "#beranda",
  },
  /* STAGGER — 3 kartu features, delay naik 110ms tiap kartu. Efek "bertahap"
     inilah yang tidak mungkin didapat dari section statis. */
  {
    id: "stagger-keunggulan-1",
    name: "Keunggulan 1",
    type: "slide",
    duration: 620,
    delay: 0,
    easing: "cubic-bezier(.16,1,.3,1)",
    trigger: "onScroll",
    target: "#keunggulan .grid > div:nth-child(1)",
  },
  {
    id: "stagger-keunggulan-2",
    name: "Keunggulan 2",
    type: "slide",
    duration: 620,
    delay: 110,
    easing: "cubic-bezier(.16,1,.3,1)",
    trigger: "onScroll",
    target: "#keunggulan .grid > div:nth-child(2)",
  },
  {
    id: "stagger-keunggulan-3",
    name: "Keunggulan 3",
    type: "slide",
    duration: 620,
    delay: 220,
    easing: "cubic-bezier(.16,1,.3,1)",
    trigger: "onScroll",
    target: "#keunggulan .grid > div:nth-child(3)",
  },
  /* Judul section berikutnya ikut muncul setelah kartu selesai. */
  {
    id: "reveal-layanan",
    name: "Reveal Layanan",
    type: "fade",
    duration: 700,
    delay: 0,
    easing: "ease-out",
    trigger: "onScroll",
    target: "#layanan, #harga, #prosedur",
  },
  /* Galeri bernapas sedikit (zoom halus) supaya section foto terasa hidup. */
  {
    id: "zoom-galeri",
    name: "Galeri Zoom Halus",
    type: "custom",
    duration: 900,
    delay: 0,
    easing: "ease-out",
    trigger: "onScroll",
    target: "#galeri",
    keyframes:
      "from{opacity:0;transform:scale(1.03)}to{opacity:1;transform:scale(1)}",
  },
  /* CTA berdenyut saat kursor masuk — umpan balik langsung. */
  {
    id: "pulse-cta",
    name: "CTA Pulse",
    type: "bounce",
    duration: 700,
    delay: 0,
    easing: "ease-in-out",
    trigger: "onHover",
    target: "#beranda a[href='#booking']",
  },
];

/**
 * Behaviour = JS bebas untuk kasus yang tidak tertutup `animations[]`.
 * Disanitasi `sanitizeBehaviourScript()` saat import DAN saat runtime, jadi
 * `eval`, `Function`, `document.write`, `location.href =`, dan `on*=`
 * otomatis diblokir.
 */
const behaviours = [
  {
    id: "scroll-progress",
    name: "Progress Bar Scroll",
    type: "custom",
    trigger: "onLoad",
    target: "body",
    script: [
      "(function () {",
      "  var bar = document.createElement('div');",
      "  bar.setAttribute('data-tpl-progress', '1');",
      "  bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0;z-index:9999;background:#f97316;transition:width .1s linear';",
      "  document.body.appendChild(bar);",
      "  window.addEventListener('scroll', function () {",
      "    var h = document.documentElement.scrollHeight - window.innerHeight;",
      "    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';",
      "  }, { passive: true });",
      "})();",
    ].join("\n"),
  },
];

/**
 * `template.json`:
 * - `theme` WAJIB ada (dicek import route).
 * - `sections` harus array NON-KOSONG (dicek import route).
 * - blok `data` dipakai jalur apply template (header/footer/seo/core/palette),
 *   sedangkan `sections` top-level dipakai preview. Keduanya diisi supaya aman.
 */
const templateJson = {
  version: "2.0",
  name: template.name,
  description: template.description,
  category: template.category,
  theme: template.theme,
  headers: template.headers,
  footers: template.footers,
  sections: seedSections,
  data: {
    designStyleId: data.designStyleId,
    paletteOverride: data.paletteOverride,
    customCss: data.customCss,
    sections: seedSections,
    header: data.header,
    footer: data.footer,
    seo: data.seo,
    core: data.core,
  },
  animations,
  behaviours,
};

const files: Record<string, Uint8Array> = {
  "template.json": strToU8(JSON.stringify(templateJson, null, 2)),
  // Behaviour juga ditulis sebagai file terpisah supaya contoh format
  // `behaviours/*.json` ikut ter-cover (import route membaca keduanya).
  "behaviours/scroll-progress.json": strToU8(JSON.stringify(behaviours[0], null, 2)),
};

/**
 * Aset lokal. Path di dalam `template.json` (`assets/…`) akan diunggah ke
 * storage lalu diganti URL oleh import route — itulah yang dibuktikan di sini.
 * Hasilkan dulu dengan: bun scripts/gen-bengkel-assets.ts
 */
const ASSET_DIR = "dist/bengkel-assets";
const ASSET_FILES = ["logo-bengkel.png", "workshop-bengkel.jpg"];
let assetCount = 0;
for (const name of ASSET_FILES) {
  const src = resolve(ASSET_DIR, name);
  if (!existsSync(src)) {
    console.warn(`    Lewati ${name} — belum ada. Jalankan: bun scripts/gen-bengkel-assets.ts`);
    continue;
  }
  files[`assets/${name}`] = new Uint8Array(readFileSync(src));
  assetCount += 1;
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, zipSync(files, { level: 6 }));

console.log(`OK  ${outPath}`);
console.log(`    sections  : ${seedSections.length}`);
console.log(`    animations: ${animations.length}`);
console.log(`    behaviours: ${behaviours.length}`);
console.log(`    assets    : ${assetCount}`);
