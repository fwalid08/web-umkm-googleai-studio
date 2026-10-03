import { Suspense } from "react";
import { AdminTemplateFormClient } from "../AdminTemplateFormClient";

export const dynamic = "force-dynamic";

interface AdminTemplateNewPageProps {
  params: Promise<{}>;
}

export default function AdminTemplateNewPage({ params }: AdminTemplateNewPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Template</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Create a new system template from JSON or ZIP import</p>
        </div>
      </div>

      <Suspense fallback={<FormSkeleton />}>
        <AdminTemplateFormClient mode="create" templateId={null} />
      </Suspense>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
      ))}
    </div>
  );
}