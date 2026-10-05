import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CoreConfig, NavItem, Section, HeaderConfig, FooterConfig } from './types';
import type { PaletteOverride } from './design-styles';
import { getSectionVariant } from './sections/registry';
import { builderConfigSchema } from '@/types';

export interface TypographyOverride {
  headingFont?: string;
  bodyFont?: string;
}

interface Snapshot {
  sections: Section[];
  core: CoreConfig;
  seo: { title: string; description: string };
  paletteOverride: PaletteOverride;
  typographyOverride: TypographyOverride;
  header: HeaderConfig;
  footer: FooterConfig;
}

export interface BuilderState {
  core: CoreConfig;
  seo: { title: string; description: string };
  paletteOverride: PaletteOverride;
  typographyOverride: TypographyOverride;
  sections: Section[];
  header: HeaderConfig;
  footer: FooterConfig;
  selectedWidgetId: string | null;
  selectedRowId: string | null;
  selectedColumnId: string | null;
  selectedSectionId: string | null;
  viewportWidth: number;
  saved: boolean;
  past: Snapshot[];
  future: Snapshot[];

  updateCore: (updates: Partial<CoreConfig>) => void;
  updateSeo: (seo: { title: string; description: string }) => void;
  addNavItem: (location: 'header' | 'footer') => void;
  updateNavItem: (location: 'header' | 'footer', id: string, updates: Partial<NavItem>) => void;
  deleteNavItem: (location: 'header' | 'footer', id: string) => void;
  reorderNavItems: (location: 'header' | 'footer', fromIndex: number, toIndex: number) => void;
  selectWidget: (id: string | null) => void;

  setViewportWidth: (width: number) => void;
  updatePaletteOverride: (patch: PaletteOverride) => void;
  resetPaletteOverride: () => void;
  updateTypographyOverride: (patch: TypographyOverride) => void;
  resetTypographyOverride: () => void;
  addSection: (type: Section['type'], variant: string) => void;
  insertSectionAt: (type: Section['type'], variant: string, index: number) => void;
  deleteSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  selectSection: (id: string | null) => void;
  updateHeader: (updates: Partial<HeaderConfig>) => void;
  updateFooter: (updates: Partial<FooterConfig>) => void;

  loadConfig: (config: { core?: Partial<CoreConfig> | Record<string, unknown>; paletteOverride?: PaletteOverride; palette_override?: PaletteOverride; sections?: Section[]; header?: Partial<HeaderConfig>; footer?: Partial<FooterConfig>; theme?: Record<string, unknown> }) => void;
  // `save`/`publish` dihapus: Builder Global (/dashboard/builder) dipensiunkan.
  // Penyimpanan sekarang milik page-builder (lihat app/dashboard/websites/
  // page-builder/[pageId]/page.tsx) yang memakai builderConfigSchema langsung.

  applyTemplate: (template: { core?: Partial<CoreConfig> }) => void;
  applyFullTemplate: (template: import('./types').FullTemplateData) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function generateId(): string {
  return crypto.randomUUID();
}

function deepClone<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneSections(sections: Section[]): Section[] {
  return deepClone(sections);
}

function createDefaultCore(): CoreConfig {
  return {
    site_title: 'Toko Saya',
    tagline: 'Produk berkualitas untuk Anda',
    favicon_url: '',
    logo_url: '',
    header_nav: [
      { id: generateId(), label: 'Beranda', url: '/', isExternal: false, enabled: true },
      { id: generateId(), label: 'Produk', url: '/produk', isExternal: false, enabled: true },
      { id: generateId(), label: 'Tentang', url: '/tentang', isExternal: false, enabled: true },
    ],
    footer_nav: [
      { id: generateId(), label: 'Beranda', url: '/', isExternal: false, enabled: true },
      { id: generateId(), label: 'Kontak', url: '/kontak', isExternal: false, enabled: true },
    ],
    footer_text: `© ${new Date().getFullYear()} Toko Saya. Hak Cipta Dilindungi.`,
  };
}

function createDefaultHeader(): HeaderConfig {
  return {
    variant: 'standard',
    logoUrl: '',
    siteTitle: 'Toko Saya',
    tagline: 'Produk berkualitas untuk Anda',
    navItems: [
      { id: generateId(), label: 'Beranda', url: '/', isExternal: false, enabled: true },
      { id: generateId(), label: 'Produk', url: '/produk', isExternal: false, enabled: true },
      { id: generateId(), label: 'Tentang', url: '/tentang', isExternal: false, enabled: true },
    ],
    ctaText: 'Hubungi Kami',
    ctaLink: '/kontak',
    showCta: true,
    sticky: true,
    faviconUrl: '',
    seo: { title: '', description: '' },
  };
}

function createDefaultFooter(): FooterConfig {
  return {
    style: 'simple',
    text: `© ${new Date().getFullYear()} Toko Saya. Hak Cipta Dilindungi.`,
    navItems: [
      { id: generateId(), label: 'Beranda', url: '/', isExternal: false, enabled: true },
      { id: generateId(), label: 'Kontak', url: '/kontak', isExternal: false, enabled: true },
    ],
    showSocial: true,
    socialLinks: {},
    address: '',
    phone: '',
    email: '',
    whatsapp: '',
    showWhatsApp: true,
  };
}

export const useBuilderStore = create<BuilderState>()(
  immer((set, get) => ({
    core: createDefaultCore(),
    seo: { title: "", description: "" },
    paletteOverride: {},
    typographyOverride: {},
    sections: [],
    header: createDefaultHeader(),
    footer: createDefaultFooter(),
    selectedWidgetId: null,
    selectedRowId: null,
    selectedColumnId: null,
    selectedSectionId: null,
    viewportWidth: 1024,
    saved: true,
    past: [],
    future: [],

    updateCore: (updates) =>
      set((state) => {
        Object.assign(state.core, updates);
        state.saved = false;
      }),

    updateSeo: (seo) =>
      set((state) => {
        state.seo = { ...state.seo, ...seo };
        state.saved = false;
      }),

    addNavItem: (location) =>
      set((state) => {
        const nav = location === 'header' ? state.header.navItems : state.footer.navItems;
        nav.push({
          id: generateId(),
          label: 'Link Baru',
          url: '/',
          isExternal: false,
          enabled: true,
        });
        state.saved = false;
      }),

    updateNavItem: (location, id, updates) =>
      set((state) => {
        const nav = location === 'header' ? state.header.navItems : state.footer.navItems;
        const item = nav.find((n) => n.id === id);
        if (item) {
          Object.assign(item, updates);
          state.saved = false;
        }
      }),

    deleteNavItem: (location, id) =>
      set((state) => {
        const nav = location === 'header' ? state.header.navItems : state.footer.navItems;
        const index = nav.findIndex((n) => n.id === id);
        if (index !== -1) {
          nav.splice(index, 1);
          state.saved = false;
        }
      }),

    reorderNavItems: (location, fromIndex, toIndex) =>
      set((state) => {
        const nav = location === 'header' ? state.header.navItems : state.footer.navItems;
        if (fromIndex < 0 || fromIndex >= nav.length) return;
        const [moved] = nav.splice(fromIndex, 1);
        if (!moved) return;
        nav.splice(Math.max(0, Math.min(toIndex, nav.length)), 0, moved);
        state.saved = false;
      }),

    selectWidget: (id) =>
      set((state) => {
        state.selectedWidgetId = id;
      }),

    setViewportWidth: (width) =>
      set((state) => {
        state.viewportWidth = width;
      }),

    updatePaletteOverride: (patch) =>
      set((state) => {
        state.paletteOverride = { ...state.paletteOverride, ...patch };
        state.saved = false;
      }),

    resetPaletteOverride: () =>
      set((state) => {
        state.paletteOverride = {};
        state.saved = false;
      }),

    updateTypographyOverride: (patch) =>
      set((state) => {
        const next: TypographyOverride = { ...state.typographyOverride };
        for (const [k, v] of Object.entries(patch)) {
          if (typeof v === 'string' && v.trim().length > 0) {
            (next as Record<string, string>)[k] = v.trim();
          } else {
            delete (next as Record<string, unknown>)[k];
          }
        }
        state.typographyOverride = next;
        state.saved = false;
      }),

    resetTypographyOverride: () =>
      set((state) => {
        state.typographyOverride = {};
        state.saved = false;
      }),

    addSection: (type, variant) =>
      set((state) => {
        const variantDef = getSectionVariant(type, variant);
        state.sections.push({
          id: generateId(),
          type,
          variant,
          config: structuredClone(variantDef?.defaultConfig ?? {}),
          style: {
            padding: { top: 64, right: 24, bottom: 64, left: 24 },
            background: 'transparent' as const,
            ...(variantDef?.defaultStyle ?? {}),
          },
          responsive: {},
        });
        state.saved = false;
      }),

    insertSectionAt: (type, variant, index) =>
      set((state) => {
        const variantDef = getSectionVariant(type, variant);
        state.sections.splice(index, 0, {
          id: generateId(),
          type,
          variant,
          config: structuredClone(variantDef?.defaultConfig ?? {}),
          style: {
            padding: { top: 64, right: 24, bottom: 64, left: 24 },
            background: 'transparent' as const,
            ...(variantDef?.defaultStyle ?? {}),
          },
          responsive: {},
        });
        state.saved = false;
      }),

    deleteSection: (id) =>
      set((state) => {
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
        const duplicate: Section = {
          ...deepClone(original),
          id: crypto.randomUUID(),
        };
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

    updateHeader: (updates) =>
      set((state) => {
        state.header = { ...state.header, ...updates };
        state.saved = false;
      }),

    updateFooter: (updates) =>
      set((state) => {
        state.footer = { ...state.footer, ...updates };
        state.saved = false;
      }),

    loadConfig: (config: { core?: Partial<CoreConfig> | Record<string, unknown>; paletteOverride?: PaletteOverride; palette_override?: PaletteOverride; sections?: Section[]; header?: Partial<HeaderConfig>; footer?: Partial<FooterConfig>; theme?: Record<string, unknown>; seo?: { title: string; description: string } }) =>
      set((state) => {
        if (config.core) {
          state.core = { ...createDefaultCore(), ...config.core };
        }
        const override = config.paletteOverride ?? config.palette_override;
        if (override) {
          state.paletteOverride = { ...override };
        }
        if (config.sections) {
          // Ensure all sections have unique IDs and valid style
          const seenIds = new Set<string>();
          state.sections = config.sections.map((s) => {
            let newId = s.id;
            if (!newId || seenIds.has(newId)) {
              newId = generateId();
            }
            seenIds.add(newId);
            // Ensure style has required properties
            const defaultStyle = {
              padding: { top: 64, right: 24, bottom: 64, left: 24 },
              background: 'transparent' as const,
            };
            // Ensure config has variant defaults
            const variant = getSectionVariant(s.type, s.variant);
            const defaultConfig = variant?.defaultConfig ?? {};
            return {
              ...s,
              id: newId,
              config: { ...defaultConfig, ...(s.config ?? {}) },
              style: { ...defaultStyle, ...(s.style ?? {}) },
            };
          });
        }
        if (config.header) {
          state.header = { ...createDefaultHeader(), ...config.header };
        } else {
          state.header = { ...createDefaultHeader(), ...state.header };
        }
        if (config.footer) {
          state.footer = { ...createDefaultFooter(), ...config.footer };
        } else {
          state.footer = { ...createDefaultFooter(), ...state.footer };
        }
        if (config.theme) {
          const typo = (config.theme as Record<string, unknown>)?.typography;
          if (typo && typeof typo === 'object' && !Array.isArray(typo)) {
            const next: TypographyOverride = {};
            for (const [k, v] of Object.entries(typo as Record<string, unknown>)) {
              if ((k === 'headingFont' || k === 'bodyFont') && typeof v === 'string' && v.trim().length > 0) {
                next[k as 'headingFont' | 'bodyFont'] = v.trim();
              }
            }
            state.typographyOverride = next;
          } else {
            state.typographyOverride = {};
          }
        } else {
          state.typographyOverride = {};
        }
        if (config.seo) {
          state.seo = { ...state.seo, ...config.seo };
        }
        state.past = [];
        state.future = [];
        state.saved = true;
      }),

    applyTemplate: (template) =>
      set((state) => {
        state.past.push({ sections: cloneSections(state.sections), core: { ...state.core }, seo: { ...state.seo }, paletteOverride: { ...state.paletteOverride }, typographyOverride: { ...state.typographyOverride }, header: { ...state.header }, footer: { ...state.footer } });
        state.future = [];
        if (template.core) {
          state.core = { ...createDefaultCore(), ...template.core };
        }
        state.saved = false;
      }),

    applyFullTemplate: (template) =>
      set((state) => {
        state.past.push({ sections: cloneSections(state.sections), core: { ...state.core }, seo: { ...state.seo }, paletteOverride: { ...state.paletteOverride }, typographyOverride: { ...state.typographyOverride }, header: { ...state.header }, footer: { ...state.footer } });
        state.future = [];
        if (template.sections) {
          state.sections = template.sections.map((s) => {
            const variant = getSectionVariant(s.type, s.variant);
            return {
              id: generateId(),
              type: s.type,
              variant: s.variant,
              config: structuredClone({ ...(variant?.defaultConfig ?? {}), ...(s.config ?? {}) }),
              style: {
                padding: { top: 64, right: 24, bottom: 64, left: 24 },
                background: 'transparent' as const,
                ...(variant?.defaultStyle ?? {}),
                ...(s.style ?? {}),
              },
              responsive: {},
            };
          });
        }
        if (template.header) state.header = { ...createDefaultHeader(), ...template.header };
        if (template.footer) state.footer = { ...createDefaultFooter(), ...template.footer };
        // Skema warna selalu ikut template (atau direset ke bawaan tema).
        // Tanpa reset, override kustom template lama menempel di template baru.
        const tplOverride = template.paletteOverride ?? template.palette_override;
        state.paletteOverride = tplOverride ? { ...tplOverride } : {};
        // Font kustom ikut direset seperti palet: template baru = mulai segar.
        state.typographyOverride = {};
        if (template.seo) state.seo = { ...state.seo, ...template.seo };
        if (template.core) state.core = { ...createDefaultCore(), ...template.core };
        state.selectedSectionId = null;
        state.saved = false;
      }),


    undo: () =>
      set((state) => {
        if (state.past.length === 0) return;
        const currentSnapshot: Snapshot = {
          sections: cloneSections(state.sections),
          core: { ...state.core },
          seo: { ...state.seo },
          paletteOverride: { ...state.paletteOverride },
          typographyOverride: { ...state.typographyOverride },
          header: { ...state.header },
          footer: { ...state.footer },
        };
        state.future.push(currentSnapshot);
        const snapshot = state.past.pop()!;
        state.sections = snapshot.sections;
        state.core = snapshot.core;
        state.seo = snapshot.seo;
        state.paletteOverride = snapshot.paletteOverride ?? {};
        state.typographyOverride = snapshot.typographyOverride ?? {};
        state.header = snapshot.header;
        state.footer = snapshot.footer;
        state.saved = false;
      }),

    redo: () =>
      set((state) => {
        if (state.future.length === 0) return;
        const currentSnapshot: Snapshot = {
          sections: cloneSections(state.sections),
          core: { ...state.core },
          seo: { ...state.seo },
          paletteOverride: { ...state.paletteOverride },
          typographyOverride: { ...state.typographyOverride },
          header: { ...state.header },
          footer: { ...state.footer },
        };
        state.past.push(currentSnapshot);
        const snapshot = state.future.pop()!;
        state.sections = snapshot.sections;
        state.core = snapshot.core;
        state.seo = snapshot.seo;
        state.paletteOverride = snapshot.paletteOverride ?? {};
        state.typographyOverride = snapshot.typographyOverride ?? {};
        state.header = snapshot.header;
        state.footer = snapshot.footer;
        state.saved = false;
      }),

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  }))
);