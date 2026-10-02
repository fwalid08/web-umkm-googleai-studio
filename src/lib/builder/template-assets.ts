/**
 * Aset foto bawaan per niche bisnis.
 *
 * Template_section `config.image` / `background_image` diisi dari sini saat
 * template diterapkan, supaya hasil awal benar-benar terasa "warung makan"
 * atau "butik hijab" — bukan kotak kosong. Semua foto di-host di CDN
 * Unsplash (hotlink resmi, stabil, gratis untuk non-komersial kecil) dan
 * TIDAK butuh domain whitelist karena renderer memakai `<img>` biasa.
 *
 * Catatan: kalau URL mati, section renderer sudah punya fallback (lihat
 * `section-renderer.tsx` — `{image ? <img> : <fallback>}`), jadi halaman
 * tetap rapi. Ganti ke foto brand sendiri kapan saja lewat form config.
 */

const UNSPLASH = (id: string, w = 1200, h = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

/** Foto relevan per niche — dipilih agar relevan dengan karakter bisnis. */
export const BIZ_ASSETS = {
  /** Kuliner: warung, makanan rumahan, dapur. */
  food: {
    hero: UNSPLASH('photo-1504674900247-0877df9cc836', 1600, 900),
    gallery: [
      UNSPLASH('photo-1414235077428-338989a2e8c0'),
      UNSPLASH('photo-1552566626-52f8b828add9'),
      UNSPLASH('photo-1466978913421-dad2ebd01d17'),
      UNSPLASH('photo-1555396273-367ea4eb4db5'),
      UNSPLASH('photo-1540189549336-e6e99c3679fe'),
      UNSPLASH('photo-1476224203421-9ac39bcb3327'),
    ],
    about: UNSPLASH('photo-1556910103-1c02745aae4d'),
    team: [UNSPLASH('photo-1577219491135-ce391730fb2c', 200, 200)],
  },
  /** Fesyen: hijab, busana, tekstil. */
  fashion: {
    hero: UNSPLASH('photo-1441984904996-e0b6ba687e04', 1600, 900),
    gallery: [
      UNSPLASH('photo-1483985988355-763728e1935b'),
      UNSPLASH('photo-1469334031218-e382a71b716b'),
      UNSPLASH('photo-1445205170230-053b83016050'),
      UNSPLASH('photo-1490481651871-ab68de25d43d'),
      UNSPLASH('photo-1489987707025-afc232f7ea0f'),
      UNSPLASH('photo-1496747611176-843222e1e57c'),
    ],
    about: UNSPLASH('photo-1445205170230-053b83016050'),
    team: [UNSPLASH('photo-1580489944761-15a19d654956', 200, 200)],
  },
  /** Ritel: kelontong, groceries, barang harian. */
  retail: {
    hero: UNSPLASH('photo-1604719312566-8912e9227c6a', 1600, 900),
    gallery: [
      UNSPLASH('photo-1578916171728-46686eac8d58'),
      UNSPLASH('photo-1542838132-92c53300491e'),
      UNSPLASH('photo-1601598851547-4302969d0614'),
      UNSPLASH('photo-1583258292688-d0213dc5a3a8'),
      UNSPLASH('photo-1607083206869-4c7672e72a8a'),
      UNSPLASH('photo-1578916171728-46686eac8d58'),
    ],
    about: UNSPLASH('photo-1604719312566-8912e9227c6a'),
    team: [UNSPLASH('photo-1600486913747-55e5470d6f40', 200, 200)],
  },
  /** Kerajinan: handmade, kayu, anyaman, keramik. */
  handicraft: {
    hero: UNSPLASH('photo-1452860606245-08befc0ff44b', 1600, 900),
    gallery: [
      UNSPLASH('photo-1516961642265-531546e84af2'),
      UNSPLASH('photo-1528825871115-3581a5387919'),
      UNSPLASH('photo-1493106641515-6b5631de4bb9'),
      UNSPLASH('photo-1523413651479-597eb2da0ad6'),
      UNSPLASH('photo-1499952127939-def9fbbc7715'),
      UNSPLASH('photo-1503602642458-232111445657'),
    ],
    about: UNSPLASH('photo-1452860606245-08befc0ff44b'),
    team: [UNSPLASH('photo-1507003211169-0a1dd7228f2d', 200, 200)],
  },
  /** Jasa: barbershop, salon, klinik, bengkel. */
  services: {
    hero: UNSPLASH('photo-1503951914875-452162b0f3f1', 1600, 900),
    gallery: [
      UNSPLASH('photo-1503951914875-452162b0f3f1'),
      UNSPLASH('photo-1585747860715-2ba37e788b70'),
      UNSPLASH('photo-1621605815971-fbc98d665033'),
      UNSPLASH('photo-1599351431202-1e0f0137899a'),
      UNSPLASH('photo-1560066984-138dadb4c035'),
      UNSPLASH('photo-1600948836101-f9ffda59d250'),
    ],
    about: UNSPLASH('photo-1522337360788-8b13dee7a37e'),
    team: [UNSPLASH('photo-1531384441138-2736e62e0919', 200, 200)],
  },
} as const;

export type BizCategory = keyof typeof BIZ_ASSETS;

export function assetsFor(category?: string): (typeof BIZ_ASSETS)[BizCategory] | null {
  if (!category) return null;
  return (BIZ_ASSETS as Record<string, (typeof BIZ_ASSETS)[BizCategory]>)[category] ?? null;
}

/**
 * Isi field foto pada config section dengan aset bawaan niche.
 * Tidak menimpa nilai yang sudah diisi (custom user / template lain).
 *
 * PENTING (anti-berantakan): hanya field yang ADA di config yang diisi.
 * Dulu fungsi ini MENAMBAHKAN `image`/`background_image` ke SEMUA section
 * (mis. 11 section template laundry disuntik foto barbershop yang sama),
 * padahal renderer (`config.image || config.background_image`) me-rendernya
 * — hasilnya kanvas penuh foto salah, sementara preview (tanpa fill) kosong.
 * Sekarang: tanpa key = tanpa suntik, kanvas identik dengan preview.
 */
export function applySectionAssets(
  config: Record<string, unknown>,
  category?: string,
  opts: { index?: number } = {},
): Record<string, unknown> {
  const assets = assetsFor(category);
  if (!assets) return config;
  const out: Record<string, unknown> = { ...config };
  const i = opts.index ?? 0;

  // Hero: image / background_image — hanya bila key-nya memang ada di config.
  if ('image' in out && !out.image) out.image = assets.hero;
  if ('background_image' in out && !out.background_image) out.background_image = assets.hero;
  // Galeri / tim: array of { image }
  for (const key of ['items', 'members'] as const) {
    const arr = out[key];
    if (!Array.isArray(arr) || arr.length === 0) continue;
    out[key] = arr.map((item, idx) => {
      if (typeof item !== 'object' || item === null) return item;
      const o = item as Record<string, unknown>;
      if (o.image) return o;
      const pool = key === 'members' ? assets.team : assets.gallery;
      return { ...o, image: pool[idx % pool.length] };
    });
  }
  // Section `about` / `team`level pakai config.image langsung — sama:
  // hanya bila key-nya ada (lihat catatan anti-berantakan di atas).
  if ('image' in out && !out.image && assets.about) out.image = assets.about;
  return out;
}
