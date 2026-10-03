/**
 * Sanitasi script behaviour template.
 *
 * MODUL SAMA dipakai di dua tempat (defense in depth):
 * - server: `POST /api/templates/library/import` — saat ZIP di-upload
 * - client: `behaviour-runtime.tsx` — tepat sebelum script dieksekusi di DOM
 *
 * Dipisah dari route supaya daftar polanya hanya ada di satu tempat. Kalau
 * nanti denylist ini diperluas, cukup ubah file ini.
 *
 * Catatan: ini BUKAN sandbox. Menyisar akan membuat user TMS sendiri bisa
 * menjalankan JS di origin aplikasi. Denylist dipakai karena template hanya
 * masuk lewat UI milik akun yang sama; kalau nanti ada template bersama
 * antar-user, wajib pindah ke sandbox/iframe terisolasi.
 */
export const DANGEROUS_SCRIPT_PATTERNS: RegExp[] = [
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

/** Ganti pola berbahaya dengan komentar, bukan hapus — biar diff-nya jelas. */
export function sanitizeBehaviourScript(script: string): string {
  let sanitized = script;
  for (const pattern of DANGEROUS_SCRIPT_PATTERNS) {
    sanitized = sanitized.replace(pattern, '// BLOCKED');
  }
  return sanitized;
}

/** Batas ukuran `customCss` per template (karakter). */
export const MAX_TEMPLATE_CSS_LENGTH = 200_000;

/**
 * Pola yang diblokir di CSS template.
 *
 * Berbeda dari JS, CSS modern tidak bisa mengeksekusi kode
 * (`expression()` sudah mati di semua browser). Risiko nyatanya:
 * 1. **Breakout dari `<style>`** — CSS di-inline lewat `dangerouslySetInnerHTML`,
 *    jadi `</style>` di dalam teks akan menutup tag lebih dulu dan sisanya
 *    jadi HTML milik halaman. Ini yang paling wajib dicek.
 * 2. **Exfiltration** — `url()` ke domain penyerang menarik data (mis. Referer
 *    yang memuat URL halaman). Hanya `data:` yang diizinkan.
 * 3. **Impor stylesheet luar** — `@import` untuk menarik CSS pihak ketiga.
 * 4. **Binding lama** — `expression()` / `-moz-binding` / `behavior:`.
 *
 * `position: fixed` TIDAK diblokir: progress bar, sticky header, dan efek
 * parallax butuh itu, dan risikonya setara dengan `behaviours[].script` yang
 * sudah tersedia di platform ini.
 */
const DANGEROUS_CSS_PATTERNS: RegExp[] = [
  // Breakout tag <style> (case-insensitive, boleh pakai spasi/ atribut).
  /<\s*\/\s*style/gi,
  /<\s*style/gi,
  // Impor stylesheet luar.
  /@import\b/gi,
  // Exfiltration lewat url() — hanya data: yang boleh.
  /url\(\s*(?!['"]?data:)[^)]*\)/gi,
  // Binding eksekusi lama.
  /expression\s*\(/gi,
  /-moz-binding/gi,
  /\bbehavior\s*:/gi,
];

/**
 * Sanitasi `customCss` template. Dipakai di sisi client sebelum CSS di-inline
 * ke `<style>`. Idempoten dan tidak melempar error untuk input rusak.
 */
export function sanitizeTemplateCss(css: string): string {
  const trimmed = (css ?? '').slice(0, MAX_TEMPLATE_CSS_LENGTH);
  let out = trimmed;
  for (const pattern of DANGEROUS_CSS_PATTERNS) {
    out = out.replace(pattern, '/* BLOCKED */');
  }
  return out;
}

/** Batas ukuran HTML kustom per varian/field (karakter). */
export const MAX_TEMPLATE_HTML_LENGTH = 50_000;

/**
 * Pola yang diblokir di HTML kustom template (v3.0 — ekspresi HTML).
 *
 * Prinsip: HTML kustom untuk DESAIN KREATIF, bukan eksekusi kode.
 * - Script/style/event-handler selalu diblokir (gunakan `behaviours[]`
 *   untuk JS dan `customCss` untuk CSS).
 * - `iframe`/`object`/`embed`/`form` diblokir (exfiltration / navigasi).
 * - `{{...}}` placeholder DIBIARKAN — diganti renderer dengan nilai config.
 */
const DANGEROUS_HTML_PATTERNS: RegExp[] = [
  /<\s*script[\s>]/gi,
  /<\s*\/\s*script/gi,
  /<\s*style[\s>]/gi,
  /<\s*\/\s*style/gi,
  /<\s*iframe[\s>]/gi,
  /<\s*object[\s>]/gi,
  /<\s*embed[\s>]/gi,
  /<\s*form[\s>]/gi,
  /\bon\w+\s*=/gi,
  /javascript\s*:/gi,
];

/** Escape nilai config agar aman disisipkan ke HTML kustom. */
export function escapeHtmlValue(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Item link untuk ekspansi `{{navItems}}` (dan daftar link sejenis). */
export interface NavLinkItem {
  label?: unknown;
  url?: unknown;
  enabled?: unknown;
  isExternal?: unknown;
}

function isNavLinkItem(v: unknown): v is Record<string, unknown> {
  return (
    !!v &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    typeof (v as Record<string, unknown>).label === 'string' &&
    typeof (v as Record<string, unknown>).url === 'string'
  );
}

/** Protokol URL yang diizinkan di link hasil ekspansi. Sisanya jadi `#`. */
function sanitizeNavUrl(url: string): string {
  const t = url.trim();
  if (/^(#|\/|https?:\/\/|mailto:|tel:)/i.test(t)) return t;
  return '#';
}

/**
 * Render array link (mis. `navItems`) menjadi deretan `<a>`.
 * Tanpa ini `{{navItems}}` menjadi string "[object Object],…" karena
 * substitusi flat hanya tahu string. Aturan: item tanpa `enabled` dianggap
 * aktif (konsisten dengan layout bawaan); `enabled: false` dilewati;
 * `isExternal: true` membuka tab baru. Selalu aman (escape + allowlist protokol).
 */
export function renderNavItems(items: unknown): string {
  if (!Array.isArray(items)) return '';
  return items
    .filter((it) => isNavLinkItem(it) && (it.enabled as unknown) !== false)
    .map((it) => {
      const r = it as Record<string, unknown>;
      const label = escapeHtmlValue(String(r.label ?? ''));
      const url = escapeHtmlValue(sanitizeNavUrl(String(r.url ?? '#')));
      const target =
        (r as { isExternal?: unknown }).isExternal === true
          ? ' target="_blank" rel="noreferrer"'
          : '';
      return `<a href="${url}"${target}>${label}</a>`;
    })
    .join('');
}

/** True bila nilai adalah array homogen item link (siap diekspan). */
function isExpandableLinkList(v: unknown): v is Array<Record<string, unknown>> {
  return Array.isArray(v) && v.length > 0 && v.every(isNavLinkItem);
}

/**
 * Sanitasi HTML kustom template. Dipakai saat import dan saat render.
 * Idempoten, tidak melempar error untuk input rusak.
 */
export function sanitizeTemplateHtml(html: string): string {
  const trimmed = (html ?? '').slice(0, MAX_TEMPLATE_HTML_LENGTH);
  let out = trimmed;
  for (const pattern of DANGEROUS_HTML_PATTERNS) {
    out = out.replace(pattern, '<!-- BLOCKED');
  }
  return out;
}

/**
 * Render HTML kustom varian dengan nilai config (v3.0).
 *
 * - `{{key}}` diganti `config[key]` (di-escape).
 * - `{{{key}}}` diganti `config[key]` mentah tapi DISANITASI dulu
 *   (untuk field bertipe `html`).
 * - Array homogen item link `{label, url}` (mis. `navItems`) diekspan jadi
 *   deretan `<a>` — tanpa ini tertulis "[object Object],…".
 * - Hasil akhir disanitasi lewat `sanitizeTemplateHtml`.
 */
export function renderVariantHtml(
  template: string,
  config: Record<string, unknown>,
  htmlFieldKeys: Set<string> = new Set(),
): string {
  const raw = template ?? '';
  // Triple-brace dulu agar tidak tertelan replacer double-brace.
  let out = raw.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_m, key: string) => {
    const v = config[key];
    if (v === undefined || v === null) return '';
    if (isExpandableLinkList(v)) return renderNavItems(v);
    return sanitizeTemplateHtml(String(v));
  });
  out = out.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => {
    const v = config[key];
    if (v === undefined || v === null) return '';
    if (isExpandableLinkList(v)) return renderNavItems(v);
    if (htmlFieldKeys.has(key)) return sanitizeTemplateHtml(String(v));
    return escapeHtmlValue(v);
  });
  return sanitizeTemplateHtml(out);
}

/** Kumpulkan key field bertipe `html` (termasuk nested `itemFields`). */
export function collectHtmlFieldKeys(
  fields: Array<{ key: string; type: string; itemFields?: Array<{ key: string; type: string; itemFields?: unknown }> }>,
): Set<string> {
  const keys = new Set<string>();
  const walk = (list: Array<{ key: string; type: string; itemFields?: unknown }>) => {
    for (const f of list ?? []) {
      if (f.type === 'html') keys.add(f.key);
      if (Array.isArray((f as { itemFields?: unknown }).itemFields)) {
        walk((f as { itemFields: Array<{ key: string; type: string; itemFields?: unknown }> }).itemFields);
      }
    }
  };
  walk(fields as Array<{ key: string; type: string; itemFields?: unknown }>);
  return keys;
}