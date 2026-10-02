import { describe, expect, it } from 'vitest';
import { BUILTIN_TEMPLATES } from '../template-store';

/**
 * Regresi: `template-gallery.tsx` pernah crash dengan
 * "Cannot read properties of undefined (reading 'length')" di baris
 * `sectionsCount: t.sections.length`, karena template bengkel sempat
 * kehilangan spread `...PANGKAS_RAPI_TEMPLATE` tanpa diiringi katalog
 * `sections` sendiri.
 *
 * Guard ini menjaga semua template builtin tetap punya `sections`,
 * `headers`, dan `footers` berupa array — ketiga key itu WAJIB ada di root
 * tiap template (gallery membacanya, sidebar membacanya untuk SectionPicker).
 */
describe('regresi: template builtin lengkap untuk gallery', () => {
  it('setiap template punya sections/headers/footers berupa array', () => {
    for (const t of BUILTIN_TEMPLATES) {
      expect(Array.isArray(t.sections), `${t.id}.sections`).toBe(true);
      expect(Array.isArray(t.headers), `${t.id}.headers`).toBe(true);
      expect(Array.isArray(t.footers), `${t.id}.footers`).toBe(true);
      // Baris yang dulu melempar.
      expect(typeof t.sections.length, `${t.id}: sections.length`).toBe('number');
      expect(typeof t.headers.length, `${t.id}: headers.length`).toBe('number');
      expect(typeof t.footers.length, `${t.id}: footers.length`).toBe('number');
    }
  });

  it('setiap template punya designType (dibaca galeri untuk badge)', () => {
    for (const t of BUILTIN_TEMPLATES) {
      expect(t.designType, `${t.id}: designType`).toBeTruthy();
    }
  });
});