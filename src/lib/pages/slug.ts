/**
 * Single source of truth untuk slug halaman toko (store_pages).
 * Dipakai app/api/websites/[websiteId]/pages/*, app/[...slug], dan UI
 * (pages-tab) supaya aturan validasi tidak lagi diduplikasi di banyak tempat.
 */

/**
 * Slug yang dilindungi sistem: dipakai route lain (catch-all reserved),
 * rute dashboard, atau build-in API.
 */
export const RESERVED_SLUGS = new Set([
  "home",
  "checkout",
  "blog",
  "cart",
  "p",
  "api",
  "dashboard",
  "auth",
  "login",
  "signin",
  "signup",
  "produk",
  "order",
  "orders",
  "builder",
  "customize",
  "page-builder",
  "preview",
  "terms",
  "privacy",
  "settings",
  "billing",
]);

/** Panjang maksimum slug yang disimpan (kolom VARCHAR(200)). */
export const SLUG_MAX_LENGTH = 200;

/** Format slug valid: huruf kecil/angka dipisah satu tanda `-`. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Normalisasi input slug: lowercase, buang aksen, ganti karakter non-`[a-z0-9-]`
 * menjadi `-`, rapatkan `-`, dan potong `-` di ujung.
 * Selalu mengembalikan string (bisa kosong bila input tak punya karakter valid).
 */
export function normalizeSlug(input: string): string {
  return (input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Validasi slug final (sudah dinormalisasi).
 * @returns pesan error siap-pakai, atau `null` bila valid.
 */
export function slugError(slug: string): string | null {
  if (!slug) return "Slug wajib diisi";
  if (slug.length > SLUG_MAX_LENGTH) return `Slug maksimal ${SLUG_MAX_LENGTH} karakter`;
  if (!SLUG_RE.test(slug)) {
    return "Slug hanya boleh huruf kecil, angka, dan tanda -";
  }
  if (RESERVED_SLUGS.has(slug)) return `Slug "${slug}" dilindungi sistem`;
  return null;
}

/** Alias: true bila slug boleh dipakai (bukan reserved & format valid). */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

/**
 * Cek apakah sebuah path (catch-all `[...slug]`) dilindungi sistem.
 * Menerima path multi-segmen (mis. "p/tentang-kami") — segmen pertama
 * yang menentukan. `""` (root) juga dianggap dilindungi (bukan halaman custom).
 */
export function isReservedSlugPath(slugPath: string): boolean {
  if (!slugPath) return true;
  const first = slugPath.split("/")[0];
  return RESERVED_SLUGS.has(first);
}
