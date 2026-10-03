import { requireAdmin } from "@/lib/admin/auth";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";

async function getAdminSession() {
  try {
    return await requireAdmin();
  } catch {
    redirect("/signin?callbackUrl=/admin");
  }
}

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Route group layout: tidak boleh me-render <html>/<body> sendiri
  // (sudah disediakan root app/layout.tsx).
  const session = await getAdminSession();
  return <AdminLayout permissions={session.permissions}>{children}</AdminLayout>;
}