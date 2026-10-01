'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2, Home, Globe, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { StorePage } from '@/lib/builder/types';

interface PageManagerProps {
  websiteId: string;
}

export function PageManager({ websiteId }: PageManagerProps) {
  const [pages, setPages] = useState<StorePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<StorePage | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');

  const loadPages = useCallback(async () => {
    try {
      const res = await fetch(`/api/websites/${websiteId}/pages`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setPages(json.data);
      }
    } catch (err) {
      console.error('Failed to load pages:', err);
    } finally {
      setLoading(false);
    }
  }, [websiteId]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleCreate = async () => {
    if (!newTitle || !newSlug) return;
    try {
      const res = await fetch(`/api/websites/${websiteId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, slug: newSlug }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setIsCreateOpen(false);
        setNewTitle('');
        setNewSlug('');
        loadPages();
      }
    } catch (err) {
      console.error('Failed to create page:', err);
    }
  };

  const handleUpdate = async () => {
    if (!editingPage) return;
    try {
      const res = await fetch(`/api/websites/${websiteId}/pages/${editingPage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingPage.title,
          slug: editingPage.slug,
          content: editingPage.content,
          is_published: editingPage.is_published,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setEditingPage(null);
        loadPages();
      }
    } catch (err) {
      console.error('Failed to update page:', err);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Yakin ingin menghapus halaman ini?')) return;
    try {
      const res = await fetch(`/api/websites/${websiteId}/pages/${pageId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        loadPages();
      }
    } catch (err) {
      console.error('Failed to delete page:', err);
    }
  };

  const handleSetHomepage = async (pageId: string) => {
    try {
      const res = await fetch(`/api/websites/${websiteId}/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_homepage: true }),
      });
      const json = await res.json();
      if (json.success) {
        loadPages();
      }
    } catch (err) {
      console.error('Failed to set homepage:', err);
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Memuat halaman...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Halaman</h3>
        <Button size="sm" className="h-8 px-2.5" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Buat Halaman
        </Button>
      </div>

      <div className="space-y-2">
        {pages.map((page) => (
          <div
            key={page.id}
            className="flex items-center gap-2.5 p-2.5 border rounded-lg bg-background hover:border-primary/50 transition-colors"
          >
            {page.is_homepage && <Home className="w-3.5 h-3.5 text-primary" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{page.title}</p>
              <p className="text-xs text-muted-foreground">/{page.slug}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditingPage(page)}>
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
              {!page.is_homepage && (
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleSetHomepage(page.id)}>
                  <Home className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleDelete(page.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Halaman Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Halaman saya"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="halaman-saya"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate}>Buat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPage} onOpenChange={() => setEditingPage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Halaman</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Judul</Label>
              <Input
                id="edit-title"
                value={editingPage?.title || ''}
                onChange={(e) => setEditingPage((p) => (p ? { ...p, title: e.target.value } : p))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={editingPage?.slug || ''}
                onChange={(e) =>
                  setEditingPage((p) =>
                    p ? { ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') } : p
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Konten</Label>
              <Textarea
                id="edit-content"
                value={editingPage?.content || ''}
                onChange={(e) => setEditingPage((p) => (p ? { ...p, content: e.target.value } : p))}
                rows={10}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                checked={editingPage?.is_published || false}
                onChange={(e) =>
                  setEditingPage((p) => (p ? { ...p, is_published: e.target.checked } : p))
                }
              />
              <Label htmlFor="is_published">Publikasikan</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPage(null)}>
              Batal
            </Button>
            <Button onClick={handleUpdate}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
