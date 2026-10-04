'use client';

import { useState, useEffect, useMemo } from 'react';
import { Check, Search, Filter, ChevronLeft, ChevronRight, Sparkles, Palette, Layout, Loader2, ExternalLink, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { BUILT_IN_CATALOG, CATEGORY_LABELS, type BusinessCategory } from '@/lib/builder/templates/catalog';
import { isCatalogTemplateAllowedForTier } from '@/lib/builder/validation';

const ITEMS_PER_PAGE = 9;

interface TemplateGalleryProps {
  websiteId: string;
  onApply: (template: UnifiedTemplate) => void;
  onPreview?: (template: UnifiedTemplate) => void;
  onClose?: () => void;
  userTier?: string;
}

interface UnifiedTemplate {
  id: string;
  name: string;
  description: string;
  category: BusinessCategory;
  source: 'builtin';
  sectionsCount: number;
  tiers?: string[];
  data: Template;
}

export function TemplateGallery({ websiteId, onApply, onPreview, onClose, userTier }: TemplateGalleryProps) {
  void websiteId;
  void onClose;
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState<{ template: UnifiedTemplate | null; open: boolean }>({
    template: null,
    open: false,
  });
  const [resolvedTier, setResolvedTier] = useState<string | null>(null);

  // Katalog statis dari kode — tanpa fetch (templates_library dihapus).
  const systemTemplates = BUILT_IN_CATALOG;

  // Resolve tier tenant untuk badge/lock katalog builtin: pakai prop bila
  // diberikan parent, kalau tidak fetch /api/user/plan. Tetap null = permissive
  // di client (server sudah melakukan tier gating), jadi tidak menyembunyikan.
  useEffect(() => {
    if (userTier) {
      setResolvedTier(userTier);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/plan');
        const json = await res.json().catch(() => null);
        const t = json?.data?.tier;
        if (!cancelled && typeof t === 'string' && t) setResolvedTier(t);
      } catch {
        // abaikan — server sudah gate, client tetap permissive
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userTier]);

  const builtinUnified = useMemo((): UnifiedTemplate[] => {
    return systemTemplates
      .filter((t) => isCatalogTemplateAllowedForTier(t.tiers, resolvedTier))
      .map((t) => ({
        // ID = slug katalog statis (mis. 'food'). Tanpa prefix.
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        source: 'builtin' as const,
        sectionsCount: t.data.sections?.length ?? 0,
        tiers: t.tiers ? [...t.tiers] : undefined,
        data: t as unknown as Template,
      }));
  }, [resolvedTier]);

  const filteredTemplates = useMemo(() => {
    return builtinUnified.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [builtinUnified, searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE);
  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTemplates.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTemplates, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const handleApply = async (template: UnifiedTemplate) => {
    if (applyingTemplateId) return;
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
    onPreview,
  }: {
    template: UnifiedTemplate;
    onPreview?: (template: UnifiedTemplate) => void;
  }) {
const colors = getStyleColors(template.data);
  const locked =
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
        className={`group h-full flex flex-col p-3 gap-2.5 transition-all border-2 rounded-xl border-primary/20 bg-primary/5 hover:border-primary/50 hover:shadow-md ${applyingTemplateId === template.id ? 'opacity-70 pointer-events-none' : ''}`}
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
            <Badge variant="default" className="bg-primary/10 text-primary text-[10px]">
              <Sparkles className="w-2.5 h-2.5 mr-1" /> Bawaan
            </Badge>
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
      <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
        <Button variant="default" size="sm" className="h-8 gap-1.5">
          <Sparkles className="w-4 h-4" /> Katalog ({builtinUnified.length})
        </Button>
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
        Menampilkan {paginatedTemplates.length} dari {filteredTemplates.length} template ({builtinUnified.length} bawaan)
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
            <TemplateCard key={template.id} template={template} onPreview={onPreview as ((template: UnifiedTemplate) => void) | undefined} />
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
    </div>
  );
}
