"use client";

/**
 * i18n ringan: Indonesia (default) + English. Persist localStorage.
 * Pakai: const { t, lang, setLang } = useLang(); t("nav.orders"), t("dashboard.welcome", { name }).
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { id, type Dict } from "./id";
import { en } from "./en";

export type Lang = "id" | "en";
const DICTS: Record<Lang, Dict> = { id, en };
const KEY = "umkm-lang";

type Params = Record<string, string | number>;

function get(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => ((o as Record<string, unknown>) ?? {})[k], obj);
}

function fill(template: string, params?: Params): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template
  );
}

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Params) => string;
  tr: (key: string) => unknown;
}

const Ctx = createContext<LangCtx>({ lang: "id", setLang: () => {}, t: (k) => k, tr: () => undefined });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Lang | null) ?? "id";
    if (saved === "id" || saved === "en") {
      setLangState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(KEY, l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string, params?: Params) => {
      const v = get(DICTS[lang], key) ?? get(DICTS.id, key);
      return typeof v === "string" ? fill(v, params) : key;
    },
    [lang]
  );

  const tr = useCallback(
    (key: string) => get(DICTS[lang], key) ?? get(DICTS.id, key),
    [lang]
  );

  return <Ctx.Provider value={{ lang, setLang, t, tr }}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  return useContext(Ctx);
}
