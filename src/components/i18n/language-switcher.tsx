"use client";

/** Toggle bahasa ID/EN di header kedua panel. */
import { useLang, type Lang } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLang();
  return (
    <label className="flex items-center gap-1 text-sm text-gray-500" title={t("nav.lang")}>
      🌐
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="bg-transparent outline-none text-sm text-gray-600 cursor-pointer"
      >
        <option value="id">ID</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}
