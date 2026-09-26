"use client";
import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useLang } from "@/lib/i18n";

function SignInForm() {
  const router = useRouter();
  const { t } = useLang();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState("");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setErr(""); };
  const handleLoginWith = async (email: string, pass: string) => {
    setIsLoading(true);
    setErr("");
    setFormData({ email, password: pass });
    try {
      // 1. Coba dedicated demo login endpoint (kompatibel penuh dengan iframe AI Studio)
      const demoRes = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const demoJson = await demoRes.json().catch(() => null);

      if (demoJson?.success && demoJson.user) {
        localStorage.setItem("umkm_demo_id", demoJson.user.id);
        localStorage.setItem("umkm_demo_user", JSON.stringify(demoJson.user));
        try {
          document.cookie = `umkm_demo_user=${demoJson.user.id}; path=/; max-age=2592000; SameSite=None; Secure`;
          document.cookie = `umkm_demo_id=${demoJson.user.id}; path=/; max-age=2592000; SameSite=None; Secure`;
        } catch {}

        // Sinkronisasi NextAuth session di background
        signIn("credentials", { email, password: pass, redirect: false }).catch(() => {});

        // Navigasi instan ke halaman dashboard / callbackUrl
        window.location.href = callbackUrl || "/dashboard";
        return;
      }

      // 2. Alur login credentials standar
      const result = await signIn("credentials", { email, password: pass, redirect: false });
      if (result?.error) {
        setErr(t("auth.badCreds"));
        setIsLoading(false);
      } else {
        window.location.href = callbackUrl || "/dashboard";
      }
    } catch {
      setErr(t("common.networkError"));
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLoginWith(formData.email, formData.password);
  };
  return (
    <div className="max-w-md w-full space-y-6">
      <div className="text-center"><h1 className="text-3xl font-bold">{t("auth.signinTitle")}</h1><p className="mt-2 text-gray-600">{t("auth.or")} <Link href="/signup" className="text-green-600 font-medium">{t("auth.signupLink")}</Link></p></div>
      <button onClick={()=> signIn("google", { callbackUrl })} className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 font-medium">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09A6.99 6.99 0 0 1 5.48 12s0-.69.36-1.09V8.07H2.18A10.76 10.76 0 0 0 1 12c0 1.74.42 3.38 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        {t("auth.googleBtn")}
      </button>
      <div className="flex items-center gap-3"><div className="flex-1 h-px bg-gray-200"/><span className="text-xs text-gray-400">{t("auth.or")}</span><div className="flex-1 h-px bg-gray-200"/></div>
      
      {/* Quick Demo Accounts Selection */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
        <p className="text-xs font-semibold text-emerald-900 flex items-center justify-between">
          <span>🚀 Coba Akun Demo Langsung:</span>
          <span className="text-[10px] bg-emerald-200/70 text-emerald-800 px-1.5 py-0.5 rounded">Instan</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleLoginWith("demo1@umkm.id", "Password123!")}
            className="text-left p-3 bg-white border border-emerald-300 hover:border-emerald-600 hover:bg-emerald-50 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">☕ Akun Demo 1</span>
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">1 Toko</span>
            </div>
            <p className="text-[11px] text-gray-600 mt-1 truncate font-medium">Warung Kopi Bu Toni</p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 font-semibold group-hover:underline">Masuk Sekarang →</span>
            </div>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleLoginWith("demo2@umkm.id", "Password123!")}
            className="text-left p-3 bg-white border border-emerald-300 hover:border-emerald-600 hover:bg-emerald-50 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">👗 Akun Demo 2</span>
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">2 Toko</span>
            </div>
            <p className="text-[11px] text-gray-600 mt-1 truncate font-medium">Hijab & Aksesoris Cantik</p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 font-semibold group-hover:underline">Masuk Sekarang →</span>
            </div>
          </button>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {err && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{err}</div>}
        <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="email@domain.com" aria-label={t("auth.email")} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /></div>
        <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><input id="password" name="password" type={showPassword?"text":"password"} required value={formData.password} onChange={handleChange} placeholder="••••••••" aria-label={t("auth.password")} className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}</button></div>
        <button type="submit" disabled={isLoading} className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">{isLoading?t("auth.signinBtn")+"...":t("auth.signinBtn")}</button>
        <p className="text-right text-sm"><Link href="/forgot" className="text-green-600 font-medium">Lupa password?</Link></p>
      </form>
      <p className="text-center text-sm text-gray-600">{t("auth.or")} <Link href="/signup" className="text-green-600 font-medium">{t("auth.signupLink")}</Link></p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Suspense fallback={<div className="text-sm text-gray-500">Loading...</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
