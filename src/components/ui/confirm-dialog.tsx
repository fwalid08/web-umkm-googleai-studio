"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `destructive` untuk aksi merusak (hapus blok), `default` untuk lain-lain. */
  tone?: "default" | "destructive";
  onConfirm: () => void;
}

/**
 * Dialog konfirmasi yang bisa diakses & fokus-terkunci.
 *
 * Builder sebelumnya memakai `window.confirm()` native, yang memblokir seluruh
 * thread, tidak bisa di-style, dan kehilangan gaya aplikasi. Komponen ini
 * dibungkus di atas `@radix-ui/react-dialog` yang SUDAH terpasang — jadi tidak
 * perlu menambah dependency `@radix-ui/react-alert-dialog`.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  tone = "default",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                tone === "destructive"
                  ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </span>
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="leading-relaxed">{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === "destructive" ? "destructive" : "default"}
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "destructive";
  onConfirm: () => void;
}

/**
 * Hook konfirmasi untuk komponen builder.
 *
 * Pakai:
 * ```tsx
 * const { requestConfirm, confirmDialog } = useConfirm();
 * requestConfirm({ title: 'Hapus blok?', onConfirm: () => deleteSection(id) });
 * // ...
 * return <>{confirmDialog}</>;
 * ```
 * Opsi tidak diberikan untuk-now; kalau butuh, cukup set state lokal saja.
 */
export function useConfirm() {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);

  const requestConfirm = React.useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
  }, []);

  const dialog = (
    <ConfirmDialog
      open={options !== null}
      onOpenChange={(next) => {
        if (!next) setOptions(null);
      }}
      title={options?.title ?? ""}
      description={options?.description}
      confirmLabel={options?.confirmLabel}
      cancelLabel={options?.cancelLabel}
      tone={options?.tone}
      onConfirm={() => options?.onConfirm()}
    />
  );

  return { requestConfirm, confirmDialog: dialog };
}