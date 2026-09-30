"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Check, AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "loading";
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (type: Toast["type"], message: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    if (type !== "loading") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const icons = {
    success: <Check className="w-5 h-5 text-emerald-600" />,
    error: <AlertTriangle className="w-5 h-5 text-red-600" />,
    info: <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />,
    loading: <Loader2 className="w-5 h-5 text-primary animate-spin" />,
  };

  const bgColors = {
    success: "bg-emerald-50 border-emerald-200",
    error: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
    loading: "bg-primary/10 border-primary/20",
  };

  const textColors = {
    success: "text-emerald-800",
    error: "text-red-800",
    info: "text-blue-800",
    loading: "text-primary",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[280px] max-w-md animate-slide-in",
        bgColors[toast.type]
      )}
      role="alert"
    >
      {icons[toast.type]}
      <p className={cn("text-sm font-medium flex-1", textColors[toast.type])}>{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className={cn("text-current/50 hover:text-current", textColors[toast.type])}
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}