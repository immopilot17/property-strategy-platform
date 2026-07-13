"use client";

import Link from "next/link";
import { BarChart3, Building2, CircleDollarSign, LayoutDashboard, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
  { href: "/analysen", label: "Analysen", icon: BarChart3 },
  { href: "/dashboard/properties", label: "Immobilien", icon: Building2 },
  { href: "/dashboard/foerderungen", label: "Förderungen", icon: Sparkles },
  { href: "/dashboard/zahlungen", label: "Pakete", icon: CircleDollarSign }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto min-h-[calc(100vh-72px)] max-w-[1600px] lg:grid lg:grid-cols-[236px_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 lg:border-b-0 lg:border-r lg:px-5 lg:py-8">
        <nav aria-label="Dashboard-Navigation" className="flex gap-2 overflow-x-auto lg:sticky lg:top-24 lg:flex-col lg:overflow-visible">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={clsx("inline-flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition", active ? "bg-mint text-teal dark:bg-teal-950 dark:text-teal-200" : "text-slate-600 hover:bg-slate-100 hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white")}><Icon size={19} strokeWidth={1.9} aria-hidden="true" />{item.label}</Link>;
          })}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
