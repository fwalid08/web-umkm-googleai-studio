/**
 * Renewal Reminder helpers — Sprint 2 Task 7.
 * Pure (tanpa DB/network) agar mudah di-test: bucket T-30/14/7/1 + anti-spam.
 *
 * Anti-spam memakai SATU kolom `renewal_reminder_sent_at`: karena
 * `expires_at` tetap, bucket saat kirim bisa direkonstruksi
 * (`daysUntilExpiry(expires, sentAt)`). Kirim lagi hanya bila bucket
 * sekarang LEBIH DEKAT daripada bucket saat terakhir kirim
 * (30 → 14 → 7 → 1, monoton turun). Renewal (expires_at mundur) otomatis
 * menaikkan bucket → tak kirim ulang.
 */

export const REMINDER_BUCKETS = [30, 14, 7, 1] as const;
export type ReminderBucket = (typeof REMINDER_BUCKETS)[number];

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Sisa hari (ceil; negatif bila sudah lewat). NaN bila tanggal invalid. */
export function daysUntilExpiry(expiresAt: string | Date, now: Date = new Date()): number {
  const exp = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  const ms = exp.getTime() - now.getTime();
  if (!Number.isFinite(ms)) return NaN;
  return Math.ceil(ms / DAY_MS);
}

/** Bucket pengingat untuk sisa hari (null bila >30 atau sudah lewat). */
export function reminderBucketFor(daysLeft: number): ReminderBucket | null {
  if (!Number.isFinite(daysLeft) || daysLeft < 0 || daysLeft > 30) return null;
  // daysLeft 20 → 30; 10 → 14; 3 → 7; 1 → 1; 0 → 1.
  if (daysLeft <= 1) return 1;
  if (daysLeft <= 7) return 7;
  if (daysLeft <= 14) return 14;
  return 30;
}

export interface ReminderDecision {
  send: boolean;
  bucket: ReminderBucket | null;
}

/**
 * Putuskan kirim/tidak untuk satu order aktif.
 * - expires tak valid / >30 hari / sudah lewat → jangan kirim.
 * - belum pernah kirim → kirim bucket sekarang.
 * - sudah pernah → kirim hanya bila bucket sekarang < bucket saat kirim.
 */
export function shouldSendReminder(
  sentAt: string | null | undefined,
  expiresAt: string,
  now: Date = new Date()
): ReminderDecision {
  const daysLeft = daysUntilExpiry(expiresAt, now);
  const bucket = reminderBucketFor(daysLeft);
  if (bucket === null) return { send: false, bucket: null };
  if (!sentAt) return { send: true, bucket };
  const sentDate = new Date(sentAt);
  if (Number.isNaN(sentDate.getTime())) return { send: true, bucket };
  const bucketThen = reminderBucketFor(daysUntilExpiry(expiresAt, sentDate)) ?? 31;
  return { send: bucket < bucketThen, bucket };
}

export interface RenewalReminderInput {
  websiteId?: string;
  domain: string;
  daysLeft: number;
  bucket: ReminderBucket;
  expiresAt: string;
}

export interface DomainExpiredInput {
  websiteId?: string;
  domain: string;
  expiresAt: string;
}

/** Port notifikasi (default: log server; Sprint 3 ganti dispatcher tanpa ubah caller). */
export interface ReminderNotifier {
  renewalReminder(input: RenewalReminderInput): Promise<void>;
  domainExpired(input: DomainExpiredInput): Promise<void>;
}

/** Default: log terstruktur. Tidak pernah throw (caller abaikan error). */
export const logReminderNotifier: ReminderNotifier = {
  async renewalReminder({ domain, daysLeft, bucket }) {
    console.log(`[domain-reminder] T-${bucket} domain=${domain} sisa=${daysLeft} hari`);
  },
  async domainExpired({ domain }) {
    console.log(`[domain-expired] domain=${domain} status -> expired`);
  },
};
