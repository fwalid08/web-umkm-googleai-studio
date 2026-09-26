"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Phase = "verifying" | "ready" | "updating" | "done" | "error";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [phase, setPhase] = useState<Phase>("verifying");
  const [err, setErr] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const code = searchParams.get("code");
        if (code) {
          // PKCE flow: tukar ?code=... jadi session recovery.
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Hash flow lama (#access_token=...): browser client sudah parse
          // otomatis; cukup pastikan ada session recovery.
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (!data.session) throw new Error("expired");
        }
        if (!cancelled) setPhase("ready");
      } catch (e) {
        console.error("Reset verify error:", e);
        if (!cancelled) {
          setErr("Link reset tidak valid atau kedaluwarsa. Minta link baru.");
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (password.length < 8) {
      setErr("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setErr("Konfirmasi password tidak sama.");
      return;
    }
    setPhase("updating");
    try {
      // Berlaku untuk Supabase Auth; Credentials login pakai
      // supabase.auth.signInWithPassword di NextAuth authorize,
      // jadi password baru langsung bisa dipakai signin.
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPhase("done");
    } catch (e) {
      console.error("Reset update error:", e);
      setErr("Gagal update password. Link mungkin kedaluwarsa — minta link baru.");
      setPhase("ready");
    }
  };

  if (phase === "verifying") {
    return <p className="text-sm text-gray-500 text-center">Memverifikasi link reset...</p>;
  }

  if (phase === "done") {
    return (
      <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm text-center">
        Password berhasil diubah. Silakan masuk dengan password baru.
        <div className="mt-3">
          <Link href="/signin" className="font-medium underline">
            Masuk sekarang
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm text-center">
        {err}
        <div className="mt-3">
          <Link href="/forgot" className="font-medium underline">
            Minta link baru
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {err && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{err}</div>}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password baru (min 8)"
          aria-label="Password baru"
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Ulangi password baru"
          aria-label="Konfirmasi password"
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={phase === "updating"}
        className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {phase === "updating" ? "Menyimpan..." : "Simpan password baru"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Reset password</h1>
          <p className="mt-2 text-gray-600">Masukkan password baru untuk akunmu.</p>
        </div>
        <Suspense fallback={<p className="text-sm text-gray-500 text-center">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
        <p className="text-center text-sm text-gray-600">
          Ingat password?{" "}
          <Link href="/signin" className="text-green-600 font-medium">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
