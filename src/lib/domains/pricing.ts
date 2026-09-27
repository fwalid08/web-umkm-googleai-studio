/**
 * Domain Pricing — Sprint 2.
 * Satu-satunya sumber perhitungan harga jual domain (IDR utuh):
 *   wholesale USD -> IDR (kurs env) + margin % + fee gateway flat.
 *
 * Env:
 *   USD_TO_IDR_RATE=15500             kurs konversi (update periodik, sumber: BI/JISDOR)
 *   DOMAIN_PRICE_MARGIN_PERCENT=20    margin reseller %
 *   DOMAIN_GATEWAY_FEE_FLAT=4000      fee gateway flat IDR (VA/QRISpolygon rata-rata)
 */

export interface DomainPriceBreakdown {
  wholesaleUsd: number;
  wholesaleIdr: number;
  marginIdr: number;
  feeIdr: number;
  total: number; // IDR utuh, dibulatkan ke 500 terdekat (psikologi harga)
}

function readNumber(envKey: string, fallback: number): number {
  const raw = process.env[envKey];
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function usdToIdrRate(): number {
  return readNumber("USD_TO_IDR_RATE", 15500);
}

export function domainMarginPercent(): number {
  return readNumber("DOMAIN_PRICE_MARGIN_PERCENT", 20);
}

export function domainGatewayFeeFlat(): number {
  return readNumber("DOMAIN_GATEWAY_FEE_FLAT", 4000);
}

/** Konversi grosir USD -> IDR (pembulatan rupiah utuh). */
export function wholesaleUsdToIdr(usd: number): number {
  if (!Number.isFinite(usd) || usd < 0) return 0;
  return Math.round(usd * usdToIdrRate());
}

/**
 * Harga jual domain per tahun (IDR utuh).
 * Dibulatkan ke kelipatan 500 agar tampil rapi (mis. 199.000).
 */
export function calcDomainPrice(
  wholesaleUsd: number,
  opts: { marginPercent?: number; feeFlat?: number } = {}
): DomainPriceBreakdown {
  const wholesaleIdr = wholesaleUsdToIdr(wholesaleUsd);
  const marginPct = opts.marginPercent ?? domainMarginPercent();
  const feeIdr = opts.feeFlat ?? domainGatewayFeeFlat();
  const marginIdr = Math.round((wholesaleIdr * marginPct) / 100);
  const raw = wholesaleIdr + marginIdr + feeIdr;
  // Bulatkan ke atas ke kelipatan 500
  const total = Math.ceil(raw / 500) * 500;
  return { wholesaleUsd, wholesaleIdr, marginIdr, feeIdr, total };
}

/** Format IDR: 199000 -> "Rp199.000". */
export function formatIdr(n: number): string {
  return `Rp${Math.round(n).toLocaleString("id-ID")}`;
}
