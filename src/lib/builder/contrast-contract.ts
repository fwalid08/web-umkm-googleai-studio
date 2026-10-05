/**
 * Kontrak rasio kontras per template (§19 TEMPLATE_GUIDE).
 *
 * Masalah yang diselesaikan: palet sebuah template bebas memakai token yang
 * sama sebagai background DAN sebagai warna teks. `accent` di laundry-emerald,
 * misalnya, jadi latar tombol WhatsApp sekaligus warna aksen di header. Kalau
 * kontras gagal, kita tidak boleh "memperbaiki" `accent` di tempat — karena
 * begitu `accent` digelapkan, tempat lain yang memakainya sebagai background
 * ikut berubah dan bisa jadi bentrok baru.
 *
 * Solusinya: **koreksi per pasangan, bukan per token.**
 * - Token fg-only (`text`, `textMuted`) dikoreksi in-place — aman karena
 *   memang hanya dipakai sebagai tulisan.
 * - Token dual-role (`primary`, `secondary`, `accent`, `surface`,
 *   `background`, `border`) TIDAK PERNAH dimutasi. Hasil koreksinya
 *   diturunkan sebagai token baru: `--color-<fg>-on-<bg>`.
 *
 * Author template mendeklarasikan pasangan lewat `Template.contrast.pairs`
 * (sumber kebenaran). `scanHtmlContrastPairs()` hanya alat AUDIT: hasilnya
 * warning di CI, tidak pernah memblokir, karena parser HTML-inline tidak
 * akan pernah sempurna (opacity, color-mix, `inherit`).
 *
 * Semua perhitungan kontras memakai ulang helper yang sudah ada
 * (`getContrastRatio`, `getOnColor`, `autoFixTextColor`) — tidak ada
 * algoritma WCAG kedua di repo ini.
 */

import {
  MIN_CONTRAST_NORMAL_TEXT,
  getContrastRatio,
  getOnColor,
} from './design-styles';
import {
  MIN_CONTRAST_LARGE_TEXT,
  type EffectiveBackground,
  autoFixTextColor,
  fgForBg,
} from './section-contrast';
import type { DesignStylePalette } from './types';

/** Kunci palet yang boleh dipakai di pasangan kontras. */
export type ContrastPaletteKey = keyof DesignStylePalette;

/**
 * Token turunan yang juga boleh jadi sisi `fg`/`bg` pasangan.
 *
 * `on-<key>` = warna teks otomatis di atas `<key>` (lihat `getOnColor`).
 * Memasukkan ke kontrak penting karena inilah bentuk bug yang nyata:
 * header emerald memakai `background: var(--color-accent)` +
 * `color: var(--color-on-primary)`, yaitu foreground yang dihitung dari
 * primary — bukan dari accent yang sedang jadi latar.
 */
export type ContrastTokenKey = ContrastPaletteKey | `on-${ContrastPaletteKey}`;

/** Peran semantik teks — menentukan ambang WCAG yang dipakai. */
export type ContrastRole = 'body' | 'muted' | 'heading' | 'non-text';

/**
 * Ambang rasio per peran.
 *
 * `heading` 3:1 = WCAG large text. Ukuran yang diekspresikan lewat `clamp()`
 * atau px tidak bisa dipastikan scanner, jadi selalu diperlakukan sebagai
 * normal (4.5) di scanner — konservatif, tidak pernah optimistis.
 */
export const MIN_CONTRAST_BY_ROLE: Record<ContrastRole, number> = {
  body: MIN_CONTRAST_NORMAL_TEXT,
  muted: MIN_CONTRAST_NORMAL_TEXT,
  heading: MIN_CONTRAST_LARGE_TEXT,
  'non-text': MIN_CONTRAST_LARGE_TEXT,
};

/**
 * Token yang HANYA muncul sebagai tulisan. Koreksi in-place aman karena
 * tidak mungkin jadi background di mana pun.
 *
 * Token di luar daftar ini dual-role → tidak boleh dimutasi.
 */
export const FG_ONLY_PALETTE_KEYS: ReadonlySet<ContrastPaletteKey> = new Set<ContrastPaletteKey>([
  'text',
  'textMuted',
]);

export interface ContrastPair {
  /** Token foreground, mis. `accent` atau `on-primary`. */
  fg: ContrastTokenKey;
  /** Token background tempat `fg` diletakkan, mis. `primary`. */
  bg: ContrastTokenKey;
  /** Peran semantik → menentukan ambang. */
  role: ContrastRole;
  /**
   * Ambang eksplisit. Bila diisi, menang atas `role`.
   * Pakai ini untuk kasus khusus (mis. teks dekoratif yang boleh 2.5:1).
   */
  minRatio?: number;
  /**
   * Nama token turunan hasil koreksi. Default `--color-<fg>-on-<bg>`.
   *
   * Isi manual hanya bila nama default kurang deskriptif, atau bila
   * beberapa pasangan menghasilkan token yang sama dengan sengaja.
   */
  token?: string;
  /** Konteks pemakai — hanya untuk pesan diagnostik. */
  note?: string;
}

export interface ContrastContract {
  pairs: ContrastPair[];
}

/**
 * Ubah token kontrak (`accent`, `on-accent`, …) menjadi hex efektif.
 *
 * Token `on-<key>` dihitung ulang dari palet AKTIF, jadi tetap benar setelah
 * user ganti skema warna — itulah justru alasan tokennya harus ikut
 * dikontrak, bukan dibekukan sebagai hex di author time.
 */
export function resolveContrastToken(
  key: ContrastTokenKey,
  palette: DesignStylePalette,
): string | undefined {
  if (typeof key === 'string' && key.startsWith('on-')) {
    const base = key.slice(3) as ContrastPaletteKey;
    const hex = palette[base];
    return isHexLike(hex) ? getOnColor(normHex(hex)) : undefined;
  }
  const hex = palette[key as ContrastPaletteKey];
  return isHexLike(hex) ? normHex(hex) : undefined;
}

/**
 * True bila `key` adalah kunci palet yang HANYA muncul sebagai tulisan —
 * aman dikoreksi in-place.
 *
 * Token `on-*` sengaja TIDAK termasuk: `on-primary` diturunkan dari primary,
 * jadi "memperbaikinya" berarti mengubah primary yang juga jadi background.
 */
export function isInPlaceFixable(key: ContrastTokenKey): boolean {
  return typeof key === 'string' && !key.startsWith('on-') &&
    FG_ONLY_PALETTE_KEYS.has(key as ContrastPaletteKey);
}

/** Ambang efektif sebuah pasangan (explicit menang atas role). */
export function minRatioForPair(pair: ContrastPair): number {
  return typeof pair.minRatio === 'number' && Number.isFinite(pair.minRatio)
    ? pair.minRatio
    : (MIN_CONTRAST_BY_ROLE[pair.role] ?? MIN_CONTRAST_NORMAL_TEXT);
}

/**
 * Bolehkah koreksi fg-only ditulis ke token GLOBAL `--color-<fg>`?
 *
 * Token fg-only (`text`, `textMuted`) muncul di banyak latar sekaligus, jadi
 * satu nilai global hanya boleh ditimpa bila nilainya itu TETAP terbaca di
 * dua permukaan kanonik (`background`, `surface`), dan tetap memuaskan semua
 * pasangan kontrak yang memakai fg tersebut.
 *
 * Tanpa pemeriksaan ini, satu pasangan `text` di atas `primary` (gelap)
 * menimpa `--color-text` dengan putih, lalu seluruh teks di atas latar terang
 * jadi putih-di-putih. Keadaan itu terukur sebelum perbaikan: 28 pasangan
 * jatuh dari 13–19:1 menjadi 1.00–1.29:1, pada 14 dari 18 skema warna —
 * mengorbankan ~25 titik pemakaian yang tadinya benar demi 1 yang sudah
 * ditangani token turunan.
 *
 * Kandidat yang ditolak TIDAK dibuang: `buildContrastMatrix` tetap membuat
 * `--color-<fg>-on-<bg>` untuk pasangan itu, dan HTML yang memang menaruh fg
 * di atas bg tertentu sudah menulis token turunan tersebut.
 */
export function globalFgCorrectionSafe(
  fgKey: ContrastTokenKey,
  candidate: string,
  palette: DesignStylePalette,
  contract?: ContrastContract | null,
): boolean {
  const before = palette[fgKey as ContrastPaletteKey];
  for (const surfaceKey of ['background', 'surface'] as const) {
    const surface = palette[surfaceKey];
    if (!isHexLike(surface)) continue;
    // Tak boleh lebih buruk dari palet asli, dan tetap ≥ 4.5:1 selama
    // palet aslinya memang lolos. Palet yang sudah rusak tetap boleh
    // dikoreksi — pemeriksaan ini menahan PERBAIKAN, bukan kerusakan.
    const beforeRatio = isHexLike(before)
      ? getContrastRatio(before, surface)
      : MIN_CONTRAST_NORMAL_TEXT;
    if (getContrastRatio(candidate, surface) < Math.min(beforeRatio, MIN_CONTRAST_NORMAL_TEXT)) {
      return false;
    }
  }
  for (const pair of contract?.pairs ?? []) {
    if (pair.fg !== fgKey) continue;
    const bgHex = resolveContrastToken(pair.bg, palette);
    if (!bgHex) continue;
    if (getContrastRatio(candidate, bgHex) < minRatioForPair(pair)) return false;
  }
  return true;
}

/** Nama token turunan default untuk sebuah pasangan. */
export function contrastTokenName(pair: ContrastPair): string {
  return pair.token ?? `--color-${pair.fg}-on-${pair.bg}`;
}

/**
 * Nama token "teks otomatis di atas latar X".
 *
 * Dipakai untuk kasus umum seperti `brandMark(bg, fg)` di mana fg harus
 * mengikuti bg-nya sendiri. `getOnColor()` secara matematis selalu ≥ 4.5:1
 * untuk warna sRGB mana pun (putih atau hitam, salah satunya menang), jadi
 * token ini aman tanpa perlu autofix.
 */
export function onColorTokenName(bg: ContrastPaletteKey): string {
  return `--color-on-${bg}`;
}

export interface ContrastIssue {
  fg: ContrastTokenKey;
  bg: ContrastTokenKey;
  fgHex: string;
  bgHex: string;
  ratio: number;
  minRatio: number;
  /** Rasio setelah koreksi — bukti bahwa koreksinya berhasil. */
  fixedRatio: number;
  /** Warna koreksi yang dipakai untuk token turunan. */
  fixed: string;
  note?: string;
}

export interface ResolvedContrast {
  /** Token turunan per pasangan (koreksi in-place included). */
  tokens: Record<string, string>;
  /** Pasangan yang rasionya di bawah ambang. */
  issues: ContrastIssue[];
}

export function isHexLike(value: unknown): value is string {
  return typeof value === 'string' && /^#?([a-f\d]{6}|[a-f\d]{3})$/i.test(value.trim());
}

export function normHex(value: string): string {
  const v = value.trim();
  const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(v);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase();
  return v.startsWith('#') ? v.toLowerCase() : `#${v.toLowerCase()}`;
}

/** Rasio fg di atas bg; null bila salah satunya bukan warna solid. */
function measureRatio(
  fgHex: string,
  bgHex: string,
  palette: DesignStylePalette,
): number | null {
  const eff = fgForBg(fgHex, palette, bgHex);
  if (!eff || !isHexLike(eff)) return null;
  return getContrastRatio(eff, normHex(bgHex));
}

/**
 * Cari warna foreground yang paling terbaca di atas `bg` sampai ambang
 * terpenuhi. Memakai ulang `autoFixTextColor` (sudah teruji, selalu
 * konvergen ke putih/hitam terbaik) alih-alih menulis algoritma kedua.
 *
 * `isLarge` diteruskan ke helper karena itu yang menentukan ambang di sana;
 * ambang eksplisit kita tetap menang lewat pengecekan ulang di bawah.
 */
function ensureRatio(
  fgHex: string,
  bgHex: string,
  minRatio: number,
  palette: DesignStylePalette,
): { color: string; ratio: number; fixedRatio: number; neededFix: boolean } {
  const bg: EffectiveBackground = { kind: 'solid', hex: normHex(bgHex) };
  const current = measureRatio(fgHex, bgHex, palette);
  if (current !== null && current >= minRatio) {
    return { color: fgHex, ratio: current, fixedRatio: current, neededFix: false };
  }
  const isLarge = minRatio <= MIN_CONTRAST_LARGE_TEXT && minRatio < MIN_CONTRAST_NORMAL_TEXT;
  const fixed = autoFixTextColor(fgHex, bg, isLarge, palette);
  return {
    color: fixed,
    // `ratio` = rasio SEBELUM koreksi (itu yang ingin dilihat user),
    // `fixedRatio` = sesudahnya (bukti koreksinya berhasil).
    ratio: current ?? 0,
    fixedRatio: measureRatio(fixed, bgHex, palette) ?? 0,
    neededFix: true,
  };
}

/**
 * Kandidat sisi foreground & background untuk matriks kontras.
 *
 * Sengaja TIDAK semua kunci palet: `border` tidak pernah jadi isian teks,
 * dan `background` tidak pernah jadi warna tulisan. Matriks 5×5 sudah
 * menutup semua kombinasi yang realistis dipakai template.
 */
export const CONTRAST_FG_KEYS = [
  'primary', 'secondary', 'accent', 'text', 'textMuted',
] as const satisfies readonly ContrastPaletteKey[];

export const CONTRAST_BG_KEYS = [
  'primary', 'secondary', 'accent', 'background', 'surface',
] as const satisfies readonly ContrastPaletteKey[];

/** Pola token turunan: `--color-<fg>-on-<bg>`. */
export const DERIVED_TOKEN_RE = /^--color-([a-z]+)-on-([a-z]+)$/;

/** True bila `name` adalah token hasil matriks. */
export function isDerivedContrastToken(name: string): boolean {
  return DERIVED_TOKEN_RE.test(name);
}

/**
 * MATRIKS KONTRAS — inti pendekatan "pilih token, jangan pilih warna".
 *
 * Untuk setiap kombinasi fg × bg, hasilkan satu token yang **pasti** aman di
 * atas bg itu. Template lalu menulis `var(--color-accent-on-primary)` dan tak
 * pernah bisa salah pilih, di skema warna mana pun.
 *
 * Kenapa wajib, bukan opsional: sebelumnya template menulis
 * `color: var(--color-accent)` di atas `background: var(--color-primary)`.
 * Itu aman di palet bawaan template (emas 5.15:1 di hijau tua) tapi hancur
 * begitu user memilih skema lain — di `emerald-fresh` rasionya 1.32:1.
 * Guard yang menguji palet template sendiri tidak akan pernah menangkapnya;
 * hanya pengujian lintas skema yang bisa.
 *
 * Nilai token: warna asli bila sudah lolos ambang, warna terkoreksi bila
 * belum. Karena itu identitas visual (emas di latar yang memang mendukung)
 * tetap terjaga, dan hanya berubah di latar yang memang tak sempat.
 */
export function buildContrastMatrix(
  palette: DesignStylePalette,
  contract?: ContrastContract | null,
): Record<string, string> {
  const out: Record<string, string> = {};

  for (const fg of CONTRAST_FG_KEYS) {
    for (const bg of CONTRAST_BG_KEYS) {
      const fgHex = palette[fg];
      const bgHex = palette[bg];
      if (!isHexLike(fgHex) || !isHexLike(bgHex)) continue;
      const { color } = ensureRatio(fgHex, bgHex, MIN_CONTRAST_NORMAL_TEXT, palette);
      out[`--color-${fg}-on-${bg}`] = color;
    }
  }

  // Token "teks di atas latar" untuk SETIAP warna solid di palet. Secara
  // matematis selalu ≥ 4.5:1 (putih atau hitam, salah satunya menang), jadi
  // tidak pernah butuh koreksi.
  Object.assign(out, buildOnColorTokens(palette));

  // Kontrak boleh MENURUNKAN ambang untuk pasangan non-teks tertentu
  // (mis. garis dekoratif 3:1). Nilai matrix default 4.5:1 di sini.
  for (const pair of contract?.pairs ?? []) {
    if (typeof pair.fg === 'string' && pair.fg.startsWith('on-')) continue;
    const fgHex = resolveContrastToken(pair.fg, palette);
    const bgHex = resolveContrastToken(pair.bg, palette);
    if (!fgHex || !bgHex) continue;
    const { color } = ensureRatio(fgHex, bgHex, minRatioForPair(pair), palette);
    out[contrastTokenName(pair)] = color;
  }

  return out;
}

/**
 * Bangun token kontras dari palet + kontrak.
 *
 * Nilai token diambil dari matriks (lengkap untuk semua kombinasi), sedangkan
 * `issues` hanya melaporkan pasangan yang benar-benar dideklarasikan template
 * dan rasionya di bawah ambang — supaya author tahu bagian mana yang perlu
 * disimak, bukan semua 25 kombinasi.
 */
export function resolveContrastTokens(
  palette: DesignStylePalette,
  contract: ContrastContract | null | undefined,
): ResolvedContrast {
  const tokens = buildContrastMatrix(palette, contract);
  const issues: ContrastIssue[] = [];
  if (!contract || !Array.isArray(contract.pairs)) return { tokens, issues };

  for (const pair of contract.pairs) {
    const fgRaw = resolveContrastToken(pair.fg, palette);
    const bgRaw = resolveContrastToken(pair.bg, palette);
    if (!fgRaw || !bgRaw) continue;

    const min = minRatioForPair(pair);
    const { color, ratio, fixedRatio, neededFix } = ensureRatio(fgRaw, bgRaw, min, palette);
    if (!neededFix) continue;

    issues.push({
      fg: pair.fg,
      bg: pair.bg,
      fgHex: fgRaw,
      bgHex: bgRaw,
      ratio: Math.round(ratio * 100) / 100,
      minRatio: min,
      fixedRatio: Math.round(fixedRatio * 100) / 100,
      fixed: normHex(color),
      note: pair.note,
    });

    // Token fg-only boleh dikoreksi in-place (override token aslinya) HANYA
    // bila satu nilai global itu masih aman di seluruh konteksnya — lihat
    // `globalFgCorrectionSafe`. Kalau tidak, koreksinya disalurkan lewat token
    // turunan yang sudah dibuat `buildContrastMatrix`, dan `--color-<fg>`
    // tetap seperti palet supaya teks di latar lain tidak ikut tertimpa.
    if (isInPlaceFixable(pair.fg) && globalFgCorrectionSafe(pair.fg, color, palette, contract)) {
      tokens[`--color-${pair.fg}`] = color;
    }
  }

  return { tokens, issues };
}

/**
 * Token "teks di atas latar" untuk setiap warna solid di palet.
 *
 * Dipakai template yang butuh foreground yang mengikuti background-nya
 * sendiri (mis. lencana di dalam tombol) — seperti `brandMark()`.
 */
export function buildOnColorTokens(palette: DesignStylePalette): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const key of Object.keys(palette) as ContrastPaletteKey[]) {
    const hex = palette[key];
    if (!isHexLike(hex)) continue;
    tokens[onColorTokenName(key)] = getOnColor(normHex(hex));
  }
  return tokens;
}

/** Validasi kontrak tanpa koreksi — untuk laporan/test. */
export function validateContrastContract(
  palette: DesignStylePalette,
  contract: ContrastContract | null | undefined,
): ContrastIssue[] {
  return resolveContrastTokens(palette, contract).issues;
}

export interface ContrastViolation {
  fg: string;
  bg: string;
  ratio: number;
  minRatio: number;
  note: string;
}

/**
 * Cari pasangan fg/bg di HTML yang rasionya di bawah ambang, setelah token
 * turunan diterjemahkan ke warna efektifnya.
 *
 * Fungsi inilah yang SEHARUSNYA dipakai untuk menguji template: ia
 * mengukur HTML yang benar-benar dirender, bukan menebak dari palet. Dan
 * karena menerima palet sembarang, pemanggil bisa mengulangnya untuk semua
 * skema warna — pengujian hanya pada palet bawaan template tidak akan pernah
 * menangkap template yang rapi di kampungnya tapi hancur di skema lain.
 */
export function findContrastViolations(
  html: string,
  palette: DesignStylePalette,
  contract?: ContrastContract | null,
): ContrastViolation[] {
  if (typeof html !== 'string' || !html) return [];
  const tokens = buildContrastMatrix(palette, contract);
  /** Warna efektif untuk satu token (atau pasangan fg/bg). */
  const effective = (token: string, pairBg?: string): string | undefined => {
    // Pasangan turunan menang: inilah inti keamanannya. Template menulis
    // `var(--color-accent-on-primary)`; nilainya harus diambil dari matriks,
    // BUKAN dari `palette.accent` mentah — kalau yang terakhir, pemeriksaan
    // ini hanya mengulang kesalahan yang membuat sistem ini ada.
    if (pairBg) {
      const derived = tokens[`--color-${token}-on-${pairBg}`];
      if (derived) return derived;
    }
    if (tokens[token]) return tokens[token];
    if (token.startsWith('on-')) {
      const base = palette[token.slice(3) as ContrastPaletteKey];
      return isHexLike(base) ? getOnColor(normHex(base)) : undefined;
    }
    const hex = palette[token as ContrastPaletteKey];
    return isHexLike(hex) ? normHex(hex) : undefined;
  };

  const violations: ContrastViolation[] = [];
  for (const pair of scanHtmlContrastPairs(html, { color: ROOT_RENDER_COLOR })) {
    if (!pair.bg || pair.unresolved) continue;
    const fgHex = effective(pair.fg, pair.bg);
    const bgHex = effective(pair.bg);
    if (!fgHex || !bgHex) continue;
    const ratio = getContrastRatio(fgHex, bgHex);
    // Ambang: pakai yang dideklarasikan kalau ada, default teks normal.
    const declared = contract?.pairs.find(
      (p) => resolveContrastToken(p.fg, palette) === fgHex &&
             resolveContrastToken(p.bg, palette) === bgHex,
    );
    const min = declared ? minRatioForPair(declared) : MIN_CONTRAST_NORMAL_TEXT;
    if (ratio >= min) continue;
    violations.push({
      fg: pair.fg,
      bg: pair.bg,
      ratio: Math.round(ratio * 100) / 100,
      minRatio: min,
      note: pair.note,
    });
  }
  return violations;
}

/**
 * Terapkan kontrak ke palet: kembalikan palet yang SUDAH aman.
 *
 * Dipakai color scheme — preset palet tetap apa adanya, tapi yang disimpan
 * ke `palette_override` adalah hasil normalisasi, bukan input mentah.
 *
 * Aturan: token fg-only dikoreksi in-place (aman). Token dual-role tidak
 * pernah diubah di sini — koreksinya hidup sebagai token turunan saat render.
 */
export function normalizePaletteForContract(
  palette: DesignStylePalette,
  contract: ContrastContract | null | undefined,
): DesignStylePalette {
  const out: DesignStylePalette = { ...palette };
  if (!contract || !Array.isArray(contract.pairs)) return out;
  for (const pair of contract.pairs) {
    // Hanya kunci palet fg-only yang boleh diubah in-place. Token `on-*`
    // diturunkan dari palet lain, jadi "memperbaikinya" di sini justru
    // berbohong — koreksinya tetap diurus sebagai token turunan saat render.
    if (!isInPlaceFixable(pair.fg)) continue;
    const fgRaw = resolveContrastToken(pair.fg, out);
    const bgRaw = resolveContrastToken(pair.bg, out);
    if (!fgRaw || !bgRaw) continue;
    const min = minRatioForPair(pair);
    // `neededFix` (bukan `ratio < min`) yang menentukan: `ensureRatio`
    // mengembalikan rasio SETELAH koreksi, jadi membandingkannya lagi
    // dengan ambang selalu benar dan koreksinya takkan pernah dipasang.
    const { color, neededFix } = ensureRatio(fgRaw, bgRaw, min, out);
    if (neededFix && globalFgCorrectionSafe(pair.fg, color, out, contract)) {
      out[pair.fg as ContrastPaletteKey] = color;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Audit HTML — WARNING, tidak pernah memblokir (§19)                   */
/* ------------------------------------------------------------------ */

export interface DerivedPair {
  fg: string;
  bg: string;
  /** true bila `fg` terjadi tanpa background yang bisa dipastikan. */
  unresolved: boolean;
  note: string;
}

const VAR_RE = /var\(\s*--color-([a-z-]+)/;

/** Ambil nama kunci palet dari nilai CSS seperti `var(--color-accent)`. */
function colorVarKey(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const m = VAR_RE.exec(value);
  return m ? m[1] : undefined;
}

/**
 * Pecah nama token jadi pasangan fg/bg.
 *
 * `--color-accent-on-primary` berarti "aksen DI ATAS primary" — jadi token itu
 * membawa informasi background-nya. Tanpa pemecahan ini, audit akan menganggap
 * foreground-nya bernama `accent-on-primary` dan tidak akan pernah cocok dengan
 * pasangan `accent/primary` yang dideklarasikan template.
 */
function splitPairToken(key: string | undefined): { fg: string; bg?: string } | null {
  if (!key) return null;
  const m = /^([a-z]+)-on-([a-z]+)$/.exec(key);
  if (m) return { fg: m[1], bg: m[2] };
  return { fg: key };
}

/**
 * Warna yang disetel root render — `renderer-v3` memakai `color: palette.text`.
 *
 * Dipakai sebagai fallback WARISAN saja. Sengaja tidak ada pasangan
 * `background` di sini: latar yang tak terdeteksi wajib tetap dilaporkan
 * `unresolved`, bukan ditebak dari root.
 */
export const ROOT_RENDER_COLOR = 'text';

/**
 * Nama token CSS → kunci kontrak palet.
 *
 * Scanner membaca `var(--color-text-muted)` sehingga menghasilkan
 * `text-muted`, sedangkan `contrast.pairs` ditulis dengan kunci palet
 * camelCase (`textMuted`). Tanpa penerjemahan ini pasangan yang sama dianggap
 * "belum dideklarasikan". Perbedaan itu dulu tak pernah ketahuan karena
 * background-nya ikut kosong, jadi pasangan dilewati sebelum sampai ke
 * pemeriksaan deklarasi — celah yang baru terbuka setelah `bgFrames` diperbaiki.
 */
function contractKey(token: string): string {
  if (token.startsWith('on-')) return token;
  return token.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
}

/**
 * Ambil pasangan `color: var(--color-X)` + background terdekat dari HTML varian.
 *
 * SANGAT sengaja sederhana, bukan parser sungguhan: alat audit, bukan sumber
 * kebenaran. Yang tak bisa dibaca (opacity, color-mix, warisan `inherit` dari
 * luar cuplikan) ditandai `unresolved` supaya author tahu di mana harus melihat
 * sendiri. Hasilnya tidak pernah menggagalkan build.
 *
 * `root.color` adalah warna yang disetel root render (lihat `renderer-v3`:
 * `color: palette.text`). Tanpa ini, teks yang TIDAK punya `color:` sendiri —
 * termasuk icon/glyph yang mewarisi dari induk — tidak pernah menghasilkan
 * pasangan sama sekali, jadi kontrasnya tak pernah diukur di skema mana pun.
 * `root` sengaja TIDAK membawa background: latar yang tak terdeteksi tetap
 * harus dilaporkan sebagai `unresolved`, bukan ditebak.
 */
export function scanHtmlContrastPairs(
  html: string,
  root?: { color?: string },
): DerivedPair[] {
  if (typeof html !== 'string' || !html) return [];
  const out: DerivedPair[] = [];
  const seen = new Set<string>();

  // SATU FRAME PER ELEMEN, bukan per latar. Versi lama mem-push HANYA bila ada
  // `background:` tapi mem-pop di SEMUA `</tag>` — termasuk tag yang tak pernah
  // push. Tumpukan lalu terkuras lebih cepat daripada terisi, latar leluhur
  // hilang, pasangan jadi `unresolved`, dan `findContrastViolations`
  // melewatinya diam-diam (`if (!pair.bg || pair.unresolved) continue`).
  const bgFrames: Array<string | undefined> = [];
  const colorFrames: Array<string | undefined> = [];
  // Elemen void tak pernah ditutup → tak boleh mendorong frame, atau tumpukan
  // akan melorot setelah tag lain ditutup.
  const VOID_TAGS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
  ]);

  const nearest = (stack: Array<string | undefined>): string | undefined => {
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i]) return stack[i];
    return undefined;
  };

  const emit = (fgRaw: string, bg: string | undefined, style?: string): void => {
    const parsed = splitPairToken(fgRaw);
    if (!parsed) return;
    // Token turunan membawa background-nya sendiri dan itu yang BENAR — lebih
    // kuat daripada latar leluhur yang mungkin tak terdeteksi.
    const effBg = parsed.bg ?? bg;
    const notes: string[] = [];
    if (!effBg) notes.push('background tidak terdeteksi (kemungkinan di luar cuplikan / diwarisi)');
    if (style && /opacity\s*:\s*0?\.\d+/.test(style)) notes.push('memakai opacity — rasio efektif berbeda');
    if (style && style.includes('color-mix(')) notes.push('memakai color-mix() — tidak bisa dihitung');
    const key = `${parsed.fg}|${effBg ?? '?'}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ fg: parsed.fg, bg: effBg ?? '', unresolved: !effBg || notes.length > 0, note: notes.join('; ') });
  };

  /**
   * Teks node: elemen pembungkus teks sering TIDAK menyetel `color:` karena
   * mengandalkan warisan — inilah kasus icon yang selama ini luput diukur.
   * `seen` menjaga output tetap sebesar jumlah kombinasi fg/bg unik.
   */
  const handleText = (text: string): void => {
    if (!text.trim()) return;
    const inherited = nearest(colorFrames) ?? root?.color;
    if (inherited) emit(inherited, nearest(bgFrames));
  };

  for (const chunk of html.split(/(?=<)/)) {
    if (!chunk.startsWith('<')) {
      handleText(chunk);
      continue;
    }

    // `split(/(?=<)/)` memotong SEBELUM `<`, jadi tag DAN teksnya selalu
    // berada di chunk yang sama (`<div style="…">📍`). Teks karena itu diambil
    // dari sisa chunk sesudah `>`, bukan mengharapkannya sebagai chunk
    // terpisah — mengharapkan itu membuat cabang teks tak pernah terpanggil.
    const gt = chunk.indexOf('>');
    const tagHtml = gt >= 0 ? chunk.slice(0, gt + 1) : chunk;
    const rest = gt >= 0 ? chunk.slice(gt + 1) : '';

    if (tagHtml.startsWith('</')) {
      bgFrames.pop();
      colorFrames.pop();
      // Sisa sesudah tag penutup milik induk — frame sudah di-pop lebih dulu.
      handleText(rest);
      continue;
    }

    const tag = /^<([a-z][\w-]*)/i.exec(tagHtml)?.[1]?.toLowerCase();
    const style = (/style="([^"]*)"/.exec(tagHtml) ?? [])[1];
    const bgVar = colorVarKey((/background(?:-color)?\s*:\s*([^;"]+)/.exec(style ?? '') ?? [])[1]);
    const fgRaw = colorVarKey((/(?:^|[;"\s])color\s*:\s*([^;"]+)/.exec(style ?? '') ?? [])[1]);

    if (!tag || VOID_TAGS.has(tag) || /\/>$/.test(tagHtml)) {
      if (fgRaw) emit(fgRaw, bgVar ?? nearest(bgFrames), style);
      handleText(rest);
      continue;
    }

    bgFrames.push(bgVar);
    colorFrames.push(fgRaw);
    if (fgRaw) emit(fgRaw, nearest(bgFrames), style);
    handleText(rest);
  }

  return out;
}

/**
 * Bandingkan pasangan hasil scan dengan kontrak yang dideklarasikan.
 *
 * Selalu mengembalikan WARNING — tidak pernah melempar. Ini keputusan sadar:
 * parser HTML-inline tidak akan pernah sempurna, dan memblokir author karena
 * keterbatasan alat akan mendorong mereka mematikan guard-nya.
 */
export function auditContrastCoverage(
  html: string,
  contract: ContrastContract | null | undefined,
): string[] {
  const warnings: string[] = [];
  const declared = new Set((contract?.pairs ?? []).map((p) => `${p.fg}|${p.bg}`));
  const derived = scanHtmlContrastPairs(html, { color: ROOT_RENDER_COLOR });

  for (const d of derived) {
    if (!d.bg || d.unresolved) continue;
    // Token `on-*` dijamin aman oleh `getOnColor` (putih atau hitam, yang
    // menang selalu ≥ 4.5:1). Menuntut deklarasi untuknya hanya menambah
    // kebisingan tanpa menambah jaminan apa pun.
    if (d.fg.startsWith('on-')) continue;
    if (!declared.has(`${contractKey(d.fg)}|${contractKey(d.bg)}`)) {
      warnings.push(
        `pairs(${d.fg} di atas ${d.bg}) muncul di HTML tapi belum ada di contrast.pairs — kontrasnya tidak dijamin`,
      );
    }
  }
  for (const d of derived) {
    if (!d.unresolved || !d.note) continue;
    warnings.push(`pairs(${d.fg}): ${d.note} — periksa manual, scanner tidak bisa menghitung`);
  }
  return warnings;
}

export { MIN_CONTRAST_NORMAL_TEXT, MIN_CONTRAST_LARGE_TEXT };


