import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Template, SectionTypeDefinition, SectionVariant, TemplateSectionInstance, AnimationConfig, BehaviourConfig, AssetMetadata, TemplateTheme } from './template-types';
import { PANGKAS_RAPI_TEMPLATE } from './templates/pangkas-rapi';
import { BENGKEL_TEMPLATE } from './templates/bengkel';
import { WARUNG_MAKAN_TEMPLATE } from './templates/warung-makan';
import { BUTIK_HIJAB_TEMPLATE } from './templates/butik-hijab';
import { TOKO_KELONTONG_TEMPLATE } from './templates/toko-kelontong';
import { KERAJINAN_TANGAN_TEMPLATE } from './templates/kerajinan-tangan';
import { seedTemplateSections, sanitizeAnchor, uniqueAnchorId } from './migration';
import { applySectionAssets } from './template-assets';

export const BUILTIN_TEMPLATES: Template[] = [
  PANGKAS_RAPI_TEMPLATE,
  BENGKEL_TEMPLATE,
  WARUNG_MAKAN_TEMPLATE,
  BUTIK_HIJAB_TEMPLATE,
  TOKO_KELONTONG_TEMPLATE,
  KERAJINAN_TANGAN_TEMPLATE,
];

export function getTemplate(id: string): Template | undefined {
  return BUILTIN_TEMPLATES.find((t) => t.id === id);
}

export function getSectionType(template: Template, type: string): SectionTypeDefinition | undefined {
  return template.sections.find((s) => s.type === type);
}

export function getSectionVariant(template: Template, type: string, variantId: string): SectionVariant | undefined {
  return getSectionType(template, type)?.variants.find((v) => v.id === variantId);
}

export function getHeaderVariant(template: Template, variantId: string) {
  return template.headers.find((h) => h.id === variantId) ?? template.headers[0];
}

export function getFooterVariant(template: Template, variantId: string) {
  return template.footers.find((f) => f.id === variantId) ?? template.footers[0];
}

function generateId(): string {
  return crypto.randomUUID();
}

function deepClone<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Satu entri histori template (sections + chrome + tema + aset). */
type TemplateHistoryEntry = {
  sections: TemplateSectionInstance[];
  headerVariantId: string;
  footerVariantId: string;
  themeOverride: Record<string, string>;
  animations: AnimationConfig[];
  /** CSS kustom template — lihat `FullTemplateData.customCss`. */
  customCss: string;
  behaviours: BehaviourConfig[];
  assets: AssetMetadata[];
  headerConfig: Record<string, unknown>;
  footerConfig: Record<string, unknown>;
};

type TemplateDraft = {
  sections: TemplateSectionInstance[];
  headerVariantId: string;
  footerVariantId: string;
  headerConfig: Record<string, unknown>;
  footerConfig: Record<string, unknown>;
  themeOverride: Record<string, string>;
  animations: AnimationConfig[];
  /** CSS kustom template — lihat `FullTemplateData.customCss`. */
  customCss: string;
  behaviours: BehaviourConfig[];
  assets: AssetMetadata[];
  past: TemplateHistoryEntry[];
  future: TemplateHistoryEntry[];
};

function snapshotTemplate(state: TemplateDraft) {
  return {
    sections: deepClone(state.sections),
    headerVariantId: state.headerVariantId,
    footerVariantId: state.footerVariantId,
    headerConfig: deepClone(state.headerConfig ?? {}),
    footerConfig: deepClone(state.footerConfig ?? {}),
    themeOverride: deepClone(state.themeOverride),
    animations: deepClone(state.animations),
    customCss: state.customCss,
    behaviours: deepClone(state.behaviours),
    assets: deepClone(state.assets),
  };
}

/** Dorong histori lengkap (sections + chrome + tema + aset). */
function pushTemplateHistory(state: TemplateDraft) {
  state.past.push(snapshotTemplate(state));
}

function restoreTemplateSnapshot(
  state: TemplateDraft,
  snapshot: ReturnType<typeof snapshotTemplate>,
) {
  state.sections = snapshot.sections;
  state.headerVariantId = snapshot.headerVariantId;
  state.footerVariantId = snapshot.footerVariantId;
  state.headerConfig = snapshot.headerConfig ?? {};
  state.footerConfig = snapshot.footerConfig ?? {};
  state.themeOverride = snapshot.themeOverride ?? {};
  state.animations = snapshot.animations ?? [];
  state.customCss = snapshot.customCss ?? '';
  state.behaviours = snapshot.behaviours ?? [];
  state.assets = snapshot.assets ?? [];
}

function createDefaultSectionInstance(template: Template, type: string, variantId: string): TemplateSectionInstance {
  const variant = getSectionVariant(template, type, variantId);
  const ds = variant?.defaultStyle ?? {};
  return {
    id: generateId(),
    type,
    variantId,
    config: deepClone(variant?.defaultConfig ?? {}),
    style: {
      padding: { top: 48, right: 24, bottom: 48, left: 24, ...(ds.padding ?? {}) },
      background: ds.background ?? 'transparent',
      // Pertahankan token theme:* apa adanya — di-resolve saat render ke
      // warna template aktif sehingga varian baru langsung ikut tema.
      ...(ds.backgroundColor ? { backgroundColor: ds.backgroundColor } : {}),
      ...(ds.backgroundImage ? { backgroundImage: ds.backgroundImage } : {}),
      ...(ds.backgroundGradient ? { backgroundGradient: ds.backgroundGradient } : {}),
      ...(typeof ds.backgroundBlur === 'number' ? { backgroundBlur: ds.backgroundBlur } : {}),
      ...(ds.backgroundSize ? { backgroundSize: ds.backgroundSize } : {}),
      ...(ds.backgroundOverlay ? { backgroundOverlay: ds.backgroundOverlay } : {}),
      ...(typeof ds.backgroundOverlayOpacity === 'number'
        ? { backgroundOverlayOpacity: ds.backgroundOverlayOpacity }
        : {}),
    },
    responsive: {},
  };
}

interface TemplateState {
  template: Template;
  headerVariantId: string;
  footerVariantId: string;
  headerConfig: Record<string, unknown>;
  footerConfig: Record<string, unknown>;
  sections: TemplateSectionInstance[];
  selectedSectionId: string | null;
  saved: boolean;
  themeOverride: Record<string, string>;
  animations: AnimationConfig[];
  behaviours: BehaviourConfig[];
  /** CSS kustom template — lihat `FullTemplateData.customCss`. */
  customCss: string;
  assets: AssetMetadata[];
  past: TemplateHistoryEntry[];
  future: TemplateHistoryEntry[];

  setTemplate: (templateId: string) => void;
  /**
   * Terapkan template sebagai titik awal BARU: ganti theme/palette, reset
   * header/footer ke varian pertama, DAN seed sections bawaan template lengkap
   * dengan aset foto per-niche. Section lama digantikan (bisa di-undo).
   */
  /**
   * Terapkan template ke store/kanvas.
   *
   * `override` dipakai untuk template library (hasil import ZIP): id-nya tidak
   * ada di `BUILTIN_TEMPLATES`, jadi `getTemplate()` akan mengembalikan
   * `undefined` dan pemanggilan diam-diam tidak berefek apa pun. Kirim objek
   * `Template` hasil `synthesizeLibraryTemplate()` untuk menutup jalur itu.
   */
  applyTemplate: (templateId: string, override?: Template) => void;
  /** Timpa sections tanpa reset undo-user (dipakai seed dari data tersimpan). */
  replaceSections: (sections: TemplateSectionInstance[]) => void;
  setHeaderVariant: (variantId: string) => void;
  setFooterVariant: (variantId: string) => void;
  addSection: (type: string, variantId: string) => void;
  insertSectionAt: (type: string, variantId: string, index: number) => void;
  deleteSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  updateSection: (id: string, updates: Partial<TemplateSectionInstance>) => void;
  setSectionVariant: (id: string, variantId: string) => void;
  updateSectionConfig: (id: string, config: Record<string, unknown>) => void;
  updateSectionStyle: (id: string, style: Partial<TemplateSectionInstance['style']>) => void;
  /** Set anchor link (`#...`) sebuah section. Nilai dinormalisasi + dijaga unik. */
  updateSectionAnchor: (id: string, anchorId: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  selectSection: (id: string | null) => void;
  updateThemeOverride: (patch: Record<string, string>) => void;
  resetThemeOverride: () => void;
  updateAnimations: (animations: AnimationConfig[]) => void;
  updateBehaviours: (behaviours: BehaviourConfig[]) => void;
  updateAssets: (assets: AssetMetadata[]) => void;
  /** Ubah satu key konten header (ikut undo + tandai belum tersimpan). */
  updateHeaderConfig: (patch: Record<string, unknown>) => void;
  /** Ubah satu key konten footer (ikut undo + tandai belum tersimpan). */
  updateFooterConfig: (patch: Record<string, unknown>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  loadFromConfig: (config: Record<string, unknown>) => void;
  getConfig: () => Record<string, unknown>;
}

export const useTemplateStore = create<TemplateState>()(
  immer((set, get) => ({
    template: PANGKAS_RAPI_TEMPLATE,
    headerVariantId: PANGKAS_RAPI_TEMPLATE.headers[0].id,
    footerVariantId: PANGKAS_RAPI_TEMPLATE.footers[0].id,
    headerConfig: { ...(PANGKAS_RAPI_TEMPLATE.headers[0]?.defaultConfig ?? {}) },
    footerConfig: { ...(PANGKAS_RAPI_TEMPLATE.footers[0]?.defaultConfig ?? {}) },
    sections: [],
    selectedSectionId: null,
    saved: true,
    themeOverride: {},
    animations: [],
    customCss: '',
    behaviours: [],
    assets: [],
    past: [],
    future: [],

    setTemplate: (templateId) =>
      set((state) => {
        const template = getTemplate(templateId);
        if (!template) return;
        state.template = template;
        state.headerVariantId = template.headers[0].id;
        state.footerVariantId = template.footers[0].id;
        state.headerConfig = { ...(template.headers[0]?.defaultConfig ?? {}) };
        state.footerConfig = { ...(template.footers[0]?.defaultConfig ?? {}) };
        state.sections = [];
        state.selectedSectionId = null;
        state.themeOverride = {};
        state.animations = template.animations || [];
        state.customCss = (template as { customCss?: string }).customCss ?? '';
        state.behaviours = template.behaviours || [];
        state.assets = template.assets || [];
        state.saved = false;
      }),

    applyTemplate: (templateId, override) =>
      set((state) => {
        const template = override ?? getTemplate(templateId);
        if (!template) return;
        // Dorong histori dulu → "Ganti template" bisa di-undo seperti edit biasa.
        pushTemplateHistory(state);

        state.template = template;
        state.headerVariantId = template.headers[0].id;
        state.footerVariantId = template.footers[0].id;
        state.headerConfig = deepClone(template.headers[0]?.defaultConfig ?? {});
        state.footerConfig = deepClone(template.footers[0]?.defaultConfig ?? {});

        // Seed section bawaan template lalu lengkapi foto per-niche bisnis.
        // Tanpa ini kanvas kosong setelah ganti template (regression lama).
        // Sumber = `data.sections` (konten per-bisnis) jika ada; kalau template
        // tidak menyediakannya, jatuh ke varian pertama tiap tipe section.
        const tplData = (template as unknown as { data?: { sections?: Parameters<typeof seedTemplateSections>[1] } }).data;
        type SeedInput = NonNullable<Parameters<typeof seedTemplateSections>[1]>[number];
        const fallback: SeedInput[] = (template.sections ?? []).flatMap((st) =>
          st.variants.slice(0, 1).map((v) => ({
            type: st.type as SeedInput['type'],
            variant: v.id,
            config: v.defaultConfig,
          })),
        );
        const source = Array.isArray(tplData?.sections) && tplData.sections.length > 0 ? tplData.sections : fallback;
        const seeded = seedTemplateSections(template, source);
        state.sections = seeded.map((s) => ({
          ...s,
          config: applySectionAssets(s.config, template.category),
        }));

        state.selectedSectionId = null;
        // Reset override tema supaya palet template (mis. oranye warung makan)
        // benar-benar tampil, bukan sisa template sebelumnya.
        state.themeOverride = {};
        state.animations = template.animations || [];
        state.customCss = (template as { customCss?: string }).customCss ?? '';
        state.behaviours = template.behaviours || [];
        state.assets = template.assets || [];
        state.future = [];
        state.saved = false;
      }),

    replaceSections: (sections) =>
      set((state) => {
        state.sections = deepClone(sections ?? []);
        state.selectedSectionId = null;
        state.past = [];
        state.future = [];
        // Konten hasil seed dianggap "tersimpan" agar indikator atas tidak
        // menyala palsu saat halaman baru dibuka.
        state.saved = true;
      }),

    setHeaderVariant: (variantId) =>
      set((state) => {
        if (state.headerVariantId === variantId) return;
        pushTemplateHistory(state);
        state.headerVariantId = variantId;
        state.headerConfig = {
          ...(getHeaderVariant(state.template, variantId)?.defaultConfig ?? {}),
        };
        state.future = [];
        state.saved = false;
      }),

    setFooterVariant: (variantId) =>
      set((state) => {
        if (state.footerVariantId === variantId) return;
        pushTemplateHistory(state);
        state.footerVariantId = variantId;
        state.footerConfig = {
          ...(getFooterVariant(state.template, variantId)?.defaultConfig ?? {}),
        };
        state.future = [];
        state.saved = false;
      }),

    addSection: (type, variantId) =>
      set((state) => {
        pushTemplateHistory(state);
        state.future = [];
        state.sections.push(createDefaultSectionInstance(state.template, type, variantId));
        state.saved = false;
      }),

    insertSectionAt: (type, variantId, index) =>
      set((state) => {
        pushTemplateHistory(state);
        state.future = [];
        state.sections.splice(index, 0, createDefaultSectionInstance(state.template, type, variantId));
        state.saved = false;
      }),

    deleteSection: (id) =>
      set((state) => {
        pushTemplateHistory(state);
        state.future = [];
        state.sections = state.sections.filter((s) => s.id !== id);
        if (state.selectedSectionId === id) {
          state.selectedSectionId = null;
        }
        state.saved = false;
      }),

    duplicateSection: (id) =>
      set((state) => {
        const index = state.sections.findIndex((s) => s.id === id);
        if (index === -1) return;
        const original = state.sections[index];
        const duplicate: TemplateSectionInstance = {
          ...deepClone(original),
          id: generateId(),
        };
        pushTemplateHistory(state);
        state.future = [];
        state.sections.splice(index + 1, 0, duplicate);
        state.saved = false;
      }),

    updateSection: (id, updates) =>
      set((state) => {
        const section = state.sections.find((s) => s.id === id);
        if (section) {
          Object.assign(section, updates);
          state.saved = false;
        }
      }),

    setSectionVariant: (id, variantId) =>
      set((state) => {
        const section = state.sections.find((s) => s.id === id);
        if (!section) return;
        const template = state.template;
        const sectionType = template.sections.find((s) => s.type === section.type);
        const newVariant = sectionType?.variants.find((v) => v.id === variantId);
        if (!newVariant) return;
        section.variantId = variantId;
        section.config = deepClone(newVariant.defaultConfig ?? {});
        const nds = newVariant.defaultStyle ?? {};
        section.style = {
          padding: { top: 48, right: 24, bottom: 48, left: 24, ...(nds.padding ?? {}) },
          background: nds.background ?? 'transparent',
          ...(nds.backgroundColor ? { backgroundColor: nds.backgroundColor } : {}),
          ...(nds.backgroundImage ? { backgroundImage: nds.backgroundImage } : {}),
          ...(nds.backgroundGradient ? { backgroundGradient: nds.backgroundGradient } : {}),
          ...(typeof nds.backgroundBlur === 'number' ? { backgroundBlur: nds.backgroundBlur } : {}),
          ...(nds.backgroundSize ? { backgroundSize: nds.backgroundSize } : {}),
          ...(nds.backgroundOverlay ? { backgroundOverlay: nds.backgroundOverlay } : {}),
          ...(typeof nds.backgroundOverlayOpacity === 'number'
            ? { backgroundOverlayOpacity: nds.backgroundOverlayOpacity }
            : {}),
        };
        state.saved = false;
      }),

    updateSectionConfig: (id, config) =>
      set((state) => {
        const section = state.sections.find((s) => s.id === id);
        if (section) {
          section.config = { ...section.config, ...config };
          state.saved = false;
        }
      }),

    updateSectionStyle: (id, style) =>
      set((state) => {
        const section = state.sections.find((s) => s.id === id);
        if (section) {
          section.style = { ...section.style, ...style };
          state.saved = false;
        }
      }),

    // Anchor = atribut `id` di DOM yang jadi target link `#...` di menu.
    // Nilai dinormalisasi (lihat sanitizeAnchor) lalu dijaga unik terhadap
    // section lain — duplikat akan menjadi id HTML yang tidak valid.
    // String kosong = section tanpa anchor (tetap tanpa id, bukan error).
    updateSectionAnchor: (id, anchorId) =>
      set((state) => {
        const section = state.sections.find((s) => s.id === id);
        if (!section) return;
        const wanted = sanitizeAnchor(anchorId);
        if (!wanted) {
          delete section.anchorId;
          state.saved = false;
          return;
        }
        const used = new Set<string>();
        for (const other of state.sections) {
          if (other.id === id) continue;
          if (other.anchorId) used.add(other.anchorId);
        }
        section.anchorId = uniqueAnchorId(wanted, used);
        state.saved = false;
      }),

    reorderSections: (fromIndex, toIndex) =>
      set((state) => {
        const [moved] = state.sections.splice(fromIndex, 1);
        state.sections.splice(toIndex, 0, moved);
        state.saved = false;
      }),

    selectSection: (id) =>
      set((state) => {
        state.selectedSectionId = id;
      }),

    updateThemeOverride: (patch) =>
      set((state) => {
        state.themeOverride = { ...state.themeOverride, ...patch };
        state.saved = false;
      }),

    resetThemeOverride: () =>
      set((state) => {
        state.themeOverride = {};
        state.saved = false;
      }),

    updateAnimations: (animations) =>
      set((state) => {
        state.animations = animations;
        state.saved = false;
      }),

    updateBehaviours: (behaviours) =>
      set((state) => {
        state.behaviours = behaviours;
        state.saved = false;
      }),

    updateAssets: (assets) =>
      set((state) => {
        state.assets = assets;
        state.saved = false;
      }),

    updateHeaderConfig: (patch) =>
      set((state) => {
        pushTemplateHistory(state);
        state.headerConfig = { ...(state.headerConfig ?? {}), ...patch };
        state.future = [];
        state.saved = false;
      }),

    updateFooterConfig: (patch) =>
      set((state) => {
        pushTemplateHistory(state);
        state.footerConfig = { ...(state.footerConfig ?? {}), ...patch };
        state.future = [];
        state.saved = false;
      }),

    undo: () =>
      set((state) => {
        if (state.past.length === 0) return;
        state.future.push(snapshotTemplate(state));
        const snapshot = state.past.pop()!;
        restoreTemplateSnapshot(state, snapshot);
        state.saved = false;
      }),

    redo: () =>
      set((state) => {
        if (state.future.length === 0) return;
        state.past.push(snapshotTemplate(state));
        const snapshot = state.future.pop()!;
        restoreTemplateSnapshot(state, snapshot);
        state.saved = false;
      }),

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,

    loadFromConfig: (config) =>
      set((state) => {
        const templateId = (config.template_id as string) || 'pangkas-rapi';
        const template = getTemplate(templateId) || PANGKAS_RAPI_TEMPLATE;
        state.template = template;
        const headerVariantId = (config.header_variant_id as string) || template.headers[0].id;
        const footerVariantId = (config.footer_variant_id as string) || template.footers[0].id;
        state.headerVariantId = headerVariantId;
        state.footerVariantId = footerVariantId;
        state.headerConfig = {
          ...(getHeaderVariant(template, headerVariantId)?.defaultConfig ?? {}),
        };
        state.footerConfig = {
          ...(getFooterVariant(template, footerVariantId)?.defaultConfig ?? {}),
        };

        if (Array.isArray(config.sections)) {
          state.sections = seedTemplateSections(
            template,
            config.sections as Array<Record<string, unknown>>,
          );
        }

        state.animations = Array.isArray(config.animations) ? config.animations as AnimationConfig[] : [];
        state.customCss = typeof config.customCss === 'string' ? config.customCss : '';
        state.behaviours = Array.isArray(config.behaviours) ? config.behaviours as BehaviourConfig[] : [];
        state.assets = Array.isArray(config.assets) ? config.assets as AssetMetadata[] : [];

        state.selectedSectionId = null;
        state.past = [];
        state.future = [];
        state.saved = true;
      }),

    getConfig: () => {
      const state = get();
      return {
        template_id: state.template.id,
        header_variant_id: state.headerVariantId,
        footer_variant_id: state.footerVariantId,
        header_config: { ...state.headerConfig },
        footer_config: { ...state.footerConfig },
        sections: state.sections,
        animations: state.animations,
        customCss: state.customCss,
        behaviours: state.behaviours,
        assets: state.assets,
      };
    },
  }))
);
