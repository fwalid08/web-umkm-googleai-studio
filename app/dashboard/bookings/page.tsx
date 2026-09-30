"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  notes: string;
  status: string;
  created_at: string;
}

const STATUSES = ["baru", "dikonfirmasi", "selesai", "batal"] as const;

const STATUS_STYLE: Record<string, string> = {
  baru: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  dikonfirmasi: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  selesai: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  batal: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default function BookingsPage() {
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async (wid: string) => {
    try {
      const res = await fetch(`/api/bookings?website_id=${wid}`);
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Gagal memuat booking");
        return;
      }
      setBookings(json.data as Booking[]);
    } catch {
      setError("Gagal memuat booking. Periksa koneksi Anda.");
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/websites");
        const json = await res.json();
        const wid = json?.data?.active_website_id as string | undefined;
        if (!wid) {
          setError("Belum ada website aktif.");
          return;
        }
        setWebsiteId(wid);
        await load(wid);
      } catch {
        setError("Gagal memuat website.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  async function updateStatus(b: Booking, status: string) {
    if (!websiteId || status === b.status) return;
    setUpdatingId(b.id);
    try {
      const res = await fetch(`/api/bookings/${b.id}?website_id=${websiteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Gagal mengubah status");
        return;
      }
      setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, status } : x)));
    } catch {
      setError("Gagal mengubah status.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md">
            <CalendarCheck className="w-5 h-5 text-white" />
          </span>
          Booking Masuk
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reservasi dari form booking di website toko Anda.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300">
          {error}
        </div>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">
            {loading ? "Memuat…" : `${bookings.length} booking`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">📅</div>
              <p className="font-bold">Belum ada booking</p>
              <p className="text-sm text-muted-foreground mt-1">
                Booking dari form di website akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-semibold whitespace-nowrap">
                        {b.booking_date}
                        <span className="block text-xs font-normal text-muted-foreground">{b.booking_time}</span>
                      </TableCell>
                      <TableCell>{b.service_name}</TableCell>
                      <TableCell>
                        {b.customer_name}
                        <span className="block text-xs text-muted-foreground">{b.customer_phone}</span>
                        {b.notes && <span className="block text-xs italic text-muted-foreground">“{b.notes}”</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_STYLE[b.status] ?? ""}>{b.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {updatingId === b.id ? (
                          <Loader2 className="w-4 h-4 animate-spin inline" />
                        ) : (
                          <Select value={b.status} onValueChange={(v) => updateStatus(b, v)}>
                            <SelectTrigger className="h-8 w-36 text-xs ml-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s} className="text-xs">
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="ghost" size="sm" onClick={() => websiteId && load(websiteId)}>
        Muat ulang
      </Button>
    </div>
  );
}
