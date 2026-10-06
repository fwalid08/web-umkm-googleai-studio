import { describe, expect, it } from 'vitest';
import {
  CONTRAST_BG_KEYS,
  CONTRAST_FG_KEYS,
  MIN_CONTRAST_BY_ROLE,
  auditContrastCoverage,
  buildContrastMatrix,
  buildOnColorTokens,
  contrastTokenName,
  findContrastViolations,
  isInPlaceFixable,
  minRatioForPair,
  normalizePaletteForContract,
  resolveContrastToken,
  resolveContrastTokens,
  scanHtmlContrastPairs,
  validateContrastContract,
  ROOT_RENDER_COLOR,
  type ContrastContract,
} from './contrast-contract';
import { renderVariantHtml } from './behaviour-script';
import { getContrastRatio } from './design-styles';
import { mergeSchemePalette } from './color-schemes';
import { getCatalogTemplate } from './templates/catalog';

/** Palet laundry-emerald asli (lihat templates/laundry-emerald.ts). */
const EMERALD = {
  primary: '#0C3B2E',
  secondary: '#1E4D3B',
  accent: '#C6A15B',
  background: '#F5F1E8',
  surface: '#FDFBF6',
  text: '#1E2A26',
  textMuted: '#4E5E57',
  border: '#E5DCC8',
};

describe('kontrak kontras — ambang per peran', () => {
  it('body/muted 4.5, heading/non-text 3 (WCAG large text)', () => {
    expect(MIN_CONTRAST_BY_ROLE.body).toBe(4.5);
    expect(MIN_CONTRAST_BY_ROLE.muted).toBe(4.5);
    expect(MIN_CONTRAST_BY_ROLE.heading).toBe(3);
    expect(MIN_CONTRAST_BY_ROLE['non-text']).toBe(3);
  });
});

describe('resolveContrastTokens — koreksi per pasangan, bukan per token', () => {
  it('matriks menutup SEMUA kombinasi fg × bg', () => {
    // Pelanggan asli: `accent` dipakai sebagai teks di atas `primary` sekaligus
    // sebagai latar tombol. Dua arah itu harus dua token terpisah.
    const tokens = buildContrastMatrix(EMERALD, null);
    for (const fg of CONTRAST_FG_KEYS) {
      for (const bg of CONTRAST_BG_KEYS) {
        const name = `--color-${fg}-on-${bg}`;
        expect(tokens[name], `token ${name} tidak ada`).toBeTruthy();
        expect(
          getContrastRatio(tokens[name], EMERALD[bg]),
          `${name} = ${getContrastRatio(tokens[name], EMERALD[bg]).toFixed(2)}:1 di bawah 4.5`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('regresi hdr-floating: teks di atas accent tidak pernah gagal', () => {
    // Kasus nyata: brandMark("var(--color-accent)", "var(--color-on-primary)").
    // Lencana berlatar emas #C6A15B, teks = putih (dihitung dari primary
    // hijau tua) → hanya ~2.3:1, jauh di bawah 4.5.
    expect(getContrastRatio('#ffffff', EMERALD.accent)).toBeLessThan(4.5);

    const contract: ContrastContract = {
      pairs: [{ fg: 'on-primary', bg: 'accent', role: 'body', note: 'lencana emas' }],
    };
    const { issues } = resolveContrastTokens(EMERALD, contract);
    expect(issues).toHaveLength(1);
    expect(issues[0].fixedRatio).toBeGreaterThanOrEqual(4.5);
    // Akar masalah: `primary` tak boleh ikut berubah (masih jadi background).
    const tokens = resolveContrastTokens(EMERALD, contract).tokens;
    expect(tokens['--color-primary']).toBeUndefined();
  });

  it('token on-* dijamin aman tanpa perlu dideklarasikan', () => {
    // `getOnColor` selalu memilih putih atau hitam yang menang → secara
    // matematis ≥ 4.5:1 untuk setiap warna sRGB. Jadi `on-*` tidak perlu
    // masuk kontrak sama sekali.
    const tokens = buildContrastMatrix(EMERALD, null);
    expect(getContrastRatio(tokens['--color-on-accent'], EMERALD.accent))
      .toBeGreaterThanOrEqual(4.5);
  });

  it('token dual-role TIDAK pernah dimutasi — hanya token turunan', () => {
    const contract: ContrastContract = {
      pairs: [{ fg: 'accent', bg: 'primary', role: 'body' }],
    };
    const { tokens } = resolveContrastTokens(EMERALD, contract);
    // `accent` tidak boleh ikut berubah walau rasionya gagal.
    expect(tokens['--color-accent']).toBeUndefined();
    expect(tokens['--color-accent-on-primary']).toBeTruthy();
    expect(getContrastRatio(tokens['--color-accent-on-primary'], EMERALD.primary))
      .toBeGreaterThanOrEqual(4.5);
  });

  it('token turunan ditulis SELALU, bukan hanya saat rasio gagal', () => {
    // Ini yang menjaga `var(--color-accent-on-surface)` tetap terdefinisi
    // setelah user ganti ke skema yang kontrasnya sebenarnya sudah cukup —
    // kalau tokennya ikut hilang, teks jatuh ke warna warisan tanpa error.
    const contract: ContrastContract = {
      pairs: [{ fg: 'accent', bg: 'primary', role: 'body' }],
    };
    const { tokens, issues } = resolveContrastTokens(EMERALD, contract);
    expect(issues, 'pasangan ini sebenarnya lolos ambang').toEqual([]);
    expect(tokens['--color-accent-on-primary'], 'token harus tetap ditulis').toBeTruthy();
  });

  it('token fg-only dikoreksi in-place (aman: tak pernah jadi background)', () => {
    // Palet patahan: text terang di atas background terang.
    const broken = { ...EMERALD, text: '#F5F1E8', background: '#FFFFFF' };
    const contract: ContrastContract = {
      pairs: [{ fg: 'text', bg: 'background', role: 'body' }],
    };
    const { tokens, issues } = resolveContrastTokens(broken, contract);
    expect(issues).toHaveLength(1);
    expect(tokens['--color-text']).toBeTruthy();
    expect(tokens['--color-text']).not.toBe(broken.text);
    expect(getContrastRatio(tokens['--color-text'], broken.background)).toBeGreaterThanOrEqual(4.5);
  });

  it('pasangan yang sudah aman tidak dilaporkan sebagai issue', () => {
    const contract: ContrastContract = {
      pairs: [{ fg: 'text', bg: 'background', role: 'body' }],
    };
    const { issues } = resolveContrastTokens(EMERALD, contract);
    expect(issues).toEqual([]);
  });

  it('minRatio eksplisit menang atas role', () => {
    // Emerald text/background ~13:1, jadi ambang 4.5 lolos — paksa 18:1
    // supaya benar-benar diuji bahwa angka eksplisit yang dipakai.
    const contract: ContrastContract = {
      pairs: [{ fg: 'text', bg: 'background', role: 'heading', minRatio: 18 }],
    };
    const issues = validateContrastContract(EMERALD, contract);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].minRatio).toBe(18);
    // Role `heading` sendiri (3:1) jelas akan lolos — jadi pembuktiannya
    // benar-benar berasal dari minRatio, bukan dari role.
    expect(validateContrastContract(EMERALD, {
      pairs: [{ fg: 'text', bg: 'background', role: 'heading' }],
    })).toEqual([]);
  });

  it('kontrak kosong / null aman (template lama tanpa kontrak)', () => {
    for (const c of [null, undefined, { pairs: [] }]) {
      const { issues } = resolveContrastTokens(EMERALD, c);
      expect(issues).toEqual([]);
      // Token matriks tetap tersedia — inilah yang membuat template tanpa
      // kontrak pun aman, tanpa perlu deklarasi apa pun.
      expect(Object.keys(resolveContrastTokens(EMERALD, c).tokens).length).toBeGreaterThan(0);
    }
  });

  it('nama token kustom dipakai apa adanya', () => {
    const contract: ContrastContract = {
      pairs: [{ fg: 'primary', bg: 'accent', role: 'body', token: '--color-cta-fg' }],
    };
    expect(resolveContrastTokens(EMERALD, contract).tokens['--color-cta-fg']).toBeTruthy();
    expect(contrastTokenName(contract.pairs[0])).toBe('--color-cta-fg');
  });
});

describe('buildOnColorTokens', () => {
  it('on-color selalu ≥ 4.5 untuk setiap warna solid (putih atau hitam menang)', () => {
    const tokens = buildOnColorTokens(EMERALD);
    for (const key of Object.keys(EMERALD) as (keyof typeof EMERALD)[]) {
      const tok = tokens[`--color-on-${key}`];
      expect(tok, `token on-${key} hilang`).toBeTruthy();
      expect(getContrastRatio(tok, EMERALD[key]), `on-${key} kontrasnya < 4.5`)
        .toBeGreaterThanOrEqual(4.5);
    }
  });

  it('menutup kasus brandMark: teks di atas accent selalu terbaca', () => {
    const tokens = buildOnColorTokens(EMERALD);
    expect(getContrastRatio(tokens['--color-on-accent'], EMERALD.accent))
      .toBeGreaterThanOrEqual(4.5);
  });
});

describe('normalizePaletteForContract (dipakai color scheme)', () => {
  it('memperbaiki hanya token fg-only; dual-role dibiarkan', () => {
    const broken = { ...EMERALD, text: '#F5F1E8' };
    const contract: ContrastContract = {
      pairs: [
        { fg: 'text', bg: 'background', role: 'body' },
        { fg: 'primary', bg: 'accent', role: 'body' },
      ],
    };
    const out = normalizePaletteForContract(broken, contract);
    expect(out.text).not.toBe(broken.text);
    expect(getContrastRatio(out.text, out.background)).toBeGreaterThanOrEqual(4.5);
    // dual-role tidak boleh disentuh di sini (koreksinya jadi token turunan).
    expect(out.primary).toBe(broken.primary);
    expect(out.accent).toBe(broken.accent);
  });

  it('palet lama tanpa kontrak tidak berubah sama sekali', () => {
    expect(normalizePaletteForContract(EMERALD, null)).toEqual(EMERALD);
  });
});

describe('scanner HTML — alat audit, tidak pernah memblokir', () => {
  const html = `
    <header style="background:var(--color-surface);">
      <span style="color:var(--color-accent);">Tagline</span>
      <div style="background:var(--color-primary);color:var(--color-on-primary);">CTA</div>
    </header>
  `;

  it('menemukan pasangan fg/bg yang ada di HTML', () => {
    const pairs = scanHtmlContrastPairs(html);
    expect(pairs.map((p) => `${p.fg}|${p.bg}`)).toContain('accent|surface');
  });

  it('pasangan tanpa background ditandai unresolved', () => {
    const pairs = scanHtmlContrastPairs('<span style="color:var(--color-accent);">x</span>');
    expect(pairs).toHaveLength(1);
    expect(pairs[0].unresolved).toBe(true);
    expect(pairs[0].note).toContain('background tidak terdeteksi');
  });

  it('menandai opacity sebagai "periksa manual", bukan error', () => {
    const pairs = scanHtmlContrastPairs(
      '<div style="background:var(--color-primary);"><span style="color:var(--color-text);opacity:0.85;">x</span></div>',
    );
    expect(pairs.some((p) => p.note.includes('opacity'))).toBe(true);
  });

  it('audit: pasangan ada di HTML tapi tak dideklarasikan → warning', () => {
    const warnings = auditContrastCoverage(html, { pairs: [] });
    expect(warnings.some((w) => w.includes('belum ada di contrast.pairs'))).toBe(true);
  });

  it('audit: deklarasi lengkap → tanpa warning "belum ada"', () => {
    const warnings = auditContrastCoverage(html, {
      pairs: [
        { fg: 'accent', bg: 'surface', role: 'body' },
        { fg: 'on-primary', bg: 'primary', role: 'body' },
      ],
    });
    expect(warnings.filter((w) => w.includes('belum ada'))).toEqual([]);
  });

  it('audit tidak pernah melempar untuk input rusak', () => {
    expect(() => auditContrastCoverage('', null)).not.toThrow();
    expect(auditContrastCoverage('', null)).toEqual([]);
    expect(scanHtmlContrastPairs(undefined as unknown as string)).toEqual([]);
  });
});

describe('kontrak bawaan laundry-emerald', () => {
  const tpl = getCatalogTemplate('laundry-emerald');

  it('template punya kontrak kontras yang terisi', () => {
    expect(tpl, 'laundry-emerald tidak ada di katalog').toBeDefined();
    expect(tpl!.contrast, 'laundry-emerald belum punya kontrak kontras').toBeDefined();
    expect(tpl!.contrast!.pairs.length).toBeGreaterThan(0);
  });

  it('setiap pasangan kontrak TERPENUHI setelah token turunan dipakai', () => {
    // Invariant yang benar bukan "semua pair sudah aman" — template sah
    // boleh punya pasangan yang gagal, itu justru yang dikoreksi sistem.
    // Yang wajib benar: SESUDAH token pasangan dipakai (nilai matriks),
    // tiap pasangan sudah mencapai ambangnya.
    const { tokens } = resolveContrastTokens(tpl!.theme.palette, tpl!.contrast);
    const palette = tpl!.theme.palette;
    const offenders: string[] = [];
    for (const pair of tpl!.contrast!.pairs) {
      const bg = resolveContrastToken(pair.bg, palette)!;
      const min = minRatioForPair(pair);
      // Matriks selalu menyediakan nilai untuk pasangan fg/bg. Fallback ke
      // warna mentah hanya untuk pasangan yang tak ada di matriks (mis.
      // `on-*`, yang memang dijamin oleh getOnColor).
      const fg = tokens[`--color-${pair.fg}-on-${pair.bg}`]
        ?? resolveContrastToken(pair.fg, palette)!;
      const ratio = getContrastRatio(fg, bg);
      if (ratio < min) offenders.push(`${pair.fg}/${pair.bg} = ${ratio.toFixed(2)} < ${min}`);
    }
    expect(offenders, `pasangan belum terpenuhi:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('emas di atas krem memang gagal lalu dikoreksi oleh sistem', () => {
    // Motivasi seluruh kontrak: `accent` #C6A15B di atas krem #FDFBF6 cuma
    // ~2.3:1. Tagline header karena itu memakai token turunan.
    const issue = validateContrastContract(tpl!.theme.palette, tpl!.contrast)
      .find((i) => i.fg === 'accent' && i.bg === 'surface');
    expect(issue, 'pairs accent/surface tidak dilaporkan').toBeDefined();
    expect(issue!.ratio).toBeLessThan(4.5);
    expect(issue!.fixedRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('deklarasi mencakup pasangan accent/primary & primary/accent yang berisiko', () => {
    const keys = tpl!.contrast!.pairs.map((p) => `${p.fg}/${p.bg}`);
    expect(keys).toContain('accent/primary');
    expect(keys).toContain('primary/accent');
  });

  it('SEMUA variannya lolos audit coverage tanpa pasangan tak terdaftar', () => {
    const warnings: string[] = [];
    for (const h of tpl!.headers) warnings.push(...auditContrastCoverage(h.html ?? '', tpl!.contrast));
    for (const f of tpl!.footers) warnings.push(...auditContrastCoverage(f.html ?? '', tpl!.contrast));
    for (const s of tpl!.sections) {
      for (const v of s.variants) {
        warnings.push(...auditContrastCoverage((v as { html?: string }).html ?? '', tpl!.contrast));
      }
    }
    const missing = warnings.filter((w) => w.includes('belum ada di contrast.pairs'));
    expect(missing, `pasangan tak terdaftar:\n${[...new Set(missing)].join('\n')}`).toEqual([]);
  });
});

/**
 * GUARD LINTAS SKEMA — regresi yang nyata terjadi.
 *
 * Template emerald tampil benar di palet default-nya (emas 5.15:1 di hijau
 * tua) tapi hancur begitu user memilih skema `emerald-fresh`: aksen jadi hijau
 * muda di atas hijau terang → 1.32:1, badge nyaris tak terlihat dan tombol
 * "Pesan Sekarang" pucat. Guard lama tidak menangkapnya karena hanya
 * mengukur palet template sendiri.
 *
 * Guard ini mengulangi pengukuran itu untuk SETIAP skema warna.
 */
describe('kontras laundry-emerald di SEMUA skema warna', () => {
  const tpl = getCatalogTemplate('laundry-emerald')!;
  // Gunakan skema warna dari template laundry-emerald sendiri, bukan global
  const schemes = tpl.colorSchemes;

  function allHtml(): Array<{ label: string; html: string }> {
    const out: Array<{ label: string; html: string }> = [];
    for (const h of tpl.headers) out.push({ label: `header/${h.id}`, html: h.html ?? '' });
    for (const f of tpl.footers) out.push({ label: `footer/${f.id}`, html: f.html ?? '' });
    for (const s of tpl.sections) {
      for (const v of s.variants) {
        out.push({ label: `${s.type}/${v.id}`, html: (v as { html?: string }).html ?? '' });
      }
    }
    return out;
  }

  it('tidak ada pasangan di bawah 4.5:1 pada skema APAPUN', () => {
    const failures: string[] = [];
    for (const scheme of schemes) {
      const palette = mergeSchemePalette(scheme, tpl.theme.palette);
      for (const { label, html } of allHtml()) {
        for (const v of findContrastViolations(html, palette, tpl.contrast)) {
          failures.push(
            `${scheme.name} | ${label} | ${v.fg} di atas ${v.bg} = ${v.ratio}:1 (min ${v.minRatio})`,
          );
        }
      }
    }
    expect(failures.length ? [...new Set(failures)].join('\n') : '', 'ada pasangan di bawah ambang').toBe('');
  });

  it('emas tetap utuh sebagai dekorasi di palet bawaan', () => {
    // Identitas visual tidak boleh hilang: pada palet default, token
    // `accent-on-primary` harus tetap bernilai emas asli.
    const tokens = buildContrastMatrix(tpl.theme.palette, tpl.contrast);
    expect(tokens['--color-accent-on-primary'].toLowerCase())
      .toBe(tpl.theme.palette.accent.toLowerCase());
  });

  it('emas HILANG sebagai teks hanya di skema yang memang tak mendukung', () => {
    // Bukti numerik aturan "kalau latar tak kontras, emas wajib diubah":
    // di palet default emas bertahan (5.15:1), di skema dark yang tak mendukung berubah
    // Bukan bug, tapi konsekuensi yang diminta.
    const darkScheme = schemes.find((s) => s.category === 'dark')!;
    const palette = mergeSchemePalette(darkScheme, tpl.theme.palette);

    expect(getContrastRatio(palette.accent, palette.primary), 'emas harus gagal di skema dark ini')
      .toBeLessThan(4.5);

    const fresh = buildContrastMatrix(palette, tpl.contrast);
    expect(fresh['--color-accent-on-primary'].toLowerCase(), 'emas seharusnya sudah dikoreksi')
      .not.toBe(palette.accent.toLowerCase());
    expect(getContrastRatio(fresh['--color-accent-on-primary'], palette.primary))
      .toBeGreaterThanOrEqual(4.5);

    // Tombol: latar tetap emas (dekorasi), teksnya yang dikoreksi.
    expect(getContrastRatio(fresh['--color-primary-on-accent'], palette.accent))
      .toBeGreaterThanOrEqual(4.5);
  });

  it('LARANG: warna dual-role mentah sebagai teks di atas latar berwarna', () => {
    // Guard ini hanya berguna kalau regex-nya benar-benar menangkap.
    // Self-test di bawah memastikan ia tidak diam-diam jadi vakum — guard
    // yang tidak bisa gagal lebih berbahaya daripada tidak ada guard.
    const BANNED = /(?<!-on-)color\s*:\s*var\(--color-(accent|primary|secondary)\)/g;
    expect('color:var(--color-accent);background:var(--color-primary)'.match(BANNED),
      'guard gagal menangkap pola yang seharusnya dilarang').toHaveLength(1);
    expect('color:var(--color-primary-on-accent)'.match(BANNED),
      'guard salah menangkap token pasangan yang justru BENAR').toEqual(null);
    expect('border:3px solid var(--color-accent)'.match(BANNED),
      'guard salah menangkap warna dekoratif yang memang boleh').toEqual(null);

    // Ini guard yang mengunci aturan §19.2 — kalau lolos, berarti author
    // menulis `color: var(--color-accent)` di atas `background: var(--color-primary)`,
    // persis pola yang membuat template hancur di skema lain.
    const offenders: string[] = [];
    for (const { label, html } of allHtml()) {
      for (const m of html.matchAll(BANNED)) offenders.push(`${label}: ${m[0].trim()}`);
    }
    expect(
      offenders,
      `pakai warna mentah di atas latar berwarna:\n${[...new Set(offenders)].join('\n')}`,
    ).toEqual([]);
  });
});

/**
 * GUARD ICON — icon/glyph tidak boleh luput dari pengukuran kontras.
 *
 * Regresi yang nyata: icon sering TIDAK punya `color:` sendiri karena
 * mewarisi dari induk, sedangkan latarnya datang dari elemen kakek. Scanner
 * lama hanya membaca deklarasi `color:` pada tag (`if (!fgRaw) continue`)
 * dan mem-pop latar di SEMUA `</tag>` tanpa memastikan tag itu pernah push —
 * tumpukan terkuras, latar hilang, pasangan jadi `unresolved`.
 *
 * Akibatnya 9 dari 19 icon di laundry-emerald tidak pernah menghasilkan
 * pasangan sama sekali, dan `findContrastViolations` tetap melaporkan "nol
 * pelanggaran". Guard terlihat hijau tanpa pernah mengukur apa pun — bentuk
 * kegagalan paling berbahaya yang bisa dimiliki sebuah penguji.
 */
describe('icon/glyph tetap terukur kontrasnya', () => {
  const GLYPH = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}]/u;

  const pick = (style: string | undefined, prop: string): string | undefined =>
    style ? new RegExp(`(?:^|[;\\s])${prop}\\s*:\\s*([^;"]+)`).exec(style)?.[1]?.trim() : undefined;

  /** `var(--color-a)` → a ; `var(--color-a-on-b)` → a (bg-nya b). */
  const plainFg = (v: string): string => {
    const m = /var\(--color-([\w-]+)\)/.exec(v);
    if (!m) return v;
    const s = /^([a-z]+)-on-([a-z]+)$/.exec(m[1]);
    return s ? s[1] : m[1];
  };
  const tokenBg = (v: string): string | undefined => {
    const m = /var\(--color-([\w-]+)\)/.exec(v);
    if (!m) return undefined;
    return /^([a-z]+)-on-([a-z]+)$/.exec(m[1])?.[2];
  };
  /** `var(--color-surface)` → `surface` (cara scanner menamai pasangan). */
  const tokenKey = (v: string): string =>
    v.replace(/^var\(--color-/, '').replace(/\)+$/, '');

  /**
   * Warna & latar efektif sebuah glyph, dihitung dari pejalan khas HTML:
   * satu frame per elemen, `root.color` sebagai fallback warisan.
   */
  function effectiveOf(html: string, at: number): { fg: string; bg: string } {
    const frames: Array<{ bg?: string; color?: string }> = [];
    let glyphIdx = -1;
    const re = /(<\/?[a-z][\w-]*(?:\s[^>]*)?>)|([^<]+)/gi;
    let m: RegExpExecArray | null;
    let found: { fg: string; bg: string } | null = null;
    const near = (k: 'bg' | 'color'): string | undefined => {
      for (let i = frames.length - 1; i >= 0; i--) if (frames[i][k]) return frames[i][k];
      return k === 'color' ? ROOT_RENDER_COLOR : undefined;
    };
    while ((m = re.exec(html))) {
      const raw = m[1] ?? m[2];
      if (!raw) continue;
      if (raw.startsWith('</')) { if (frames.length) frames.pop(); continue; }
      if (raw.startsWith('<')) {
        const st = /style="([^"]*)"/.exec(raw)?.[1];
        frames.push({
          bg: pick(st, 'background') ?? pick(st, 'background-color'),
          color: pick(st, 'color'),
        });
        continue;
      }
      if (GLYPH.test(raw)) {
        glyphIdx += 1;
        if (glyphIdx === at) {
          const color = near('color');
          const bgRaw = near('bg');
          if (!color) throw new Error('glyph tanpa warna efektif');
          found = { fg: plainFg(color), bg: tokenBg(color) ?? (bgRaw ? tokenKey(bgRaw) : '') };
          break;
        }
      }
    }
    if (!found) throw new Error(`glyph ke-${at} tidak ditemukan`);
    return found;
  }

  function glyphsIn(html: string): number {
    let n = 0;
    const re = /([^<]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) if (GLYPH.test(m[1])) n += 1;
    return n;
  }

  it('regresi: icon yang mewarisi warna tetap menghasilkan pasangan terukur', () => {
    // Struktur ini meniru bentuk nyata yang dulu membuat scanner gagal:
    // (1) elemen penutup TANPA background menguras tumpukan latar, dan
    // (2) icon-nya sendiri tidak punya deklarasi `color:`.
    const html = `
      <section style="background:var(--color-background);">
        <div style="display:flex;gap:8px;">
          <div style="border:1px solid var(--color-border);"><i></i></div>
          <div style="border:1px solid var(--color-border);"><i></i></div>
          <div style="background:var(--color-surface);">
            <div style="font-size:1.4rem;">📍</div>
          </div>
        </div>
      </section>`;

    const pairs = scanHtmlContrastPairs(html, { color: ROOT_RENDER_COLOR });
    const hit = pairs.find((p) => p.fg === 'text' && p.bg === 'surface');
    expect(hit, `pasangan text|surface tidak ditemukan:\n${pairs.map((p) => `${p.fg}|${p.bg}`).join(', ')}`)
      .toBeDefined();
    expect(hit!.unresolved, `pasangan tidak terukur: ${hit!.note}`).toBe(false);
  });

  /**
   * Keterukuran adalah fungsi STRUKTUR (nama token + latar), bukan nilai hex,
   * jadi cukup diukur sekali — bukan diulang per skema.
   */
  it('SEMUA glyph di laundry-emerald punya pasangan terukur', () => {
    const tpl = getCatalogTemplate('laundry-emerald')!;
    const missing: string[] = [];

    for (const s of tpl.sections) {
      for (const v of s.variants) {
        const raw = (v as { html?: string }).html ?? '';
        const html = renderVariantHtml(raw, (v as { defaultConfig?: Record<string, unknown> }).defaultConfig ?? {});
        const pairs = scanHtmlContrastPairs(html, { color: ROOT_RENDER_COLOR });
        const measurable = new Set(pairs.filter((p) => p.bg && !p.unresolved).map((p) => `${p.fg}|${p.bg}`));
        const total = glyphsIn(html);
        for (let i = 0; i < total; i++) {
          const { fg, bg } = effectiveOf(html, i);
          if (!measurable.has(`${fg}|${bg}`)) {
            missing.push(`${s.type}/${v.id} | glyph#${i} → ${fg}|${bg || '(tanpa bg)'}`);
          }
        }
      }
    }

    expect(
      [...new Set(missing)].join('\n'),
      `glyph tanpa pasangan terukur:\n${[...new Set(missing)].join('\n')}`,
    ).toBe('');
  });
});



