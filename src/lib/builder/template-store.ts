import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Template, SectionTypeDefinition, SectionVariant, TemplateSectionInstance } from './template-types';
import { PANGKAS_RAPI_TEMPLATE } from './templates/pangkas-rapi';

export const BUILTIN_TEMPLATES: Template[] = [PANGKAS_RAPI_TEMPLATE];

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

function createDefaultSectionInstance(template: Template, type: string, variantId: string): TemplateSectionInstance {
  const variant = getSectionVariant(template, type, variantId);
  return {
    id: generateId(),
    type,
    variantId,
    config: deepClone(variant?.defaultConfig ?? {}),
    style: {
      padding: { top: 48, right: 24, bottom: 48, left: 24 },
      background: 'transparent',
      ...(variant?.defaultStyle?.padding ? { padding: { top: 48, right: 24, bottom: 48, left: 24, ...variant.defaultStyle.padding } } : {}),
      ...(variant?.defaultStyle?.background ? { background: variant.defaultStyle.background } : {}),
      ...(variant?.defaultStyle?.backgroundColor ? { backgroundColor: variant.defaultStyle.backgroundColor } : {}),
      ...(variant?.defaultStyle?.backgroundImage ? { backgroundImage: variant.defaultStyle.backgroundImage } : {}),
      ...(variant?.defaultStyle?.backgroundGradient ? { backgroundGradient: variant.defaultStyle.backgroundGradient } : {}),
    },
    responsive: {},
  };
}

interface TemplateState {
  template: Template;
  headerVariantId: string;
  footerVariantId: string;
  sections: TemplateSectionInstance[];
  selectedSectionId: string | null;
  saved: boolean;
  themeOverride: Record<string, string>;
  past: Array<{
    sections: TemplateSectionInstance[];
    headerVariantId: string;
    footerVariantId: string;
    themeOverride: Record<string, string>;
  }>;
  future: Array<{
    sections: TemplateSectionInstance[];
    headerVariantId: string;
    footerVariantId: string;
    themeOverride: Record<string, string>;
  }>;

  setTemplate: (templateId: string) => void;
  setHeaderVariant: (variantId: string) => void;
  setFooterVariant: (variantId: string) => void;
  addSection: (type: string, variantId: string) => void;
  insertSectionAt: (type: string, variantId: string, index: number) => void;
  deleteSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  updateSection: (id: string, updates: Partial<TemplateSectionInstance>) => void;
  updateSectionConfig: (id: string, config: Record<string, unknown>) => void;
  updateSectionStyle: (id: string, style: Partial<TemplateSectionInstance['style']>) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  selectSection: (id: string | null) => void;
  updateThemeOverride: (patch: Record<string, string>) => void;
  resetThemeOverride: () => void;
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
    sections: [],
    selectedSectionId: null,
    saved: true,
    themeOverride: {},
    past: [],
    future: [],

    setTemplate: (templateId) =>
      set((state) => {
        const template = getTemplate(templateId);
        if (!template) return;
        state.template = template;
        state.headerVariantId = template.headers[0].id;
        state.footerVariantId = template.footers[0].id;
        state.sections = [];
        state.selectedSectionId = null;
        state.themeOverride = {};
        state.saved = false;
      }),

    setHeaderVariant: (variantId) =>
      set((state) => {
        state.headerVariantId = variantId;
        state.saved = false;
      }),

    setFooterVariant: (variantId) =>
      set((state) => {
        state.footerVariantId = variantId;
        state.saved = false;
      }),

    addSection: (type, variantId) =>
      set((state) => {
        state.past.push({
          sections: deepClone(state.sections),
          headerVariantId: state.headerVariantId,
          footerVariantId: state.footerVariantId,
          themeOverride: deepClone(state.themeOverride),
        });
        state.future = [];
        state.sections.push(createDefaultSectionInstance(state.template, type, variantId));
        state.saved = false;
      }),

    insertSectionAt: (type, variantId, index) =>
      set((state) => {
        state.past.push({
          sections: deepClone(state.sections),
          headerVariantId: state.headerVariantId,
          footerVariantId: state.footerVariantId,
          themeOverride: deepClone(state.themeOverride),
        });
        state.future = [];
        state.sections.splice(index, 0, createDefaultSectionInstance(state.template, type, variantId));
        state.saved = false;
      }),

    deleteSection: (id) =>
      set((state) => {
        state.past.push({
          sections: deepClone(state.sections),
          headerVariantId: state.headerVariantId,
          footerVariantId: state.footerVariantId,
          themeOverride: deepClone(state.themeOverride),
        });
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
        state.past.push({
          sections: deepClone(state.sections),
          headerVariantId: state.headerVariantId,
          footerVariantId: state.footerVariantId,
          themeOverride: deepClone(state.themeOverride),
        });
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

    undo: () =>
      set((state) => {
        if (state.past.length === 0) return;
        const currentSnapshot = {
          sections: deepClone(state.sections),
          headerVariantId: state.headerVariantId,
          footerVariantId: state.footerVariantId,
          themeOverride: deepClone(state.themeOverride),
        };
        state.future.push(currentSnapshot);
        const snapshot = state.past.pop()!;
        state.sections = snapshot.sections;
        state.headerVariantId = snapshot.headerVariantId;
        state.footerVariantId = snapshot.footerVariantId;
        state.themeOverride = snapshot.themeOverride ?? {};
        state.saved = false;
      }),

    redo: () =>
      set((state) => {
        if (state.future.length === 0) return;
        const currentSnapshot = {
          sections: deepClone(state.sections),
          headerVariantId: state.headerVariantId,
          footerVariantId: state.footerVariantId,
          themeOverride: deepClone(state.themeOverride),
        };
        state.past.push(currentSnapshot);
        const snapshot = state.future.pop()!;
        state.sections = snapshot.sections;
        state.headerVariantId = snapshot.headerVariantId;
        state.footerVariantId = snapshot.footerVariantId;
        state.themeOverride = snapshot.themeOverride ?? {};
        state.saved = false;
      }),

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,

    loadFromConfig: (config) =>
      set((state) => {
        const templateId = (config.template_id as string) || 'pangkas-rapi';
        const template = getTemplate(templateId) || PANGKAS_RAPI_TEMPLATE;
        state.template = template;
        state.headerVariantId = (config.header_variant_id as string) || template.headers[0].id;
        state.footerVariantId = (config.footer_variant_id as string) || template.footers[0].id;

        if (Array.isArray(config.sections)) {
          state.sections = config.sections.map((s: Record<string, unknown>) => {
            const type = s.type as string;
            const variantId = s.variant_id as string;
            const variant = getSectionVariant(template, type, variantId);
            return {
              id: (s.id as string) || generateId(),
              type,
              variantId,
              config: { ...(variant?.defaultConfig ?? {}), ...(s.config as Record<string, unknown> ?? {}) },
              style: {
                padding: { top: 48, right: 24, bottom: 48, left: 24, ...(s.style as Record<string, unknown>)?.padding as object },
                background: ((s.style as Record<string, unknown>)?.background as 'color' | 'image' | 'gradient' | 'transparent') || 'transparent',
                backgroundColor: (s.style as Record<string, unknown>)?.backgroundColor as string | undefined,
                backgroundImage: (s.style as Record<string, unknown>)?.backgroundImage as string | undefined,
                backgroundGradient: (s.style as Record<string, unknown>)?.backgroundGradient as string | undefined,
              },
              responsive: (s.responsive as Record<string, boolean>) ?? {},
            };
          });
        }

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
        sections: state.sections,
      };
    },
  }))
);
