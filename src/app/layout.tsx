import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Chatbot } from "@/components/chat/chatbot";

export const metadata: Metadata = {
  title: {
    default: "Property Strategy Platform",
    template: "%s | Property Strategy Platform"
  },
  description: "Datenbasierte Immobilien-, Finanzierungs- und Risikoanalyse."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="font-bold tracking-tight">Property Strategy</Link>
            <div className="flex items-center gap-4 text-sm font-semibold">
              <Link href="/analyse">Analyse</Link>
              <Link href="/analysen">Verlauf</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/dashboard/zahlungen">Pakete</Link>
              <Link href="/login" className="rounded-xl bg-slate-950 px-4 py-2 text-white">Anmelden</Link>
            </div>
          </nav>
        </header>
        {children}
        <Chatbot />
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 text-sm leading-6 text-slate-500 sm:px-6 lg:px-8">
            Rechnerische Orientierung, keine Finanz-, Rechts- oder Steuerberatung. Eingaben und Objektunterlagen müssen vor einer Entscheidung geprüft werden.
          </div>
        </footer>
      </body>
    </html>
  );
}
