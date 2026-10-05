import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Template, SectionTypeDefinition, SectionVariant, TemplateSectionInstance, AnimationConfig, BehaviourConfig, AssetMetadata, TemplateTheme } from './template-types';
import { seedTemplateSections, sanitizeAnchor, uniqueAnchorId } from './migration';
import { applySectionAssets } from './template-assets';

import { BUILT_IN_CATALOG } from './templates/catalog';

export const BUILTIN_TEMPLATES: Template[] = BUILT_IN_CATALOG;

export function getTemplate(id: string): Template | undefined {
  return BUILT_IN_CATALOG.find((t) => t.id === id);
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

export function getActiveSections(template: Template): string[] {
  if (Array.isArray(template.activeSections) && template.activeSections.length > 0) {
    return template.activeSections;
  }
  const seedTypes = new Set<string>();
  try {
    const data = (template as unknown as { data?: { sections?: Array<{ type?: string }> } }).data;
    for (const s of data?.sections ?? []) {
      if (s?.type) seedTypes.add(s.type);
    }
  } catch {
  }
  if (seedTypes.size > 0) return [...seedTypes];
  return template.sections.map((s) => s.type);
}

function generateId(): string {
  return crypto.randomUUID();
}

function deepClone<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

type TemplateHistoryEntry = {
  sections: TemplateSectionInstance[];
  headerVariantId: string;
  footerVariantId: string;
  themeOverride: Record<string, string>;
  animations: AnimationConfig[];
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
  customCss: string;
  assets: AssetMetadata[];
  past: TemplateHistoryEntry[];
  future: TemplateHistoryEntry[];

  setTemplate: (templateId: string) => void;
  applyTemplate: (templateId: string, override?: Template) => void;
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
  updateSectionAnchor: (id: string, anchorId: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  selectSection: (id: string | null) => void;
  updateThemeOverride: (patch: Record<string, string>) => void;
  resetThemeOverride: () => void;
  updateAnimations: (animations: AnimationConfig[]) => void;
  updateBehaviours: (behaviours: BehaviourConfig[]) => void;
  updateAssets: (assets: AssetMetadata[]) => void;
  updateHeaderConfig: (patch: Record<string, unknown>) => void;
  updateFooterConfig: (patch: Record<string, unknown>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  loadFromConfig: (config: Record<string, unknown>) => void;
  getConfig: () => Record<string, unknown>;
}

function createEmptyTemplate(): Template {
  return {
    id: '',
    name: '',
    description: '',
    category: 'services',
    theme: {
      palette: {
        primary: '#333333',
        secondary: '#666666',
        accent: '#333333',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#333333',
        textMuted: '#666666',
        border: '#e5e5e5',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        baseSize: 16,
        scaleRatio: 1.25,
        headingWeight: 700,
        bodyWeight: 400,
      },
      components: {
        borderRadius: 4,
        buttonStyle: 'solid',
        shadowStyle: 'sm',
        navStyle: 'solid',
        footerStyle: 'simple',
      },
      effects: {},
    },
    headers: [],
    footers: [],
    sections: [],
  };
}

export const useTemplateStore = create<TemplateState>()(
  immer((set, get) => ({
    template: createEmptyTemplate(),
    headerVariantId: '',
    footerVariantId: '',
    headerConfig: {},
    footerConfig: {},
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
        // Template now comes from database, not BUILTIN_TEMPLATES
        // This is a no-op since template comes from server
      }),

    applyTemplate: (templateId, override) =>
      set((state) => {
        const template = override ?? getTemplate(templateId);
        if (!template) return;
        pushTemplateHistory(state);

        state.template = template;
        state.headerVariantId = template.headers[0]?.id ?? '';
        state.footerVariantId = template.footers[0]?.id ?? '';
        state.headerConfig = deepClone(template.headers[0]?.defaultConfig ?? {});
        state.footerConfig = deepClone(template.footers[0]?.defaultConfig ?? {});

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
        state.themeOverride = {};
        state.animations = template.animations || [];
        // customCss/behaviours hidup di `data` pada CatalogTemplate (§18) —
        // baca dari sana dulu, fallback ke root untuk kompatibilitas lama.
        // Tanpa ini kanvas kehilangan customCss template sementara live site
        // mendapatkannya via fallback katalog (public.ts) → keduanya beda.
        const tplCreative = (
          template as unknown as {
            data?: { customCss?: unknown; animations?: unknown; behaviours?: unknown };
          }
        ).data;
        state.customCss =
          (typeof tplCreative?.customCss === 'string' && tplCreative.customCss) ||
          (template as { customCss?: string }).customCss ||
          '';
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
        // Template now comes from database via server
        // This is used for hydrating from server config
        if (Array.isArray(config.sections)) {
          state.sections = seedTemplateSections(
            state.template,
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