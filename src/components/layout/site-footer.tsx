import Link from "next/link";
import { Brand } from "@/components/ui/brand";

export function SiteFooter() {
  return (
    <footer role="contentinfo" className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 print:hidden">
      <div className="mx-auto grid max-w-[1480px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div><Brand /><p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">Orientierung für Immobilienentscheidungen in Deutschland. Verständliche Berechnungen, transparente Annahmen und nachvollziehbare KI-Erklärungen.</p></div>
        <div className="grid grid-cols-2 gap-4 text-sm"><div className="space-y-3"><p className="font-bold text-ink dark:text-white">Plattform</p><Link href="/analyse" className="block text-slate-600 hover:text-teal dark:text-slate-300">Kostenlose Analyse</Link><Link href="/dashboard/zahlungen" className="block text-slate-600 hover:text-teal dark:text-slate-300">Pakete</Link></div><div className="space-y-3"><p className="font-bold text-ink dark:text-white">Konto</p><Link href="/login" className="block text-slate-600 hover:text-teal dark:text-slate-300">Anmelden</Link><Link href="/analysen" className="block text-slate-600 hover:text-teal dark:text-slate-300">Analysen</Link></div></div>
      </div>
      <div className="border-t border-slate-200 px-4 py-5 text-center text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">Schätzung und Orientierung, keine Finanz-, Rechts- oder Steuerberatung. Angaben und offizielle Unterlagen vor einer Entscheidung prüfen.</div>
    </footer>
  );
}
