import type { SectionConfig } from "@/types";
import { FREE_TEMPLATE_NAMES } from "@/types";

/**
 * Sprint 01 — Template Fixed Builder helpers.
 * TIDAK ada drag & drop: urutan section selalu ikut template,
 * client hanya kirim override {enabled, style, content} per section_id.
 */

export { FREE_TEMPLATE_NAMES };

export function isTrialActive(trialEndsAt: string | null | undefined): boolean {
  if (!trialEndsAt) return false;
  const ends = new Date(trialEndsAt).getTime();
  if (Number.isNaN(ends)) return false;
  return ends >= Date.now();
}

/**
 * Template yang boleh dipakai user.
 * Trial aktif ATAU tier berbayar → semua. Free (trial habis) → 3 template dasar.
 */
export function getAllowedTemplateNames(
  tier: string | null | undefined,
  trialEndsAt: string | null | undefined,
  allNames: string[]
): string[] {
  if (tier !== "free" || isTrialActive(trialEndsAt)) return allNames;
  const free = FREE_TEMPLATE_NAMES as readonly string[];
  return allNames.filter((n) => free.includes(n));
}

export interface SectionOverride {
  id: string;
  enabled?: boolean;
  style?: Record<string, unknown>;
  content?: Record<string, unknown>;
}

export interface MergedSection {
  id: string;
  type: string;
  label: string;
  enabled: boolean;
  required: boolean;
  order: number;
  style: Record<string, unknown>;
  content: Record<string, unknown>;
}

type MergeResult = { ok: true; sections: MergedSection[] } | { ok: false; error: string };

/**
 * Merge override client dengan defaults template (urut fixed template).
 * - Tolak section_id di luar whitelist template.
 * - Section required tidak boleh dimatikan.
 */
export function mergeAndValidateSections(
  templateSections: SectionConfig[],
  overrides: SectionOverride[] | undefined
): MergeResult {
  const list = Array.isArray(overrides) ? overrides : [];
  const whitelist = new Set(templateSections.map((s) => s.id));

  for (const o of list) {
    if (!o || typeof o.id !== "string" || !whitelist.has(o.id)) {
      const badId = (o as { id?: unknown } | null)?.id ?? "?";
      return { ok: false, error: `Section tidak dikenal: ${String(badId)}` };
    }
  }

  const byId = new Map(list.map((o) => [o.id, o]));
  const sections: MergedSection[] = [...templateSections]
    .sort((a, b) => a.order - b.order)
    .map((t) => {
      const o = byId.get(t.id);
      const defaultProps = (t.default_props ?? {}) as Record<string, unknown>;
      return {
        id: t.id,
        type: t.type,
        label: t.label,
        enabled: o?.enabled ?? true,
        required: t.required,
        order: t.order,
        style: { ...(o?.style ?? {}) },
        content: { ...defaultProps, ...(o?.content ?? {}) },
      };
    });

  const disabledRequired = sections.find((s) => s.required && !s.enabled);
  if (disabledRequired) {
    return { ok: false, error: `Section wajib tidak boleh dimatikan: ${disabledRequired.label}` };
  }
  return { ok: true, sections };
}

/** Hitung item produk di section product_grid yang aktif (untuk limit Free). */
export function countProductItems(sections: MergedSection[]): number {
  let n = 0;
  for (const s of sections) {
    if (!s.enabled || s.type !== "product_grid") continue;
    const items = (s.content as { items?: unknown })?.items;
    if (Array.isArray(items)) n += items.length;
  }
  return n;
}
