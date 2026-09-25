/**
 * Status publikasi website — lensa Bu Toni (35-55 thn, non-tech).
 * Aturan tunggal, dipakai kartu daftar + workspace + test:
 * current_template_id null/kosong = Draft (belum bisa dilihat pembeli),
 * selain itu = Publish (sudah live).
 */

export type WebsitePublishStatus = "draft" | "publish";

export function websiteStatus(site: {
  current_template_id?: string | null;
}): WebsitePublishStatus {
  return site.current_template_id ? "publish" : "draft";
}
