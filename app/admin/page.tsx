import { redirect } from "next/navigation";

export default function AdminDashboardPage() {
  // Modul Templates dihapus (template = kode statis, authoring via PR).
  // Arahkan ke dashboard utama sampai modul admin berikutnya tersedia.
  redirect("/dashboard");
}