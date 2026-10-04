import { notFound } from "next/navigation";
import type { Metadata } from "next";

/**
 * Website sekarang SATU HALAMAN (lihat 044_single_page_user_templates.sql):
 * tabel `store_pages` dihapus, jadi tidak ada lagi halaman selain "/".
 *
 * Halaman utama dilayani `app/page.tsx` (memakai `getTenantSite()`). Route
 * catch-all ini sengaja selalu 404 supaya URL lama (/tentang, /kontak,
 * /faq, …) tidak lagi dilayani setelah migrasi.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {};
}

export default async function TenantSlugPage(): Promise<never> {
  notFound();
}
