'use client';

import { useState } from 'react';
import { Library, Loader2 } from 'lucide-react';
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

export interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** True saat ada perubahan yang belum tersimpan. */
  dirty?: boolean;
  saving?: boolean;
  onSave: (libraryName: string) => void;
}

/**
 * Dialog "Simpan sebagai Template".
 *
 * Builder tidak punya konsep "draft": config kanvas bisa disimpan ke library
 * kapan saja tanpa menyentuh website yang sedang tayang. Satu-satunya aksi
 * yang mengubah situs publik adalah tombol "Tampilkan" (lihat
 * `BuilderTopbar`), yang menimpa template aktif sekaligus menayangkannya.
 *
 * Karena itu dialog ini cuma minta nama — tidak ada lagi pilihan
 * "Simpan saja" yang bisa mengunci live site ke status draft.
 */
export function SaveDialog({
  open,
  onOpenChange,
  dirty = false,
  saving = false,
  onSave,
}: SaveDialogProps) {
  const [name, setName] = useState(DEFAULT_LIBRARY_NAME);

  const submit = () => {
    onSave(normalizeLibraryName(name));
    // Tutup setelah aksi dikirim; state direset supaya reopening berikutnya
    // tidak membuka dialog dengan nama template sebelumnya.
    onOpenChange(false);
    setName(DEFAULT_LIBRARY_NAME);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="w-4 h-4" />
            Simpan sebagai template
          </DialogTitle>
          <DialogDescription>
            {dirty
              ? 'Desain di editor disimpan ke library-mu. Website yang sedang tayang tidak berubah.'
              : 'Simpan desain ini ke library-mu agar bisa dipakai lagi nanti.'}
          </DialogDescription>
        </DialogHeader>

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
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground">
            Dikosongkan akan memakai &quot;{DEFAULT_LIBRARY_NAME}&quot;.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={submit} disabled={saving} className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 font-bold">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan sebagai template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}