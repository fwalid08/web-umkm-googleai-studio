"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Users, CreditCard, BarChart3, Settings, TrendingUp, DollarSign, Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

function StatCard({ title, value, change, icon: Icon, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        {change && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{change}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-slate-400">Platform overview & key metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value="1,234"
          change="+12% from last month"
          icon={Users}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Active Stores"
          value="892"
          change="+8% from last month"
          icon={Store}
          iconColor="text-emerald-500"
        />
        <StatCard
          title="Monthly Revenue"
          value="Rp 2.4B"
          change="+23% from last month"
          icon={DollarSign}
          iconColor="text-amber-500"
        />
        <StatCard
          title="Conversion Rate"
          value="3.24%"
          change="+0.4% from last month"
          icon={TrendingUp}
          iconColor="text-purple-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 dark:text-slate-500">Chart placeholder</span>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/users" className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <Users className="h-5 w-5 text-emerald-600" />
              <span className="font-medium text-gray-900 dark:text-white">Manage Users</span>
            </Link>
            <Link href="/admin/billing" className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900 dark:text-white">Billing Overview</span>
            </Link>
            <Link href="/admin/analytics" className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-gray-900 dark:text-white">Platform Analytics</span>
            </Link>
            <Link href="/admin/settings" className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <Settings className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900 dark:text-white">Platform Settings</span>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "New user registered", user: "toko-batik@example.com", time: "2 minutes ago" },
                { action: "Subscription upgraded", user: "warung-kopi@example.com", plan: "Growth", time: "15 minutes ago" },
                { action: "Domain connected", user: "fashion-store.rabasha.web.id", time: "1 hour ago" },
                { action: "New store created", user: "handmade-crafts", subdomain: "handmade-crafts.localhost:3000", time: "3 hours ago" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                      <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.action}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{item.user}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-slate-500">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Database</span>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">API Services</span>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Payments</span>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Email Service</span>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Configured</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}