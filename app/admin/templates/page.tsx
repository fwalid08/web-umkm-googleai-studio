import { Suspense } from "react";
import { AdminTemplatesClient } from "./AdminTemplatesClient";

export const dynamic = "force-dynamic";

export default function AdminTemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Templates</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Manage system templates available to all users</p>
        </div>
      </div>

      <Suspense fallback={<TemplatesTableSkeleton />}>
        <AdminTemplatesClient />
      </Suspense>
    </div>
  );
}

function TemplatesTableSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700">
              {["Name", "Category", "Tier", "Scope", "System", "Owner", "Created"].map((col) => (
                <th key={col} className="p-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-slate-800">
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="p-3">
                    <div className="h-4 w-32 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}