import { describe, expect, it } from 'vitest';
import { hydrateCanvasFromConfig } from './hydrate-canvas';
import { useBuilderStore } from './store';
import { useTemplateStore } from './template-store';
import { BUILT_IN_CATALOG } from './templates/catalog';

/**
 * Guard aturan staging "Terapkan template" (builder):
 *  - apply menulis KEDUA store kanvas dan menandainya KOTOR (`saved: false`)
 *    supaya badge "belum disimpan" + leave-guard menyala;
 *  - load halaman memakai helper yang sama dengan `saved: true` (bersih).
 *
 * Tanpa pembedaan ini, "Terapkan template" tidak akan terasa bedanya dengan
 * tayang: tidak ada sinyal bahwa user masih harus menekan "Tayangkan".
 */
const tpl = BUILT_IN_CATALOG[0];
const seedSections = ((tpl as { data?: { sections?: unknown[] } }).data?.sections ?? []) as Array<
  Record<string, unknown>
>;

describe('hydrateCanvasFromConfig: staging vs load', () => {
  it('staging (saved: false) menghidrasi kanvas & menandai KOTOR di kedua store', () => {
    const result = hydrateCanvasFromConfig({
      config: { sections: seedSections, catalog_template_id: tpl.id },
      templateId: tpl.id,
      saved: false,
    });

    expect(result?.id).toBe(tpl.id);
    expect(useTemplateStore.getState().template?.id).toBe(tpl.id);
    if (seedSections.length > 0) {
      expect(useTemplateStore.getState().sections.length).toBeGreaterThan(0);
      expect(useBuilderStore.getState().sections.length).toBeGreaterThan(0);
    }
    // Sinyal "belum tayang": kedua store kotor → badge & leave-guard aktif.
    expect(useTemplateStore.getState().saved).toBe(false);
    expect(useBuilderStore.getState().saved).toBe(false);
  });

  it('load halaman (saved: true) memakai helper yang sama & menandai BERSIH', () => {
    const result = hydrateCanvasFromConfig({
      config: { sections: seedSections, catalog_template_id: tpl.id },
      templateId: tpl.id,
      saved: true,
    });

    expect(result?.id).toBe(tpl.id);
    expect(useTemplateStore.getState().saved).toBe(true);
    expect(useBuilderStore.getState().saved).toBe(true);
  });

  it('templateId kosong tidak melempar — seed dilewati seperti load lama', () => {
    expect(() =>
      hydrateCanvasFromConfig({ config: { sections: [] }, templateId: '', saved: false }),
    ).not.toThrow();
    expect(useBuilderStore.getState().saved).toBe(false);
  });
});
