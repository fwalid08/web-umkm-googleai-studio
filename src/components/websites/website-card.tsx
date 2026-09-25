"use client";

/**
 * Kartu website kaya konteks (lensa Bu Toni):
 * jawab "ini website apa, sudah live belum, apa yang bisa saya lakukan"
 * dalam 5 detik — thumbnail berwarna + chip status + 3 aksi cepat.
 */

import { ExternalLink, ShoppingBag, Store } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { tenantDisplay, tenantUrl } from "@/lib/urls";
import { websiteStatus } from "@/lib/websites/status";

export interface WebsiteCardSite {
  id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  current_template_id?: string | null;
}

interface Props {
  site: WebsiteCardSite;
  isActive: boolean;
  busy: boolean;
  onAtur: (id: string) => void;
  onPesanan: (id: string) => void;
}

export function WebsiteCard({ site, isActive, busy, onAtur, onPesanan }: Props) {
  const { t } = useLang();
  const status = websiteStatus(site);
  const url = tenantUrl(site.subdomain);
  const address =
    site.custom_domain_verified && site.custom_domain
      ? site.custom_domain
      : tenantDisplay(site.subdomain);

  return (
    <article
      className={`border rounded-xl overflow-hidden bg-white flex flex-col ${
        isActive ? "border-green-600 border-2" : ""
      }`}
    >
      {/* Preview mini: thumbnail berwarna + info template (tanpa iframe: ringan di HP) */}
      <div className="h-28 bg-gradient-to-br from-green-100 via-green-50 to-white flex items-center justify-center gap-3 px-4">
        <span className="p-3 bg-white rounded-xl shadow-sm">
          <Store className="h-8 w-8 text-green-700" />
        </span>
        <div className="text-left">
          <p className="font-semibold text-gray-900 leading-tight line-clamp-1">{site.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {status === "publish"
              ? t("websites.cardPublishHint")
              : t("websites.cardDraftHint")}
          </p>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {isActive ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              {t("common.active")}
            </span>
          ) : null}
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              status === "publish"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {status === "publish" ? t("websites.statusPublish") : t("websites.statusDraft")}
          </span>
        </div>

        <p className="text-sm text-gray-500 break-all">{address}</p>

        {/* Aksi cepat inline: Lihat (publik) • Pesanan • Atur */}
        <div className="mt-auto pt-2 grid grid-cols-2 gap-2">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              {t("websites.viewBtn")}
            </a>
          ) : (
            <span className="inline-flex items-center justify-center px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-400">
              {t("websites.viewBtn")}
            </span>
          )}
          <button
            onClick={() => onPesanan(site.id)}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <ShoppingBag className="h-4 w-4" />
            {t("websites.ordersBtn")}
          </button>
        </div>
        <button
          onClick={() => onAtur(site.id)}
          disabled={busy}
          className="w-full py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
        >
          {t("websites.manage")}
        </button>
      </div>
    </article>
  );
}
