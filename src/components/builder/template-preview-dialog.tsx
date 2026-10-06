'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Monitor, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Template } from '@/lib/builder/template-types';
import { buildPreviewSiteData } from '@/lib/builder/preview-data';
import { PublicWebsiteV3 } from '@/components/website/renderer-v3';

/** Template penuh (bukan seed `data`) — yang dibutuhkan pratinjau. */
export type PreviewableTemplate = Template;

export type PreviewViewportMode = 'desktop' | 'mobile';

/**
 * Pilihan viewport Desktop/Mobile — diekstrak agar bisa di-unit-test
 * (isi Radix Dialog tidak ter-render di static markup).
 */
export function PreviewViewportToggle({
  mode,
  onChange,
}: {
  mode: PreviewViewportMode;
  onChange: (mode: PreviewViewportMode) => void;
}) {
  return (
    <div
      className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-muted"
      role="tablist"
      aria-label="Ukuran layar pratinjau"
    >
      {(
        [
          { key: 'desktop', label: 'Desktop', Icon: Monitor },
          { key: 'mobile', label: 'Mobile', Icon: Smartphone },
        ] as const
      ).map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={mode === key}
          onClick={() => onChange(key)}
          className={`inline-flex items-center gap-1 px-2.5 h-7 rounded-md text-xs font-bold transition-colors ${
            mode === key
              ? 'bg-white dark:bg-slate-800 text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon className="w-3.5 h-3.5" /> {label}
        </button>
      ))}
    </div>
  );
}

/**
 * Dialog pratinjau template: render situs asli (bukan tab baru ke /preview —
 * route itu tidak ada di build yang belum di-deploy sehingga jatuh ke home).
 *
 * Pilihan viewport Desktop/Mobile: mode mobile membatasi lebar konten
 * 390px dalam bingkai HP sehingga layout responsif (container query
 * `.builder-cq`) benar-benar terpicu — bukan sekadar dialog menyempit.
 */
export function TemplatePreviewDialog({
  template,
  onClose,
}: {
  template: PreviewableTemplate | null;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');
  const site = useMemo(
    () => (template ? buildPreviewSiteData(template) : null),
    [template],
  );
  // Elemen bingkai HP untuk portal drawer: overlay menu harus terisolasi
  // di dalam frame (absolute), bukan selayar viewport. Diisi setelah mount
  // — pola yang sama dengan frame kanvas builder.
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [frameEl, setFrameEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    setFrameEl(mode === 'mobile' ? frameRef.current : null);
  }, [mode, site]);

  return (
    <Dialog open={!!template} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="sticky top-0 z-10 flex flex-row items-center justify-between gap-2 px-4 py-3 border-b bg-background space-y-0">
          <DialogTitle className="text-sm truncate">Pratinjau: {template?.name}</DialogTitle>
          <div className="flex items-center gap-2 shrink-0">
            <PreviewViewportToggle mode={mode} onChange={setMode} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2.5"
              onClick={onClose}
              aria-label="Tutup pratinjau"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Tutup
            </Button>
          </div>
        </DialogHeader>
        {site && (
          mode === 'mobile' ? (
            <div className="py-6 px-4 bg-slate-100 dark:bg-slate-950">
              <div
                ref={frameRef}
                className="relative mx-auto w-[390px] max-w-full rounded-[2rem] border-[6px] border-slate-900 dark:border-slate-700 shadow-2xl overflow-hidden bg-white"
              >
                <div className="mx-auto w-24 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mt-2 mb-1" />
                <PublicWebsiteV3 site={{ ...site, drawerContainer: frameEl }} />
              </div>
            </div>
          ) : (
            <PublicWebsiteV3 site={site} />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
