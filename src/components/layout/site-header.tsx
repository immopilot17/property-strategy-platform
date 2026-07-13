"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

const navigation = [
  { href: "/#so-funktionierts", label: "So funktioniert’s" },
  { href: "/dashboard/foerderungen", label: "Förderungen" },
  { href: "/dashboard/zahlungen", label: "Pakete" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/login", label: "Anmelden" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header role="banner" className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 print:hidden">
      <nav aria-label="Hauptnavigation" className="mx-auto flex h-[72px] max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Brand compact />
        <div className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">{item.label}</Link>)}
          <ThemeToggle />
          <ButtonLink href="/analyse" size="sm" className="ml-2">Jetzt kostenlos starten</ButtonLink>
        </div>
        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Menü schließen" : "Menü öffnen"} className="grid h-11 w-11 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </nav>
      {open ? <div id="mobile-navigation" className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 lg:hidden"><div className="mx-auto grid max-w-xl gap-1">{navigation.map((item) => <Link key={item.href} href={item.href} className="rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">{item.label}</Link>)}<ButtonLink href="/analyse" className="mt-2 w-full">Jetzt kostenlos starten</ButtonLink></div></div> : null}
    </header>
  );
}
