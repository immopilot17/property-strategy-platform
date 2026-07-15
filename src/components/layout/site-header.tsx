"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand } from "@/components/ui/brand";
import { FounderBadge } from "@/components/founder/founder-badge";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "./theme-toggle";

const guestNavigation = [
  { href: "/#so-funktionierts", label: "So funktioniert’s", accent: false },
  { href: "/dashboard/zahlungen", label: "Tarife & Leistungen", accent: false },
  { href: "/analyse", label: "Analyse starten", accent: true }
] as const;

const memberNavigation = [
  { href: "/dashboard", label: "Dashboard", accent: false },
  { href: "/analyse", label: "Analyse starten", accent: true },
  { href: "/dashboard/properties", label: "Meine Immobilien", accent: false },
  { href: "/dashboard/konto", label: "Mein Konto", accent: false },
  { href: "/dashboard/zahlungen", label: "Tarife & Leistungen", accent: false }
] as const;

type AccountStatus = {
  signedIn: boolean;
  tier: string;
  role: "user" | "admin" | "founder";
  unlimited: boolean;
};

const navClass = "whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white";
const accentNavClass = "whitespace-nowrap rounded-xl bg-teal px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400";
const mobileNavClass = "rounded-xl px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800";
const guestAccount: AccountStatus = { signedIn: false, tier: "free", role: "user", unlimited: false };

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/payments/entitlements", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Entitlements returned ${response.status}`);
        return response.json() as Promise<AccountStatus>;
      })
      .then((data) => setAccount(data))
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("site-header.entitlements.failed", error instanceof Error ? error.message : String(error));
        setAccount(guestAccount);
      });
    return () => controller.abort();
  }, [pathname]);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await createClient().auth.signOut();
      window.location.assign("/");
    } catch (error) {
      console.error("site-header.signout.failed", error instanceof Error ? error.message : String(error));
      setSigningOut(false);
    }
  };

  const navigation = account?.signedIn ? memberNavigation : guestNavigation;
  const adminVisible = account?.role !== undefined && account.role !== "user";

  const authControl = account?.signedIn ? (
    <button type="button" onClick={signOut} disabled={signingOut} className={`${navClass} disabled:opacity-60`}>
      {signingOut ? "Abmeldung …" : "Abmelden"}
    </button>
  ) : (
    <Link href="/login" className={navClass}>Anmelden</Link>
  );

  return (
    <header role="banner" className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 print:hidden">
      <nav aria-label="Hauptnavigation" className="mx-auto flex min-h-[72px] max-w-[1680px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Brand compact />
        <div className="hidden min-w-0 items-center gap-0.5 xl:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={item.accent ? accentNavClass : navClass}
            >
              {item.label}
            </Link>
          ))}
          {authControl}
          <ThemeToggle />
          {account?.role === "founder" ? <FounderBadge isFounder /> : null}
          {adminVisible ? (
            <Link href="/admin" className="rounded-xl px-3 py-2.5 text-sm font-bold text-teal transition hover:bg-mint dark:text-teal-300 dark:hover:bg-teal-950">Admin</Link>
          ) : null}
        </div>
        <div className="flex items-center gap-1 xl:hidden">
          <ThemeToggle />
          <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Menü schließen" : "Menü öffnen"} className="grid h-11 w-11 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </nav>
      {open ? (
        <div id="mobile-navigation" className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 xl:hidden">
          <div className="mx-auto grid max-w-xl gap-1">
            {navigation.map((item) => <Link key={item.href} href={item.href} className={item.accent ? `${mobileNavClass} bg-teal text-white hover:bg-teal-800 dark:text-slate-950` : mobileNavClass}>{item.label}</Link>)}
            {account?.signedIn ? (
              <button type="button" onClick={signOut} disabled={signingOut} className={`${mobileNavClass} text-left disabled:opacity-60`}>{signingOut ? "Abmeldung …" : "Abmelden"}</button>
            ) : <Link href="/login" className={mobileNavClass}>Anmelden</Link>}
            {account?.role === "founder" ? <div className="px-4 py-2"><FounderBadge isFounder /></div> : null}
            {adminVisible ? <Link href="/admin" className={`${mobileNavClass} text-teal dark:text-teal-300`}>Admin-Konsole</Link> : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
