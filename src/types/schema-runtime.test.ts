import { describe, expect, it } from 'vitest';
import { builderConfigSchema } from './index';

/**
 * Guard runtime (bukan type-level): `navGroupSchema` dipakai di dalam
 * `builderConfigSchema`. Bila deklarasinya tersusun setelah pemakaian,
 * modul crash saat evaluation dengan "navGroupSchema is not defined" —
 *_gejala muncul saat runtime, bukan saat build.
 */
describe('runtime schema footer', () => {
  it('navGroupSchema ter-resolve saat module evaluation', () => {
    const parsed = builderConfigSchema.parse({
      design_style_id: 'minimalist',
      theme: { palette: {}, typography: {} },
      header: { navItems: [] },
      footer: {
        style: 'columns',
        navGroups: [{ id: 'g1', title: 'Produk', items: [{ id: 'a', label: 'Katalog', url: '#k' }] }],
      },
    });
    const footer = parsed.footer as { navGroups?: Array<{ title: string }> };
    expect(footer.navGroups?.[0]?.title).toBe('Produk');
  });

  it('footer tanpa navGroups tetap valid (backward compat)', () => {
    const parsed = builderConfigSchema.parse({
      design_style_id: 'minimalist',
      theme: { palette: {}, typography: {} },
      header: { navItems: [] },
      footer: { style: 'simple', navItems: [] },
    });
    const footer = parsed.footer as { showNav?: boolean };
    // Default-nya harus mengaktifkan navigasi agar data lama tetap tampil.
    expect(footer.showNav).toBe(true);
  });
});

/**
 * Guard data-loss saat save: `store.ts` mengirim `validation.data` ke API,
 * jadi apa pun yang dibuang zod akan hilang permanen. Field gaya latar &
 * anchor wajib lolos parse.
 */
describe('schema menyimpan field section yang tidak terlihat', () => {
  it('anchorId section tidak dibuang', () => {
    const parsed = builderConfigSchema.parse({
      design_style_id: 'minimalist',
      theme: { palette: {}, typography: {} },
      sections: [
        {
          id: 'sec-1',
          type: 'hero',
          variant: 'hero-full',
          config: {},
          style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, background: 'transparent' },
          responsive: {},
          anchorId: 'daftar-harga',
        },
      ],
    });
    expect(parsed.sections[0].anchorId).toBe('daftar-harga');
  });

  it('field gaya latar (blur/overlay/size/opacity) tidak dibuang', () => {
    const parsed = builderConfigSchema.parse({
      design_style_id: 'minimalist',
      theme: { palette: {}, typography: {} },
      sections: [
        {
          id: 'sec-1',
          type: 'hero',
          variant: 'hero-full',
          config: {},
          style: {
            padding: { top: 0, right: 0, bottom: 0, left: 0 },
            background: 'image',
            backgroundImage: 'https://x.test/a.jpg',
            backgroundBlur: 8,
            backgroundSize: 'contain',
            backgroundOverlay: 'dark',
            backgroundOverlayOpacity: 40,
          },
          responsive: {},
          anchorId: 'promo',
        },
      ],
    });
    const style = parsed.sections[0].style as Record<string, unknown>;
    expect(style.backgroundBlur).toBe(8);
    expect(style.backgroundSize).toBe('contain');
    expect(style.backgroundOverlay).toBe('dark');
    expect(style.backgroundOverlayOpacity).toBe(40);
  });
});