"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Truck, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { signUpSchema, type SignUpInput } from "@/types";
import { useLang } from "@/lib/i18n";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export default function SignUpPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { business_type: "retail" as const },
  });
  const password = watch("password") || "";
  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true); setServerError("");
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (!res.ok) { setServerError(result.error || t("common.networkError")); return; }
      router.push("/signin?registered=true");
    } catch { setServerError(t("common.networkError")); } finally { setIsLoading(false); }
  };
  const strength = (()=>{let s=0; if(password.length>=8)s++; if(/[A-Z]/.test(password))s++; if(/[0-9]/.test(password))s++; if(/[^A-Za-z0-9]/.test(password))s++; return s;})();
  const labels = lang === "id" ? ["Sangat Lemah","Lemah","Sedang","Kuat","Sangat Kuat"] : ["Very Weak","Weak","Medium","Strong","Very Strong"];
  const colors=["bg-red-500","bg-orange-500","bg-yellow-500","bg-lime-500","bg-green-500"];
  const bizOpts = [
    { v: "food", e: "🍽️", label: t("onboarding.biz.food") },
    { v: "fashion", e: "👗", label: t("onboarding.biz.fashion") },
    { v: "handicraft", e: "🎨", label: t("onboarding.biz.handicraft") },
    { v: "retail", e: "🛍️", label: t("onboarding.biz.retail") },
    { v: "services", e: "🔧", label: t("onboarding.biz.services") },
  ];
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center"><h1 className="text-3xl font-bold">{lang === "id" ? "Mulai Gratis" : "Start Free"}</h1><p className="mt-2 text-gray-600">{lang === "id" ? "Buat website toko online UMKM dalam menit" : "Build your UMKM online store in minutes"}</p></div>
        <button onClick={()=> signIn("google", { callbackUrl: "/dashboard" })} className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 font-medium">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09A6.99 6.99 0 0 1 5.48 12s0-.69.36-1.09V8.07H2.18A10.76 10.76 0 0 0 1 12c0 1.74.42 3.38 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {lang === "id" ? "Daftar dengan Google" : "Sign up with Google"}
        </button>
        <div className="flex items-center gap-3"><div className="flex-1 h-px bg-gray-200"/><span className="text-xs text-gray-400">{t("auth.or")}</span><div className="flex-1 h-px bg-gray-200"/></div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {serverError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{serverError}</div>}
          <div><label className="block text-sm font-medium mb-1">{lang === "id" ? "Nama Lengkap" : "Full name"}</label><input {...register("name")} placeholder={lang === "id" ? "Nama lengkap Anda" : "Your full name"} className={`w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 ${errors.name?"border-red-500":"border-gray-300"}`} />{errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}</div>
          <div><label className="block text-sm font-medium mb-1">{t("auth.email")}</label><input {...register("email")} type="email" placeholder="email@domain.com" className={`w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 ${errors.email?"border-red-500":"border-gray-300"}`} />{errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}</div>
          <div><label className="block text-sm font-medium mb-1">{t("auth.password")}</label><input {...register("password")} type="password" placeholder="••••••••" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />{errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}{password && <div className="mt-2"><div className="flex gap-1 h-1.5">{[1,2,3,4].map(l=> <div key={l} className={`flex-1 rounded ${l<=strength?colors[strength-1]:"bg-gray-200"}`} />)}</div><p className="text-xs text-gray-500 mt-1">{labels[strength-1]||labels[0]}</p></div>}</div>
          <div><label className="block text-sm font-medium mb-1">{t("onboarding.s2Title")}</label><Select {...register("business_type")}><SelectTrigger className="w-full"><SelectValue placeholder={t("onboarding.s2Title")} /></SelectTrigger><SelectContent>{bizOpts.map((o) => (<SelectItem key={o.v} value={o.v}>{o.e} {o.label}</SelectItem>))}</SelectContent></Select></div>
          <div className="flex items-start gap-2"><input type="checkbox" required id="terms" className="mt-1" /><label htmlFor="terms" className="text-sm text-gray-600">{lang === "id" ? (<>Saya setuju <Link href="/terms" className="text-green-600 underline">Syarat & Ketentuan</Link> dan <Link href="/privacy" className="text-green-600 underline">Kebijakan Privasi</Link></>) : (<>I agree to the <Link href="/terms" className="text-green-600 underline">Terms</Link> and <Link href="/privacy" className="text-green-600 underline">Privacy Policy</Link></>)}</label></div>
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">{isLoading?(lang==="id"?"Mendaftar...":"Signing up..."):(lang==="id"?"Daftar Gratis 14 Hari":"Start Free 14 Days")}</button>
        </form>
        <p className="text-center text-sm text-gray-600">{lang === "id" ? (<>Sudah punya akun? <Link href="/signin" className="text-green-600 font-medium">Masuk</Link></>) : (<>Have an account? <Link href="/signin" className="text-green-600 font-medium">Sign in</Link></>)}</p>
        <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-500"><div className="flex flex-col items-center gap-1"><Shield className="h-5 w-5 text-green-600" /><span>{lang==="id"?"Gratis 14 Hari":"Free 14 Days"}</span></div><div className="flex flex-col items-center gap-1"><Truck className="h-5 w-5 text-green-600" /><span>{lang==="id"?"Tanpa Kartu Kredit":"No Credit Card"}</span></div><div className="flex flex-col items-center gap-1"><Sparkles className="h-5 w-5 text-green-600" /><span>{lang==="id"?"Bisa Batalkan Kapan Saja":"Cancel Anytime"}</span></div></div>
      </div>
    </div>
  );
}
