'use client';

import { useState } from 'react';
import { Save, Library, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEFAULT_LIBRARY_NAME, normalizeLibraryName } from '@/lib/builder/template-library';

export type SaveChoice = 'plain' | 'library';

export interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** True saat ada perubahan yang belum tersimpan. */
  dirty?: boolean;
  saving?: boolean;
  onSave: (choice: SaveChoice, libraryName: string) => void;
}

/**
 * Dialog "Simpan" dengan dua pilihan (pola Save As):
 *
 *  - **Simpan saja** — menyimpan ke template aktif website. Ini yang terjadi
 *    setiap kali user menekan tombol Simpan.
 *  - **Simpan sebagai template** — menyalin desain saat ini ke library
 *    (`user_templates`, lihat 045) supaya bisa dipilih ulang lewat "Ganti
 *    Template" tanpa mengulang semua pengeditan.
 *
 * Ctrl+S sengaja TIDAK membuka dialog ini — shortcut itu tetap jalan sebagai
 * "simpan saja" supaya muscle memory tidak terganggu.
 */
export function SaveDialog({
  open,
  onOpenChange,
  dirty = false,
  saving = false,
  onSave,
}: SaveDialogProps) {
  const [choice, setChoice] = useState<SaveChoice>('plain');
  const [name, setName] = useState(DEFAULT_LIBRARY_NAME);

  const submit = () => {
    onSave(choice, choice === 'library' ? normalizeLibraryName(name) : '');
    // Tutup setelah aksi dikirim; state direset supaya reopening berikutnya
    // tidak membuka dialog dengan mode "library" yang sudah terisi.
    onOpenChange(false);
    setChoice('plain');
    setName(DEFAULT_LIBRARY_NAME);
  };

  const optionClass = (active: boolean) =>
    `flex items-start gap-3 w-full p-3.5 rounded-xl border text-left transition-all ${
      active
        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/25 ring-[0_0_0_1px_rgba(16,185,129,0.35)]'
        : 'border-slate-200/70 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
    }`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Simpan perubahan</DialogTitle>
          <DialogDescription>
            Simpan ke website, atau simpan sebagai template yang bisa dipakai lagi nanti.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          <button type="button" onClick={() => setChoice('plain')} className={optionClass(choice === 'plain')}>
            <span
              aria-hidden="true"
              className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 ${
                choice === 'plain' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-bold">
                <Save className="w-3.5 h-3.5" />
                Simpan saja
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Menyimpan ke website{dirty ? ' (halaman tetap draft sampai kamu tekan Tayangkan)' : ''}.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setChoice('library')}
            className={optionClass(choice === 'library')}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 ${
                choice === 'library' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-bold">
                <Library className="w-3.5 h-3.5" />
                Simpan sebagai template
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Disimpan ke library-mu. Bisa dipilih lagi lewat menu &quot;Ganti Template&quot;.
              </span>
            </span>
          </button>
        </div>

        {choice === 'library' && (
          <div className="space-y-1.5">
            <Label className="text-xs font-bold" htmlFor="template-library-name">
              Nama template
            </Label>
            <Input
              id="template-library-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={DEFAULT_LIBRARY_NAME}
              maxLength={120}
            />
            <p className="text-[11px] text-muted-foreground">
              Dikosongkan akan memakai &quot;{DEFAULT_LIBRARY_NAME}&quot;.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={submit} disabled={saving} className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 font-bold">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {choice === 'library' ? 'Simpan sebagai template' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}