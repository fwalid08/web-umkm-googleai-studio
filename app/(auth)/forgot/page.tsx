"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErr(json?.error || "Gagal mengirim. Coba lagi.");
        return;
      }
      // Anti-enumerasi: pesan generik walau email tidak terdaftar.
      setSent(true);
    } catch {
      setErr("Jaringan bermasalah. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Lupa password</h1>
          <p className="mt-2 text-gray-600">
            Masukkan email akunmu. Kami kirim link reset bila email terdaftar.
          </p>
        </div>
        {sent ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
            Jika email terdaftar, link reset password telah dikirim. Cek inbox/spam.
            <div className="mt-3">
              <Link href="/signin" className="font-medium underline">
                Kembali masuk
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {err && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{err}</div>}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@domain.com"
                aria-label="Email"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "Mengirim..." : "Kirim link reset"}
            </button>
          </form>
        )}
        {!sent && (
          <p className="text-center text-sm text-gray-600">
            Ingat password?{" "}
            <Link href="/signin" className="text-green-600 font-medium">
              Masuk
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
