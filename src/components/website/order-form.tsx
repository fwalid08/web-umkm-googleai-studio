"use client";

/**
 * Sprint 02 US-05 — Form checkout publik (client component).
 * Dipakai di product_grid renderer (server) per produk.
 * POST /api/orders → tampilkan auto-response F5.
 */

import { useState } from "react";
import { MessageCircle } from "lucide-react";

interface Props {
  subdomain: string;
  productId?: string;
  productName: string;
  productPrice: number;
  primary: string;
  sellerPhone?: string;
  disabled?: boolean;
}

function formatWaUrl(phone: string, text: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

export function OrderForm({ subdomain, productId, productName, productPrice, primary, sellerPhone, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", qty: "1", address: "", notes: "" });

  if (disabled) {
    return (
      <div className="mt-2">
        <button
          className="w-full py-2 rounded-lg text-sm font-medium text-gray-500 bg-gray-100 cursor-not-allowed"
          disabled
        >
          Stok Habis
        </button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain,
          product_id: productId,
          product_name: productName,
          product_price: productPrice,
          quantity: Number(form.qty) || 1,
          customer_name: form.name,
          customer_phone: form.phone,
          payment_method: "cod",
          delivery_address: form.address,
          notes: form.notes,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Gagal membuat order");
        return;
      }
      setDone(json.data.message as string);
      setOrderId((json.data.order_id as string) || "");
      setOpen(false);
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    const total = productPrice * (Number(form.qty) || 1);
    const waMsg = `Halo kak, saya baru memesan dari website!\n\nID Pesanan: #${orderId ? orderId.slice(0, 8) : ""}\nProduk: ${productName} (${form.qty}x)\nTotal: Rp ${total.toLocaleString("id-ID")}\nNama: ${form.name}\nAlamat: ${form.address || "-"}\n\nMohon konfirmasi pesanan saya ya. Terima kasih!`;

    return (
      <div className="mt-2 rounded-lg bg-green-50 border border-green-200 p-2.5 text-xs text-green-800 space-y-2">
        <p className="font-medium">✅ {done}</p>
        {sellerPhone ? (
          <a
            href={formatWaUrl(sellerPhone, waMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md text-white font-medium bg-[#22C55E] hover:bg-[#16A34A] transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Konfirmasi Cepat via WhatsApp
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-2">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: primary }}
        >
          Pesan Sekarang
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-2 border-t pt-2">
          <input
            required
            placeholder="Nama Anda"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full text-sm border rounded-lg px-2 py-1.5"
          />
          <div className="flex gap-2">
            <input
              required
              placeholder="No. WA"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="flex-1 text-sm border rounded-lg px-2 py-1.5"
            />
            <input
              type="number"
              min={1}
              max={99}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
              className="w-16 text-sm border rounded-lg px-2 py-1.5"
            />
          </div>
          <input
            placeholder="Alamat (opsional)"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full text-sm border rounded-lg px-2 py-1.5"
          />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ background: primary }}
            >
              {loading ? "Mengirim..." : "Kirim Order"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 rounded-lg text-sm border"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
