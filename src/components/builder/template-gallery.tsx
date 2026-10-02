'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Upload, Trash2, Check, Search, Filter, ChevronLeft, ChevronRight, Sparkles, Palette, Layout, Loader2, ExternalLink, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Template } from '@/lib/builder/template-types';
import { BUILTIN_TEMPLATES } from '@/lib/builder/template-store';
import { CATEGORY_LABELS, type BusinessCategory } from '@/lib/builder/templates/catalog';
import { isCatalogTemplateAllowedForTier } from '@/lib/builder/validation';
import { useBuilderStore } from '@/lib/builder/store';

const ITEMS_PER_PAGE = 9;

interface TemplateGalleryProps {
  websiteId: string;
  onApply: (template: UnifiedTemplate) => void;
  onPreview?: (template: UnifiedTemplate) => void;
  onClose?: () => void;
  userTier?: string;
}

type TemplateSource = 'builtin' | 'saved';

interface UnifiedTemplate {
  id: string;
  name: string;
  description: string;
  category: BusinessCategory;
  source: TemplateSource;
  sectionsCount: number;
  tiers?: string[];
  data: Template;
}

export function TemplateGallery({ websiteId, onApply, onPreview, onClose, userTier }: TemplateGalleryProps) {
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<TemplateSource>('builtin');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importName, setImportName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importAutofilled, setImportAutofilled] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState<{ template: UnifiedTemplate | null; open: boolean }>({
    template: null,
    open: false,
  });
  const [resolvedTier, setResolvedTier] = useState<string | null>(null);

  const MAX_IMPORT_SIZE = 25 * 1024 * 1024;

  useEffect(() => {
    if (userTier) {
      setResolvedTier(userTier);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/websites/${websiteId}/website`);
        const json = await res.json();
        if (!cancelled && json.success && typeof json.data?.tier === 'string') {
          setResolvedTier(json.data.tier);
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [websiteId, userTier]);

  const loadSavedTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/templates/library');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setSavedTemplates(json.data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedTemplates();
  }, [loadSavedTemplates]);

  const builtinUnified = useMemo((): UnifiedTemplate[] => {
    return BUILTIN_TEMPLATES.map((t) => ({
      id: `builtin-${t.id}`,
      name: t.name,
      description: t.description,
      category: t.category,
      source: 'builtin' as TemplateSource,
      sectionsCount: t.sections.length,
      tiers: t.tiers ? [...t.tiers] : undefined,
      data: t,
    }));
  }, []);

  const savedUnified = useMemo((): UnifiedTemplate[] => {
    return savedTemplates.map((row) => {
      /**
       * Baris `templates_library` membungkus seluruh isi template di dalam
       * kolom `template_data`. Dulu `data` diisi baris DB utuh, sehingga
       * `template.data.sections/header/footer/...` selalu `undefined` →
       * menerapkan template library menghasilkan homepage kosong tanpa nav,
       * footer, dan SEO. Di sini dibongkar dulu, lalu digabung kembali dengan
       * metadata baris (nama/deskripsi/thumbnail) supaya bentuknya sama
       * persis dengan template bawaan dan semua konsumen (`resolveSections`,
       * form apply, preview) bisa memakai jalur yang sama.
       */
      const rowData = row as unknown as Record<string, unknown>;
      const inner = (rowData.template_data ?? {}) as Record<string, unknown>;
      const sections = Array.isArray(inner.sections) ? inner.sections : [];
      const data = {
        ...inner,
        id: row.id,
        name: row.name,
        description: row.description || String(inner.description ?? ''),
        category: (inner.category as BusinessCategory) ?? 'retail',
        sections,
      } as unknown as Template;

      return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        category: data.category,
        source: 'saved' as TemplateSource,
        sectionsCount: sections.length,
        data,
      };
    });
  }, [savedTemplates]);

  const allTemplates = useMemo(() => [...builtinUnified, ...savedUnified], [builtinUnified, savedUnified]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allTemplates, searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE);
  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTemplates.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTemplates, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, activeTab]);

  const handleExport = async (templateId: string) => {
    try {
      const res = await fetch(`/api/templates/library/${templateId}/export`);
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || 'Export failed');
      }
      const contentType = res.headers.get('content-type') || '';
      const isZip = contentType.includes('zip');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${templateId}.${isZip ? 'zip' : 'json'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export template:', err);
    }
  };

  const handleImport = async () => {
    const trimmedName = importName.trim();
    if (!importFile || !trimmedName || isImporting) return;
    setImportError(null);
    setImportWarnings([]);
    setImportAutofilled([]);
    const fileName = importFile.name.toLowerCase();
    const isZip = fileName.endsWith('.zip');
    const isJson = fileName.endsWith('.json');
    if (!isZip && !isJson) {
      setImportError('File harus berformat .json atau .zip');
      return;
    }
    if (importFile.size > MAX_IMPORT_SIZE) {
      setImportError('Ukuran file melebihi batas 25 MB');
      return;
    }

    setIsImporting(true);
    try {
      if (isZip) {
        // ZIP file upload - use multipart/form-data
        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('name', trimmedName);

        const res = await fetch('/api/templates/library/import', {
          method: 'POST',
          body: formData,
        });

        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          throw new Error(json?.error || `Import gagal (HTTP ${res.status})`);
        }
        // Warnings cakupan aset (file tak dirujuk / field gambar kosong):
        // import tetap sukses. Bila ada warnings, dialog DIBIARKAN terbuka
        // agar user sempat membaca catatan gambar yang bermasalah.
        const zipWarnings = Array.isArray(json?.warnings)
          ? json.warnings.filter((w: unknown) => typeof w === 'string').slice(0, 12)
          : [];
        const zipAutofilled = Array.isArray(json?.autofilled)
          ? json.autofilled.filter((w: unknown) => typeof w === 'string').slice(0, 12)
          : [];
        setImportWarnings(zipWarnings);
        setImportAutofilled(zipAutofilled);
        if (zipWarnings.length === 0 && zipAutofilled.length === 0) {
          setImportFile(null);
          setImportName('');
        }
        loadSavedTemplates();
      } else {
        // JSON file upload
        let data: unknown;
        try {
          const text = await importFile.text();
          data = JSON.parse(text);
        } catch {
          throw new Error('File JSON tidak valid');
        }

        const res = await fetch('/api/templates/library/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            template_data:
              data && typeof data === 'object' && !Array.isArray(data) && 'data' in (data as Record<string, unknown>)
                ? (data as Record<string, unknown>).data
                : data,
          }),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          throw new Error(json?.error || `Import gagal (HTTP ${res.status})`);
        }
        const jsonWarnings = Array.isArray(json?.warnings)
          ? json.warnings.filter((w: unknown) => typeof w === 'string').slice(0, 12)
          : [];
        const jsonAutofilled = Array.isArray(json?.autofilled)
          ? json.autofilled.filter((w: unknown) => typeof w === 'string').slice(0, 12)
          : [];
        setImportWarnings(jsonWarnings);
        setImportAutofilled(jsonAutofilled);
        if (jsonWarnings.length === 0 && jsonAutofilled.length === 0) {
          setImportFile(null);
          setImportName('');
        }
        loadSavedTemplates();
      }
    } catch (err) {
      console.error('Failed to import template:', err);
      setImportError(err instanceof Error ? err.message : 'Import gagal, coba lagi');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Yakin ingin menghapus template ini?')) return;
    try {
      const res = await fetch(`/api/templates/library/${templateId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) loadSavedTemplates();
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const handleApply = async (template: UnifiedTemplate) => {
    setApplyingTemplateId(template.id);
    try {
      await onApply(template);
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setApplyingTemplateId(null);
    }
  };

  const getStyleColors = (template: Template) => {
    return template.theme.palette;
  };

  function TemplateCard({
    template,
    onApply,
    onExport,
    onDelete,
    onPreview,
  }: {
    template: UnifiedTemplate;
    onApply: (template: UnifiedTemplate) => void;
    onExport: (id: string) => void;
    onDelete: (id: string) => void;
    onPreview?: (template: UnifiedTemplate) => void;
  }) {
const colors = getStyleColors(template.data);
  const isBuiltin = template.source === 'builtin';
  const locked =
    isBuiltin &&
    Array.isArray(template.tiers) &&
    template.tiers.length > 0 &&
    !!resolvedTier &&
    !isCatalogTemplateAllowedForTier(template.tiers, resolvedTier);

  const handleApply = () => {
    setShowApplyDialog({ template, open: true });
  };

    return (
      <div
        key={template.id}
        className={`group h-full flex flex-col p-3 gap-2.5 transition-all border-2 rounded-xl ${
          isBuiltin ? 'border-primary/20 bg-primary/5' : 'border-border bg-background'
        } hover:border-primary/50 hover:shadow-md ${applyingTemplateId === template.id ? 'opacity-70 pointer-events-none' : ''}`}
        role="button"
        tabIndex={0}
      >
        <div className="aspect-video rounded-xl overflow-hidden relative bg-gradient-to-br" style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
        }}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 flex items-center justify-center text-white/20">
            <Layout className="w-10 h-10" />
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex gap-2">
            <Badge variant="secondary" className="text-xs">{CATEGORY_LABELS[template.category]}</Badge>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold truncate">{template.name}</h4>
            {isBuiltin && (
              <Badge variant="default" className="bg-primary/10 text-primary text-[10px]">
                <Sparkles className="w-2.5 h-2.5 mr-1" /> Bawaan
              </Badge>
            )}
            {locked && (
              <Badge variant="default" className="bg-amber-100 text-amber-800 text-[10px] dark:bg-amber-900/40 dark:text-amber-200">
                <Lock className="w-2.5 h-2.5 mr-1" /> {(template.tiers ?? []).join(' • ') || 'Premium'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
          <div className="mt-auto flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Palette className="w-3 h-3" />
              {template.sectionsCount} section
            </span>
          </div>
        </div>

{template.source === 'saved' && (
          <div className="flex items-center gap-1 border-t pt-3 mt-2">
            <button className="h-7 w-7 p-1 rounded-md hover:bg-muted transition-colors" onClick={(e) => { e.stopPropagation(); onExport(template.id); }} title="Export">
              <Download className="w-3.5 h-3.5" />
            </button>
            <button className="h-7 w-7 p-1 rounded-md hover:bg-muted transition-colors text-red-500" onClick={(e) => { e.stopPropagation(); onDelete(template.id); }} title="Hapus">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

          <div className="flex gap-2">
            {locked && (
              <Button variant="outline" size="sm" className="h-8 px-2.5 flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40" onClick={(e) => { e.stopPropagation(); window.open('/dashboard/billing', '_blank'); }}>
                <Lock className="w-3.5 h-3.5 mr-1" /> Upgrade untuk Buka
              </Button>
            )}
            <Button variant="default" size="sm" className="h-8 px-2.5 flex-1" onClick={(e) => { e.stopPropagation(); handleApply(); }}>
              <Check className="w-3.5 h-3.5 mr-1" /> Terapkan
            </Button>
            {onPreview && (
              <Button variant="outline" size="sm" className="h-8 px-2.5 flex-1" onClick={(e) => { e.stopPropagation(); onPreview(template); }}>
                <ExternalLink className="w-3.5 h-3.5 mr-1" /> Pratinjau
              </Button>
            )}
</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <Button variant={activeTab === 'builtin' ? 'default' : 'ghost'} size="sm" className="h-8 gap-1.5" onClick={() => { setActiveTab('builtin'); setCurrentPage(1); }}>
            <Sparkles className="w-4 h-4" /> Bawaan ({builtinUnified.length})
          </Button>
          <Button variant={activeTab === 'saved' ? 'default' : 'ghost'} size="sm" className="h-8 gap-1.5" onClick={() => { setActiveTab('saved'); setCurrentPage(1); }}>
            <Layout className="w-4 h-4" /> Tersimpan ({savedUnified.length})
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8" variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
            <Upload className="w-4 h-4 mr-1" /> Import
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json,.zip"
            className="hidden"
            onChange={(e) => {
              setImportError(null);
              setImportFile(e.target.files?.[0] || null);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 p-3 bg-muted/30 rounded-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Cari template... (nama, deskripsi)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-[12px]" />
        </div>
        <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as BusinessCategory | 'all')}>
          <SelectTrigger className="w-full sm:w-48 h-8 text-[12px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {(['food', 'fashion', 'retail', 'handicraft', 'services'] as BusinessCategory[]).map((c) => (
              <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(searchQuery || selectedCategory !== 'all') && (
          <Button variant="ghost" size="sm" className="h-8 px-2.5" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
            <Filter className="w-4 h-4 mr-1" /> Reset
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Menampilkan {paginatedTemplates.length} dari {filteredTemplates.length} template
        {activeTab === 'builtin' && ` (${builtinUnified.length} bawaan`}
        {activeTab === 'saved' && ` (${savedUnified.length} tersimpan)`}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {paginatedTemplates.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <Layout className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h4 className="font-semibold">Tidak ada template ditemukan</h4>
            <p className="text-sm text-muted-foreground mt-1">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          paginatedTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} onApply={handleApply} onExport={handleExport} onDelete={handleDelete} onPreview={onPreview as ((template: UnifiedTemplate) => void) | undefined} />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" className="w-8 h-8" onClick={() => setCurrentPage(page)}>
              {page}
            </Button>
          ))}
          <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {applyingTemplateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl border">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Menerapkan Template...</h3>
            <p className="text-sm text-muted-foreground mt-2">Mohon tunggu, sedang memproses template.</p>
          </div>
        </div>
      )}

      <Dialog open={showApplyDialog.open} onOpenChange={(open) => setShowApplyDialog({ ...showApplyDialog, open })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Terapkan Template</DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 px-2.5 flex-1" onClick={() => setShowApplyDialog({ template: null, open: false })}>
              Batal
            </Button>
            <Button variant="default" size="sm" className="h-8 px-2.5 flex-1" onClick={() => { handleApply(showApplyDialog.template!); setShowApplyDialog({ template: null, open: false }); }} disabled={applyingTemplateId === showApplyDialog.template?.id}>
              {applyingTemplateId === showApplyDialog.template?.id ? (<><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Menerapkan...</>) : (<><Check className="w-3.5 h-3.5 mr-1" /> Ya, Terapkan</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!importFile}
        onOpenChange={(open) => {
          if (!open && !isImporting) {
            setImportFile(null);
            setImportError(null);
            setImportWarnings([]);
            setImportAutofilled([]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              File: <span className="font-medium">{importFile?.name}</span> (
              {importFile ? `${(importFile.size / 1024 / 1024).toFixed(2)} MB` : ''})
            </p>
            <div className="space-y-2">
              <Label htmlFor="import-name">Nama Template</Label>
              <Input
                id="import-name"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder="Template imported"
                maxLength={200}
              />
            </div>
            {importError && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {importError}
              </p>
            )}
            {importAutofilled.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" role="status">
                <p className="font-bold mb-1">Gambar terisi otomatis dari file upload:</p>
                <ul className="list-disc pl-4 space-y-0.5 max-h-40 overflow-y-auto">
                  {importAutofilled.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            {importWarnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200" role="status">
                <p className="font-bold mb-1">Import berhasil dengan catatan — gambar berikut bermasalah:</p>
                <ul className="list-disc pl-4 space-y-0.5 max-h-40 overflow-y-auto">
                  {importWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (isImporting) return;
                setImportFile(null);
                setImportError(null);
                setImportWarnings([]);
                setImportAutofilled([]);
                setImportName('');
              }}
              disabled={isImporting}
            >
              Batal
            </Button>
            {importWarnings.length > 0 || importAutofilled.length > 0 ? (
              <Button
                onClick={() => {
                  setImportFile(null);
                  setImportError(null);
                  setImportWarnings([]);
                  setImportAutofilled([]);
                  setImportName('');
                }}
              >
                Tutup
              </Button>
            ) : (
              <Button onClick={handleImport} disabled={isImporting || !importName.trim()}>
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Mengimpor...
                  </>
                ) : (
                  'Import'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
