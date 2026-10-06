'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, Search, Filter, ChevronLeft, ChevronRight, Sparkles, Palette, Layout, Loader2, Eye, Lock, Library, Trash2 } from 'lucide-react';
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
import { savedToCatalogEntry, type SavedTemplateEntry } from '@/lib/builder/apply-template';
import { TemplatePreviewDialog } from '@/components/builder/template-preview-dialog';

const ITEMS_PER_PAGE = 9;

interface TemplateGalleryProps {
  websiteId: string;
  onApply: (template: UnifiedTemplate) => void;
  /**
   * Terapkan template library user (ganti template aktif). Terpisah dari
   * `onApply` karena bentuk datanya berbeda: item library menyimpan config
   * lengkap, bukan referensi ke katalog.
   */
  onApplySaved?: (saved: SavedTemplateEntry) => void | Promise<void>;
  /**
   * Hapus template library user. Hanya berlaku untuk item `source: 'saved'` —
   * template bawaan (katalog) tidak bisa dihapus. Setelah berhasil, galeri
   * memuat ulang daftarnya sendiri supaya kartu yang dihapus hilang tanpa
   * reload halaman.
   */
  onDeleteSaved?: (saved: SavedTemplateEntry) => void | Promise<void>;
  onClose?: () => void;
  userTier?: string;
}

interface UnifiedTemplate {
  id: string;
  name: string;
  description: string;
  category: BusinessCategory;
  source: 'builtin' | 'saved';
  sectionsCount: number;
  tiers?: string[];
  data: Template;
  /** Terisi hanya untuk `source: 'saved'` — config aslinya dari library. */
  saved?: SavedTemplateEntry;
}

export function TemplateGallery({ websiteId, onApply, onApplySaved, onDeleteSaved, onClose, userTier }: TemplateGalleryProps) {
  void websiteId;
  void onClose;
  const [loading] = useState(false);
  // Template library user (disimpan lewat "Simpan sebagai Template"). Dimuat
  // terpisah dari katalog statis: katalog berasal dari kode, library dari DB.
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplateEntry[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  // Tab: Katalog (template bawaan dari kode) vs Library (desain tersimpan user).
  // Satu tab untuk keduanya supaya tidak ada daftar "cuma satu" yang terasa
  // seperti fitur setengah jadi.
  const [tab, setTab] = useState<'catalog' | 'library'>('catalog');

  /**
 * Muat ulang daftar library saja.
 *
 * Dipisah dari effect mount supaya bisa dipanggil ulang setelah hapus tanpa
 * menyalakan ulang seluruh state UI (tab, pencarian, paginasi) dan tanpa
 * reload halaman.
 */
  const loadSavedTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/templates?library=1');
      const json = await res.json();
      if (json?.success && Array.isArray(json.data?.saved)) {
        setSavedTemplates(json.data.saved as SavedTemplateEntry[]);
      }
    } catch {
      // Gagal memuat library tidak boleh memblokir galeri katalog.
    }
  }, []);

  // Id template yang sedang dihapus — menonaktifkan + spinner hanya pada kartu
  // itu, bukan seluruh galeri.
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Dialog konfirmasi hapus. Dipisah dari `showApplyDialog` karena aksi ini
  // merusak (hapus aset user) dan harus punya konfirmasi tersendiri.
  const [showDeleteDialog, setShowDeleteDialog] = useState<{
    saved: SavedTemplateEntry | null;
    open: boolean;
  }>({ saved: null, open: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/templates?library=1');
        const json = await res.json();
        if (cancelled) return;
        if (json?.success && Array.isArray(json.data?.saved)) {
          setSavedTemplates(json.data.saved as SavedTemplateEntry[]);
        }
      } catch {
        // Gagal memuat library tidak boleh memblokir galeri katalog.
      } finally {
        if (!cancelled) setSavedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState<{ template: UnifiedTemplate | null; open: boolean }>({
    template: null,
    open: false,
  });
  // Pratinjau in-modal: render template ASLI (bukan tab baru ke /preview —
  // route itu tidak ada di build yang belum di-deploy sehingga jatuh ke home).
  const [previewTemplate, setPreviewTemplate] = useState<UnifiedTemplate | null>(null);
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
      // Item library menyimpan config-nya sendiri, jadi jalurnya berbeda dan
      // TIDAK lewat `onApply` (yang membangun config dari katalog).
      if (template.source === 'saved' && template.saved) {
        await onApplySaved?.(template.saved);
      } else {
        await onApply(template);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setApplyingTemplateId(null);
    }
  };

  const handleDeleteSaved = async (saved: SavedTemplateEntry) => {
    if (!onDeleteSaved) return;
    setDeletingId(saved.id);
    try {
      await onDeleteSaved(saved);
      // Muat ulang daftar supaya kartu hilang sesuai kondisi server. Kalau
      // hapus ternyata gagal, daftar tidak berubah dan pesan error dari parent
      // yang tampil — jadi tidak ada state yang mengklaim berhasil padahal tidak.
      await loadSavedTemplates();
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Ubah entri library menjadi `UnifiedTemplate` supaya bisa dirender oleh
   * `TemplateCard` yang SAMA dengan katalog — bukan kartu terpisah yang
   * lama-lama pasti tampilannya melenceng.
   *
   * `data` diambil dari template katalog dasar (base_slug) karena library
   * hanya menyimpan config, bukan definisi template. Warna preview di-overwrite
   * dengan palette yang tersimpan supaya kartu mencerminkan desain sebenarnya.
   */
  const savedUnified = useMemo<UnifiedTemplate[]>(
    () =>
      savedTemplates
        .map((saved): UnifiedTemplate | null => {
          // `savedToCatalogEntry` yang menimpakan palette override — dipakai juga
          // oleh halaman /web-design, jadi kartu library di kedua tempat sama.
          const data = savedToCatalogEntry(saved, BUILT_IN_CATALOG) as Template | null;
          if (!data) return null;
          return {
            id: saved.id,
            name: saved.name,
            description: `Desain tersimpanmu — ${saved.sections_count} blok${
              saved.updated_at
                ? `, disimpan ${new Date(saved.updated_at).toLocaleDateString('id-ID')}`
                : ''
            }.`,
            category: data.category,
            source: 'saved',
            sectionsCount: saved.sections_count,
            data,
            saved,
          };
        })
        .filter((t): t is UnifiedTemplate => t !== null),
    [savedTemplates],
  );

  const getStyleColors = (template: Template) => {
    return template.theme.palette;
  };

  function TemplateCard({
    template,
  }: {
    template: UnifiedTemplate;
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

  const handleDelete = () => {
    // Hanya item library yang punya entri `saved`; template bawaan tidak bisa
    // dihapus sehingga tombolnya tidak pernah dirender untuk mereka.
    if (!template.saved) return;
    setShowDeleteDialog({ saved: template.saved, open: true });
  };

  const isDeleting = deletingId === template.id;

    return (
      <div
        key={template.id}
        className={`group h-full flex flex-col p-3 gap-2.5 transition-all border-2 rounded-xl border-primary/20 bg-primary/5 hover:border-primary/50 hover:shadow-md ${applyingTemplateId === template.id || isDeleting ? 'opacity-70 pointer-events-none' : ''}`}
        role="button"
        tabIndex={0}
      >
        <div className="aspect-video rounded-xl overflow-hidden relative bg-gradient-to-br" style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
        }}>
          {template.source === 'builtin' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/thumbnails/${template.id}.jpg`}
              alt={`Pratinjau ${template.name}`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-top"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
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
            <Badge variant="default" className={template.source === 'saved'
              ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200 text-[10px]'
              : 'bg-primary/10 text-primary text-[10px]'}>
              {template.source === 'saved' ? (
                <><Library className="w-2.5 h-2.5 mr-1" /> Tersimpan</>
              ) : (
                <><Sparkles className="w-2.5 h-2.5 mr-1" /> Bawaan</>
              )}
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
            <Button variant="outline" size="sm" className="h-8 px-2.5 flex-1" onClick={(e) => { e.stopPropagation(); setPreviewTemplate(template); }}>
              <Eye className="w-3.5 h-3.5 mr-1" /> Pratinjau
            </Button>
            {template.saved && (
              // `e.stopPropagation()` wajib: kartu punya role="button" dan
              // `handleApply`, jadi tanpa itu klik Hapus ikut membuka dialog
              // "Terapkan".
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                disabled={isDeleting}
                title="Hapus template ini dari library"
                aria-label={`Hapus template ${template.name}`}
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              >
                {isDeleting ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Menghapus</>
                ) : (
                  <><Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus</>
                )}
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
      {/* ============ Tab: Katalog | Library ============
          Dua sumber template disatukan dalam satu tempat: katalog bawaan
          (dari kode) dan library desain milik user (dari DB).

          Diletakkan paling atas, langsung di bawah judul modal, supaya
          memilih sumber template adalah keputusan pertama — bukan sesuatu
          yang baru ditemukan setelah baris pencarian. Baris "Katalog (N)"
          yang sebelumnya ada di posisi ini adalah sisa UI lama tanpa onClick
          (selalu aktif, tidak pernah mengubah apa pun), makanya dihapus. */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted w-fit" role="tablist">
        {(['catalog', 'library'] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[13px] font-bold transition-colors ${
              tab === key
                ? 'bg-white dark:bg-slate-800 text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {key === 'catalog' ? (
              <><Layout className="w-3.5 h-3.5" /> Katalog</>
            ) : (
              <><Library className="w-3.5 h-3.5" /> Library
                {savedTemplates.length > 0 && (
                  <span className="text-[10px] font-bold bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200 px-1.5 rounded-full tabular-nums">
                    {savedTemplates.length}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Pencarian + filter kategori hanya relevan untuk katalog — query-nya
          memfilter `builtinUnified`, jadi menampilkannya di tab Library
          memberi kendali yang tidak melakukan apa-apa. */}
      {tab === 'catalog' && (
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
      )}


      <p className="text-sm text-muted-foreground">
        {tab === 'catalog'
          ? `Menampilkan ${paginatedTemplates.length} dari ${filteredTemplates.length} template (${builtinUnified.length} bawaan)`
          : 'Desain yang kamu simpan sendiri. Memilih salah satu akan mengganti template aktif website.'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {tab === 'catalog' ? (
          paginatedTemplates.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <Layout className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h4 className="font-semibold">Tidak ada template ditemukan</h4>
              <p className="text-sm text-muted-foreground mt-1">Coba ubah filter atau kata kunci pencarian</p>
            </div>
          ) : (
            paginatedTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))
          )
        ) : savedLoading ? (
          <div className="col-span-full flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : savedUnified.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <Library className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h4 className="font-semibold">Library kamu masih kosong</h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Tekan &quot;Simpan&quot; di editor lalu pilih &quot;Simpan sebagai template&quot; supaya desain ini muncul di sini.
            </p>
          </div>
        ) : (
          savedUnified.map((template) => (
            <TemplateCard key={template.id} template={template} />
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

      <TemplatePreviewDialog
        template={previewTemplate?.data ?? null}
        onClose={() => setPreviewTemplate(null)}
      />

      {/* Konfirmasi hapus library. Tone destructive + menyebut nama template
          supaya user tidak salah klik saat daftar sudah panjang. */}
      <Dialog
        open={showDeleteDialog.open}
        onOpenChange={(open) => setShowDeleteDialog({ ...showDeleteDialog, open })}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-600" /> Hapus template tersimpan?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Template <strong>{showDeleteDialog.saved?.name}</strong> akan dihapus permanen dari
            library. Website yang sedang dipakai <strong>tidak</strong> ikut berubah — hanya
            salinan desainnya yang hilang.
          </p>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 flex-1"
              onClick={() => setShowDeleteDialog({ saved: null, open: false })}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 px-2.5 flex-1"
              disabled={!showDeleteDialog.saved || deletingId !== null}
              onClick={() => {
                const target = showDeleteDialog.saved;
                setShowDeleteDialog({ saved: null, open: false });
                if (target) void handleDeleteSaved(target);
              }}
            >
              {deletingId ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Menghapus...</>
              ) : (
                <><Trash2 className="w-3.5 h-3.5 mr-1" /> Ya, Hapus</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
