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