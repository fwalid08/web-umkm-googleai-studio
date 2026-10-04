/**
 * Helper untuk "Simpan sebagai Template" (library template user).
 *
 * Murni & bebas React supaya bisa diuji tanpa DOM — `vitest.config.ts`
 * memakai `environment: "node"`.
 */

/** Prefix penanda baris library di kolom `template_slug`. */
export const LIBRARY_SLUG_PREFIX = 'saved-';

/** Label default untuk template yang baru disimpan. */
export const DEFAULT_LIBRARY_NAME = 'Desain saya';

/**
 * Slug sintetis untuk baris library: `saved-<uuid>`.
 *
 * Kenapa bukan slug katalog ('food'): constraint
 * `uq_user_templates_website_slug` UNIQUE (website_id, template_slug) dari
 * migrasi 039 akan menolak baris kedua dengan slug yang sama — artinya tiap
 * "Simpan" berikutnya menimpa template sebelumnya. Dengan `saved-<uuid>`:
 *   - constraint lama tetap berlaku tanpa perlu diubah,
 *   - keunikan dijamin uuid,
 *   - slug katalog tetap berarti "template katalog", jadi `resolveTemplateId()`
 *     dan validasi `BUILT_IN_CATALOG` tidak pernah tersesat baris library.
 */
export function buildLibrarySlug(uuid: string): string {
  return `${LIBRARY_SLUG_PREFIX}${uuid}`;
}

/** Apakah slug ini milik baris library (bukan template katalog)? */
export function isLibrarySlug(slug: string | null | undefined): boolean {
  return typeof slug === 'string' && slug.startsWith(LIBRARY_SLUG_PREFIX);
}

/**
 * Normalisasi nama template library.
 *
 * Nama kosong tidak boleh: kolom `name` akan tampil sebagai judul di daftar,
 * dan template tanpa nama tidak bisa dibedakan dari template lain.
 * `custom_config` milik library TIDAK ikut ditulis ke sini — nama disimpan
 * di kolomnya sendiri supaya bisa di-index/diurutkan tanpa mengurai JSONB.
 */
export function normalizeLibraryName(raw: string): string {
  const name = raw.replace(/\s+/g, ' ').trim();
  return name.length > 0 ? name.slice(0, 120) : DEFAULT_LIBRARY_NAME;
}