'use client';

/**
 * Renderer HTML kustom varian (v3.0 — ekspresi HTML).
 *
 * Dipakai ketika `SectionVariant.html` / `HeaderVariant.html` /
 * `FooterVariant.html` diisi: desain kreatif template dirender langsung
 * dari HTML template, bukan dari branch bawaan `section-renderer.tsx`.
 *
 * - `{{key}}` → nilai config (di-escape).
 * - `{{{key}}}` → nilai config mentah tapi disanitasi (untuk field `html`).
 * - Hasil akhir selalu lewat `sanitizeTemplateHtml` (blokir script/style/
 *   iframe/form/on*).
 *
 * Pembungkus selalu membawa `data-tpl-type` + `data-tpl-variant` agar
 * `data.customCss` template tetap bisa menyasar section ini.
 */

import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import {
  collectHtmlFieldKeys,
  renderVariantHtml,
} from '@/lib/builder/behaviour-script';
import type { ConfigField } from '@/lib/builder/template-types';

interface VariantHtmlRendererProps {
  type: string;
  variantId: string;
  html: string;
  config: Record<string, unknown>;
  configFields?: ConfigField[];
  anchorId?: string;
  className?: string;
  /**
   * Matikan clipping pembungkus (overflow + paint containment).
   * WAJIB false untuk chrome header/footer: varian overlay ber-root
   * `position:absolute` (keluar dari flow → pembungkus tinggi nol), dan
   * dengan clip aktif ia terpotong habis → "tidak muncul" tanpa error.
   * Default true = perilaku lama untuk sections.
   */
  clip?: boolean;
}

/**
 * Style pembungkus renderer. Diekstrak agar bisa di-unit-test:
 * regresi clip pada chrome overlay tidak boleh terulang diam-diam.
 *
 * NOTE: JANGAN menaruh `position:sticky` di sini untuk header — elemen
 * ini tingginya persis setinggi header sehingga sticky tidak punya ruang
 * untuk menempel (toggle "Header menempel" jadi terlihat mati). Sticky
 * dipasang di pembungkus yang induknya tinggi: `.tpl-header-html`
 * (live site) dan slot header kanvas (builder-canvas).
 */
export function chromeRendererStyle(clip: boolean): CSSProperties {
  return clip
    ? {
        contain: 'layout paint style',
        overflow: 'clip',
        isolation: 'isolate',
        position: 'relative',
        zIndex: 'auto',
      }
    : {
        contain: 'layout style',
        isolation: 'isolate',
        position: 'relative',
        zIndex: 'auto',
      };
}

export function VariantHtmlRenderer({
  type,
  variantId,
  html,
  config,
  configFields = [],
  anchorId,
  className,
  clip = true,
}: VariantHtmlRendererProps) {
  const rendered = useMemo(() => {
    const htmlKeys = collectHtmlFieldKeys(
      configFields as Array<{ key: string; type: string; itemFields?: Array<{ key: string; type: string; itemFields?: unknown }> }>,
    );
    return renderVariantHtml(html, config ?? {}, htmlKeys);
  }, [html, config, configFields]);

  if (!rendered.trim()) return null;

  return (
    <div
      id={anchorId}
      data-tpl-type={type}
      data-tpl-variant={variantId}
      className={className}
      style={chromeRendererStyle(clip)}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
