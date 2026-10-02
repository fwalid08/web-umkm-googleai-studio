/**
 * Auto-map aset upload ke field gambar kosong (saat import ZIP).
 *
 * Masalah nyata: template AI mengupload 9–12 file tapi hanya ~1 yang dirujuk
 * config — field gambar lain kosong. Akibatnya preview tampil kosong dan
 * kanvas diisi foto generik (bukan desain template). Aturan AI (§2.6)
 * mewajibkan referensi eksplisit, tapi jaring pengaman ini memperbaiki yang
 * terlewat: file yang cocok konvensi nama diisi otomatis ke field kosong.
 *
 * - HANYA mengisi field yang kosong; tidak pernah menimpa nilai terisi.
 * - Satu file dipakai sekali (kecuali pool habis → field dibiarkan kosong).
 * - Deterministik: pool diurutkan per nama, config diproses berurutan.
 * - Setiap pengisian dicatat (`filled`) untuk ditampilkan ke user.
 */

export interface MappableAsset {
  name: string;
  url: string;
}

export interface AutomapResult {
  templateData: Record<string, unknown>;
  /** Catatan "path.field ← file" untuk ditampilkan ke user. */
  filled: string[];
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'avif'];

/** Batas bawah ukuran file foto raster — di bawah ini hampir pasti placeholder. */
export const MIN_RASTER_BYTES = 15 * 1024;

function magicOf(bytes: Uint8Array, len = 16): string {
  return Array.from(bytes.slice(0, len))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function headTextOf(bytes: Uint8Array, len = 512): string {
  let s = '';
  const n = Math.min(bytes.length, len);
  for (let i = 0; i < n; i++) s += String.fromCharCode(bytes[i]);
  return s.trimStart().slice(0, 120).toLowerCase();
}

/**
 * Periksa isi file gambar hasil upload (kasus nyata: placeholder SVG ~1KB
 * yang diberi ekstensi `.jpg`/`.png` — lolos validasi ekstensi tapi tampil
 * rusak di preview & canvas).
 *
 * Mengembalikan pesan warning (Indonesia) atau null bila file tampak wajar.
 * Tidak pernah menggagalkan import — hanya peringatan di respons.
 */
export function sniffImageContent(relativeName: string, bytes: Uint8Array): string | null {
  const ext = (relativeName.toLowerCase().split('.').pop() ?? '');
  const short = relativeName.slice(0, 80);
  const head = headTextOf(bytes);
  const looksSvg = head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'));

  if (ext === 'svg') {
    if (!looksSvg && !head.startsWith('<?xml')) {
      return `Aset "${short}" berekstensi .svg tapi isinya bukan SVG — gambar mungkin tidak tampil.`;
    }
    return null;
  }

  if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'ico'].includes(ext)) {
    if (looksSvg) {
      return `Aset "${short}" ternyata file SVG/placeholder (bukan foto ${ext.toUpperCase()} asli) — tampil rusak di preview & canvas. Ganti ekstensi jadi .svg atau pakai foto asli.`;
    }
    if (bytes.length < MIN_RASTER_BYTES) {
      const kb = (bytes.length / 1024).toFixed(1);
      return `Aset "${short}" sangat kecil (${kb} KB) untuk foto — kemungkinan placeholder/thumbnail. Pakai foto resolusi lebih besar agar tampil tajam.`;
    }
    const magic = magicOf(bytes, 4);
    const plausible =
      (ext === 'png' && magic.startsWith('89504e47')) ||
      ((ext === 'jpg' || ext === 'jpeg') && magic.startsWith('ffd8ff')) ||
      (ext === 'webp' && magicOf(bytes, 12).startsWith('52494646') && magicOf(bytes, 12).slice(16) === '57454250') ||
      (ext === 'gif' && (magic.startsWith('47494638'))) ||
      (ext === 'avif' || ext === 'ico');
    if (!plausible) {
      return `Aset "${short}" isinya tidak cocok dengan ekstensi .${ext} — gambar mungkin tidak tampil di sebagian browser.`;
    }
  }
  return null;
}

function isImageAsset(a: MappableAsset): boolean {
  const ext = a.name.toLowerCase().split('.').pop() ?? '';
  return IMAGE_EXTS.includes(ext) && !!a.url;
}

/** Kelompok keyword nama file per peran field gambar. */
const ROLE_KEYWORDS: Array<{ roles: string[]; keywords: string[] }> = [
  { roles: ['logoUrl', 'logo_url', 'logo'], keywords: ['logo'] },
  {
    roles: ['avatar'],
    keywords: ['avatar', 'testi', 'team', 'chef', 'crew', 'member', 'staff', 'orang', 'user', 'person', 'pelanggan', 'customer', 'review', 'founder', 'owner'],
  },
  {
    roles: ['image', 'backgroundImage', 'background_image'],
    keywords: ['hero', 'banner', 'cover', 'header', 'utama', 'main', 'jumbotron'],
  },
  {
    roles: ['images', 'gallery', 'photos', 'photoset'],
    keywords: ['galler', 'galeri', 'photo', 'foto', 'work', 'hasil', 'portfolio', 'showcase', 'produk', 'product', 'menu', 'makanan', 'food', 'jasa', 'layanan', 'service'],
  },
];

const ABOUT_KEYWORDS = ['about', 'tentang', 'toko', 'kami', 'story', 'profil', 'kedai', 'outlet', 'workshop', 'bengkel', 'dapur', 'kitchen', 'tempat', 'place'];

function keywordsFor(key: string, sectionType?: string): string[] {
  const lower = key.toLowerCase();
  for (const group of ROLE_KEYWORDS) {
    if (group.roles.some((r) => lower.includes(r.toLowerCase()))) return group.keywords;
  }
  // Field `image` generik di section about/team ikut kata kunci about.
  if (lower === 'image' && sectionType && ['about', 'team'].includes(sectionType)) {
    return [...ROLE_KEYWORDS[2].keywords, ...ABOUT_KEYWORDS];
  }
  return [];
}

function fileMatches(filename: string, keywords: string[]): boolean {
  const lower = filename.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function deepClone<T>(v: T): T {
  return v === undefined ? v : JSON.parse(JSON.stringify(v));
}

function isEmptyImageValue(v: unknown): boolean {
  return v === '' || v === null || v === undefined || (Array.isArray(v) && v.length === 0);
}

/**
 * Isi field gambar kosong di seed sections + header/footer + katalog
 * defaults dengan aset upload yang belum dirujuk siapa pun.
 */
export function autoMapAssets(
  templateData: Record<string, unknown>,
  uploaded: MappableAsset[],
): AutomapResult {
  const out = deepClone(templateData);
  const filled: string[] = [];
  let serialized = '';
  try {
    serialized = JSON.stringify(out);
  } catch {
    return { templateData: out, filled };
  }

  // Pool: aset gambar yang URL-nya belum muncul di mana pun.
  const pool = uploaded
    .filter(isImageAsset)
    .filter((a) => !serialized.includes(a.url))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (pool.length === 0) return { templateData: out, filled };

  const take = (keywords: string[]): MappableAsset | null => {
    const idx = pool.findIndex((a) => fileMatches(a.name, keywords));
    if (idx >= 0) return pool.splice(idx, 1)[0];
    // Fallback: file gambar mana pun yang tersisa.
    return pool.shift() ?? null;
  };

  const takeMany = (keywords: string[], max: number): MappableAsset[] => {
    const matched = pool.filter((a) => fileMatches(a.name, keywords)).slice(0, max);
    for (const m of matched) pool.splice(pool.indexOf(m), 1);
    const rest: MappableAsset[] = [];
    while (rest.length + matched.length < max && pool.length > 0) {
      rest.push(pool.shift()!);
    }
    return [...matched, ...rest];
  };

  const fillConfig = (config: Record<string, unknown>, label: string, sectionType?: string): void => {
    for (const [key, value] of Object.entries(config)) {
      if (!isEmptyImageValue(value)) continue;
      const lower = key.toLowerCase();
      const isArrayKey = Array.isArray(value);
      const looksImage =
        isArrayKey &&
        ['images', 'gallery', 'photos', 'photoset'].some((k) => lower.includes(k));
      if (!looksImage && !['image', 'logourl', 'logo_url', 'backgroundimage', 'background_image', 'avatar', 'photo', 'banner', 'thumbnail'].some((k) => lower.includes(k))) {
        continue;
      }
      if (isArrayKey) {
        const files = takeMany(keywordsFor(key, sectionType), 8);
        if (files.length === 0) continue;
        config[key] = files.map((f) => f.url);
        filled.push(`${label}.${key} ← ${files.map((f) => f.name).join(', ')}`);
      } else {
        const keywords = keywordsFor(key, sectionType);
        // Section about/team: image generik boleh pakai kata kunci about.
        const extra =
          key.toLowerCase() === 'image' && sectionType && !['hero'].includes(sectionType)
            ? ABOUT_KEYWORDS
            : [];
        const file = take([...keywords, ...extra]);
        if (!file) continue;
        config[key] = file.url;
        filled.push(`${label}.${key} ← ${file.name}`);
      }
    }
  };

  const root = out as Record<string, unknown>;
  const data = (root.data && typeof root.data === 'object' && !Array.isArray(root.data)
    ? (root.data as Record<string, unknown>)
    : root) as Record<string, unknown>;

  // Indeks field gambar dari katalog (type → variant → [{key, isArray}])
  // agar key yang HILANG dari seed pun bisa ditambahkan — selama variannya
  // mendeklarasikan field tersebut (sidebar mendukung, renderer membaca).
  const catalogFields = new Map<string, Array<{ key: string; isArray: boolean }>>();
  const catalogList = Array.isArray(root.sections) ? root.sections as Array<Record<string, unknown>> : [];
  for (const d of catalogList) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.variants)) continue;
    for (const v of d.variants as Array<Record<string, unknown>>) {
      if (!v || typeof v !== 'object' || !Array.isArray(v.fields ?? v.configFields)) continue;
      const fields = (v.fields ?? v.configFields) as Array<Record<string, unknown>>;
      // HANYA field top-level: itemFields bersarang milik items per-baris,
      // bukan config section — menambahkannya sebagai key top-level = polusi.
      const imgFields: Array<{ key: string; isArray: boolean }> = [];
      for (const f of fields) {
        if (!f || typeof f !== 'object') continue;
        if ((f.type === 'image' || f.type === 'gallery') && typeof f.key === 'string') {
          imgFields.push({ key: f.key as string, isArray: f.type === 'gallery' });
        }
      }
      if (imgFields.length > 0) {
        catalogFields.set(`${String(d.type)}::${String(v.id)}`, imgFields);
      }
    }
  }

  // 1. Seed sections (yang dirender) + seed header/footer.
  const seedSections = Array.isArray(data.sections) ? data.sections as Array<Record<string, unknown>> : [];
  for (const s of seedSections) {
    if (!s || typeof s !== 'object') continue;
    const label = `${String(s.type ?? '?')}/${String(s.variant ?? '?')}`;
    const sectionType = String(s.type ?? '');
    if (s.config && typeof s.config === 'object' && !Array.isArray(s.config)) {
      const cfg = s.config as Record<string, unknown>;
      fillConfig(cfg, label, sectionType);
      // Tambahkan key gambar yang dideklarasikan katalog tapi hilang di seed.
      const declared = catalogFields.get(`${sectionType}::${String(s.variant ?? '')}`);
      for (const f of declared ?? []) {
        const cur = cfg[f.key];
        if (f.isArray) {
          if (!Array.isArray(cur) || cur.length === 0) {
            const files = takeMany(keywordsFor(f.key, sectionType), 8);
            if (files.length === 0) continue;
            cfg[f.key] = files.map((x) => x.url);
            filled.push(`${label}.${f.key} ← ${files.map((x) => x.name).join(', ')} (key ditambahkan)`);
          }
        } else if (cur === '' || cur === null || cur === undefined) {
          const keywords = keywordsFor(f.key, sectionType);
          const extra =
            f.key.toLowerCase() === 'image' && sectionType && !['hero'].includes(sectionType)
              ? ABOUT_KEYWORDS
              : [];
          const file = take([...keywords, ...extra]);
          if (!file) continue;
          cfg[f.key] = file.url;
          filled.push(`${label}.${f.key} ← ${file.name} (key ditambahkan)`);
        }
      }
    }
  }
  for (const chromeKey of ['header', 'footer'] as const) {
    const cfg = data[chromeKey];
    if (cfg && typeof cfg === 'object' && !Array.isArray(cfg)) {
      fillConfig(cfg as Record<string, unknown>, chromeKey);
    }
  }

  // 2. Katalog defaults (agar ganti varian di sidebar tetap membawa gambar).
  for (const zone of ['headers', 'footers', 'sections'] as const) {
    const list = root[zone];
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const rec = item as Record<string, unknown>;
      if (rec.defaultConfig && typeof rec.defaultConfig === 'object' && !Array.isArray(rec.defaultConfig)) {
        fillConfig(
          rec.defaultConfig as Record<string, unknown>,
          `katalog/${String(rec.id ?? rec.type ?? '?')}`,
          typeof rec.type === 'string' ? rec.type : undefined,
        );
      }
      if (Array.isArray(rec.variants)) {
        for (const v of rec.variants) {
          if (!v || typeof v !== 'object') continue;
          const vr = v as Record<string, unknown>;
          if (vr.defaultConfig && typeof vr.defaultConfig === 'object' && !Array.isArray(vr.defaultConfig)) {
            fillConfig(
              vr.defaultConfig as Record<string, unknown>,
              `katalog/${String(rec.type ?? '?')}/${String(vr.id ?? '?')}`,
              typeof rec.type === 'string' ? rec.type : undefined,
            );
          }
        }
      }
    }
  }

  return { templateData: out, filled };
}
