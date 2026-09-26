"use client";

/** Toggle bahasa ID/EN di header kedua panel. */
import { useLang, type Lang } from "@/lib/i18n";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLang();
  return (
    <label className="flex items-center gap-1 text-sm text-gray-500" title={t("nav.lang")}>
      🌐
      <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
        <SelectTrigger className="w-auto h-8 text-sm bg-transparent">
          <SelectValue placeholder="Bahasa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="id">ID</SelectItem>
          <SelectItem value="en">EN</SelectItem>
        </SelectContent>
      </Select>
    </label>
  );
}
