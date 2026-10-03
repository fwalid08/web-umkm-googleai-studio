import { Suspense } from "react";
import Link from "next/link";
import { AdminTemplateViewClient } from "./AdminTemplateViewClient";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface AdminTemplateViewPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminTemplateViewPage({ params }: AdminTemplateViewPageProps) {
  // Next.js 15+: params adalah Promise — WAJIB di-await, kalau tidak id = undefined
  // dan request menjadi /api/admin/templates/undefined.
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Template Details</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">View system template configuration and metadata</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/templates/${id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<ViewSkeleton />}>
        <AdminTemplateViewClient templateId={id} />
      </Suspense>
    </div>
  );
}

function ViewSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
      ))}
    </div>
  );
}