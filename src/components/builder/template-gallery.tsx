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
import type { TemplateLibraryItem } from '@/lib/builder/types';
import { BUILT_IN_CATALOG, CATEGORY_LABELS, type BusinessCategory } from '@/lib/builder/templates/catalog';
import { isCatalogTemplateAllowedForTier } from '@/lib/builder/validation';
import { DESIGN_STYLES } from '@/lib/builder/design-styles';
import { useBuilderStore } from '@/lib/builder/store';

const ITEMS_PER_PAGE = 9;

interface TemplateGalleryProps {
  websiteId: string;
  onApply: (template: TemplateLibraryItem) => void;
  onPreview?: (template: UnifiedTemplate) => void;
  onClose?: () => void;
  /**
   * Tier paket user (free/starter/growth/enterprise).
   * Bila tidak diisi, gallery mengambil sendiri dari API website.
   * Dipakai untuk badge gembok template tier-terbatas.
   */
  userTier?: string;
}

type TemplateSource = 'builtin' | 'saved';

interface UnifiedTemplate {
  id: string;
  name: string;
  description: string;
  category: BusinessCategory;
  designStyleId: string;
  designStyleName: string;
  source: TemplateSource;
  sectionsCount: number;
  /** Tier yang boleh memakai (builtin saja; undefined = semua tier). */
  tiers?: string[];
  data: any;
  thumbnail?: string;
}

export function TemplateGallery({ websiteId, onApply, onPreview, onClose, userTier }: TemplateGalleryProps) {
  const [savedTemplates, setSavedTemplates] = useState<TemplateLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | 'all'>('all');
  const [selectedDesignStyle, setSelectedDesignStyle] = useState<string | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<TemplateSource>('builtin');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importName, setImportName] = useState('');
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const [resolvedTier, setResolvedTier] = useState<string | null>(null);

  // Tier user untuk badge gembok: prop diutamakan, fallback fetch API website.
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
        // abaikan — tanpa tier, semua template tampil terbuka
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [websiteId, userTier]);

  const designStyleId = useBuilderStore((s) => s.designStyleId);
  const paletteOverride = useBuilderStore((s) => s.paletteOverride);
  const sections = useBuilderStore((s) => s.sections);
  const header = useBuilderStore((s) => s.header);
  const footer = useBuilderStore((s) => s.footer);
  const core = useBuilderStore((s) => s.core);
  const seo = useBuilderStore((s) => s.seo);

  // Load saved templates from API
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

  // Convert built-in templates to unified format
  const builtinUnified = useMemo((): UnifiedTemplate[] => {
    return BUILT_IN_CATALOG.map((t) => ({
      id: `builtin-${t.id}`,
      name: t.name,
      description: t.description,
      category: t.category,
      designStyleId: t.data.designStyleId ?? 'minimalist',
      designStyleName: DESIGN_STYLES.find(s => s.id === t.data.designStyleId)?.name ?? t.data.designStyleId ?? 'Minimalist',
      source: 'builtin' as TemplateSource,
      sectionsCount: t.data.sections?.length ?? 0,
      tiers: t.tiers ? [...t.tiers] : undefined,
      data: t.data,
    }));
  }, []);

  // Convert saved templates to unified format
  const savedUnified = useMemo((): UnifiedTemplate[] => {
    return savedTemplates.map((t) => {
      const td = t.template_data as any;
      return {
        id: t.id,
        name: t.name,
        description: t.description || '',
        category: (td.category as BusinessCategory) || 'retail',
        designStyleId: td.design_style_id || td.designStyleId || 'minimalist',
        designStyleName: DESIGN_STYLES.find(s => s.id === (td.design_style_id || td.designStyleId))?.name ?? (td.design_style_id || td.designStyleId || 'minimalist'),
        source: 'saved' as TemplateSource,
        sectionsCount: td.sections?.length ?? 0,
        data: td,
      };
    });
  }, [savedTemplates]);

  // Combine all templates
  const allTemplates = useMemo(() => [...builtinUnified, ...savedUnified], [builtinUnified, savedUnified]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      const matchesStyle = selectedDesignStyle === 'all' || t.designStyleId === selectedDesignStyle;
      return matchesSearch && matchesCategory && matchesStyle;
    });
  }, [allTemplates, searchQuery, selectedCategory, selectedDesignStyle]);

  // Pagination
  const totalPages = Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE);
  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTemplates.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTemplates, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedDesignStyle, activeTab]);

  const handleExport = async (templateId: string) => {
    try {
      const res = await fetch(`/api/templates/library/${templateId}/export`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${templateId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export template:', err);
    }
  };

  const handleImport = async () => {
    if (!importFile || !importName) return;
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);

      const res = await fetch('/api/templates/library/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: importName,
          template_data: data.data || data,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setImportFile(null);
        setImportName('');
        loadSavedTemplates();
      }
    } catch (err) {
      console.error('Failed to import template:', err);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Yakin ingin menghapus template ini?')) return;
    try {
      const res = await fetch(`/api/templates/library/${templateId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        loadSavedTemplates();
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const handleApply = async (template: UnifiedTemplate) => {
    setApplyingTemplateId(template.id);
    try {
      const td = template.data;
      await onApply({
        id: template.id,
        name: template.name,
        description: template.description,
        template_data: td,
      } as unknown as TemplateLibraryItem);
      // Minimum loading duration for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setApplyingTemplateId(null);
    }
  };

  const getStyleColors = (styleId: string) => {
    const style = DESIGN_STYLES.find(s => s.id === styleId);
    return style?.palette || { primary: '#15803D', secondary: '#0d9488', accent: '#f59e0b', background: '#ffffff' };
  };

  // Template Card Component - extracted to allow useState for confirmation
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
    const colors = getStyleColors(template.designStyleId);
    const isBuiltin = template.source === 'builtin';
    const [showConfirm, setShowConfirm] = useState(false);
    const [applying, setApplying] = useState(false);
    // Gembok tier: hanya builtin bertiers + tier user diketahui & tak termasuk.
    const locked =
      isBuiltin &&
      Array.isArray(template.tiers) &&
      template.tiers.length > 0 &&
      !!resolvedTier &&
      !isCatalogTemplateAllowedForTier(template.tiers, resolvedTier);

    const handleApply = async () => {
      setApplying(true);
      try {
        await onApply(template);
      } finally {
        setApplying(false);
        setShowConfirm(false);
      }
    };

    const handlePreviewClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onPreview?.(template);
    };

    return (
      <div
        key={template.id}
        className={`group h-full flex flex-col p-4 gap-3 transition-all border-2 rounded-2xl ${
          isBuiltin ? 'border-primary/20 bg-primary/5' : 'border-border bg-background'
        } hover:border-primary/50 hover:shadow-md ${applying ? 'opacity-70 pointer-events-none' : ''}`}
        role="button"
        tabIndex={0}
      >
        {/* Visual thumbnail */}
        <div className="aspect-video rounded-xl overflow-hidden relative bg-gradient-to-br" style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
        }}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 flex items-center justify-center text-white/20">
            <Layout className="w-12 h-12" />
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex gap-2">
            <Badge variant="secondary" className="text-xs">{CATEGORY_LABELS[template.category]}</Badge>
          </div>
        </div>

        {/* Info */}
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
            <span className="flex items-center gap-1">
              <Layout className="w-3 h-3" />
              {template.designStyleName}
            </span>
          </div>
        </div>

        {/* Action for saved templates */}
        {template.source === 'saved' && (
          <div className="flex items-center gap-1 border-t pt-3 mt-2">
            <button
              className="h-8 w-8 p-1 rounded-lg hover:bg-muted transition-colors"
              onClick={(e) => { e.stopPropagation(); onExport(template.id); }}
              title="Export"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              className="h-8 w-8 p-1 rounded-lg hover:bg-muted transition-colors text-red-500"
              onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
              title="Hapus"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Apply & Preview buttons */}
        <div className="border-t pt-3 mt-2">
          {showConfirm ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
              >
                Batal
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={(e) => { e.stopPropagation(); setShowConfirm(false); handleApply(); }}
                disabled={applying}
              >
                {applying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    Menerapkan...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Ya, Terapkan
                  </>
                )}
              </Button>
            </div>
          ) : locked ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open('/dashboard/billing', '_blank');
                }}
                title={`Template ini untuk paket ${(template.tiers ?? []).join(', ')}`}
              >
                <Lock className="w-3.5 h-3.5 mr-1" />
                Upgrade untuk Buka
              </Button>
              {onPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handlePreviewClick}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Pratinjau
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Terapkan
              </Button>
              {onPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handlePreviewClick}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Pratinjau
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with tabs */}
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === 'builtin' ? 'default' : 'ghost'}
            size="sm"
            className="gap-2"
            onClick={() => { setActiveTab('builtin'); setCurrentPage(1); }}
          >
            <Sparkles className="w-4 h-4" /> Bawaan ({builtinUnified.length})
          </Button>
          <Button
            variant={activeTab === 'saved' ? 'default' : 'ghost'}
            size="sm"
            className="gap-2"
            onClick={() => { setActiveTab('saved'); setCurrentPage(1); }}
          >
            <Layout className="w-4 h-4" /> Tersimpan ({savedUnified.length})
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
            <Upload className="w-4 h-4 mr-1" /> Import
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari template... (nama, deskripsi)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as BusinessCategory | 'all')}>
          <SelectTrigger className="w-full sm:w-48 h-10">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {(['food', 'fashion', 'retail', 'handicraft', 'services'] as BusinessCategory[]).map((c) => (
              <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedDesignStyle} onValueChange={(v) => setSelectedDesignStyle(v)}>
          <SelectTrigger className="w-full sm:w-56 h-10">
            <SelectValue placeholder="Design Style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Style</SelectItem>
            {DESIGN_STYLES.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(searchQuery || selectedCategory !== 'all' || selectedDesignStyle !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedDesignStyle('all'); }}>
            <Filter className="w-4 h-4 mr-1" /> Reset
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Menampilkan {paginatedTemplates.length} dari {filteredTemplates.length} template
        {activeTab === 'builtin' && ` (${builtinUnified.length} bawaan`}
        {activeTab === 'saved' && ` (${savedUnified.length} tersimpan)`}
      </p>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {paginatedTemplates.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <Layout className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h4 className="font-semibold">Tidak ada template ditemukan</h4>
            <p className="text-sm text-muted-foreground mt-1">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          paginatedTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onApply={handleApply}
              onExport={handleExport}
              onDelete={handleDelete}
              onPreview={onPreview}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              className="w-10 h-10"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Global Applying Overlay */}
      {applyingTemplateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl border">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Menerapkan Template...</h3>
            <p className="text-sm text-muted-foreground mt-2">Mohon tunggu, sedang memproses template.</p>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={!!importFile} onOpenChange={() => setImportFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-name">Nama Template</Label>
              <Input id="import-name" value={importName} onChange={(e) => setImportName(e.target.value)} placeholder="Template imported" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportFile(null)}>Batal</Button>
            <Button onClick={handleImport}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}