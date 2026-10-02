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
}

export function VariantHtmlRenderer({
  type,
  variantId,
  html,
  config,
  configFields = [],
  anchorId,
  className,
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
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
