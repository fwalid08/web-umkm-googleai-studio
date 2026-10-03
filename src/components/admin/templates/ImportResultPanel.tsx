"use client";

import { AlertTriangle, CheckCircle2, Info, Sparkles, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImportResult {
  ok: boolean;
  message: string;
  warnings: string[];
  autofilled: string[];
  templateName?: string;
}

function strList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((w): w is string => typeof w === "string").slice(0, 12)
    : [];
}

export function toImportResult(json: unknown, fallbackError: string): ImportResult {
  const j = (json ?? {}) as Record<string, unknown>;
  if (j.success) {
    const data = (j.data ?? {}) as Record<string, unknown>;
    return {
      ok: true,
      message: typeof j.message === "string" && j.message ? j.message : "Template imported successfully",
      warnings: strList(j.warnings),
      autofilled: strList(j.autofilled),
      templateName: typeof data.name === "string" ? data.name : undefined,
    };
  }
  return {
    ok: false,
    message: typeof j.error === "string" && j.error ? j.error : fallbackError,
    warnings: strList(j.warnings),
    autofilled: [],
  };
}

export function ImportResultPanel({ result }: { result: ImportResult | null }) {
  if (!result) return null;

  return (
    <div className="space-y-2" role="status" aria-live="polite">
      <div
        className={cn(
          "flex items-start gap-2.5 p-3 rounded-lg border text-sm",
          result.ok
            ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-100"
            : "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100"
        )}
      >
        {result.ok ? (
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
        ) : (
          <XCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <p className="font-semibold">
            {result.ok ? "Import berhasil" : "Import gagal"}
            {result.templateName ? (
              <span className="font-normal"> — {result.templateName}</span>
            ) : null}
          </p>
          <p className="text-[13px] opacity-90 break-words">{result.message}</p>
        </div>
      </div>

      {result.autofilled.length > 0 && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg border text-[13px] bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-900/20 dark:border-sky-800 dark:text-sky-100">
          <Sparkles className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold">Gambar terisi otomatis ({result.autofilled.length})</p>
            <ul className="list-disc pl-4 space-y-0.5 break-words">
              {result.autofilled.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg border text-[13px] bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold">Perhatian ({result.warnings.length})</p>
            <ul className="list-disc pl-4 space-y-0.5 break-words">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {result.ok && result.warnings.length === 0 && result.autofilled.length === 0 && (
        <div className="flex items-center gap-2 text-[13px] text-gray-500 dark:text-slate-400">
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Tidak ada peringatan — semua aset dan field terpetakan.</span>
        </div>
      )}
    </div>
  );
}
