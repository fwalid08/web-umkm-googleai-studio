/**
 * Status publikasi website — lensa Bu Toni (35-55 thn, non-tech).
 * Aturan tunggal, dipakai kartu daftar + workspace + test:
 * template_slug/current_template_id kosong = Draft (belum bisa dilihat pembeli),
 * selain itu = Publish (sudah live).
 */

export type WebsitePublishStatus = "draft" | "publish";

export function websiteStatus(site: {
  template_slug?: string | null;
  current_template_id?: string | null;
}): WebsitePublishStatus {
  return site.template_slug || site.current_template_id ? "publish" : "draft";
}
