/**
 * Sprint 05 Tahap 1 — Katalog TLD + simulasi ketersediaan.
 * TAHAP 2 ganti `checkAvailability` dengan API registrar betulan
 * (signature tetap: { domain, available, priceYearly }).
 */

export interface TldInfo {
  tld: string;
  priceYearly: number;
  buyable: boolean;
  requirement: string | null;
}

export const TLD_CATALOG: TldInfo[] = [
  { tld: "com", priceYearly: 199000, buyable: true, requirement: null },
  { tld: "id", priceYearly: 245000, buyable: false, requirement: "Butuh KTP/SIM — hadir tahap 2" },
  { tld: "co.id", priceYearly: 350000, buyable: false, requirement: "Butuh SIUP/Akta usaha — hadir tahap 3" },
];

/** Normalisasi input user jadi nama domain penuh. Return null jika invalid. */
export function normalizeSearch(input: string, tld: string): string | null {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split(".")[0]
    .replace(/[^a-z0-9-]/g, "");
  if (base.length < 3 || base.length > 50) return null;
  if (!/^[a-z0-9-]+$/.test(base)) return null;
  return `${base}.${tld}`;
}

/**
 * Simulasi ketersediaan (deterministik: hasil sama untuk query sama).
 * Aturan demo: nama pendek (<5) atau umum dianggap sudah diambil.
 */
const TAKEN_WORDS = ["toko", "warung", "jaya", "maju", "baru", "indah", "berkah", "sumber", "tani", "shop", "store"];

export function simulateAvailability(domain: string): boolean {
  const base = domain.split(".")[0];
  if (base.length < 5) return false;
  if (TAKEN_WORDS.includes(base)) return false;
  let h = 0;
  for (const c of domain) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h % 4 !== 0;
}

export function formatRp(n: number): string {
  return `Rp${n.toLocaleString("id-ID")}`;
}
