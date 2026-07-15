import Link from "next/link";
import { Brand } from "@/components/ui/brand";

export function SiteFooter() {
  return (
    <footer role="contentinfo" className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 print:hidden">
      <div className="mx-auto grid max-w-[1480px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr_1fr] lg:px-8">
        <div>
          <Brand />
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">Orientierung für Immobilienentscheidungen in Deutschland. Verständliche Berechnungen, transparente Annahmen und nachvollziehbare KI-Erklärungen.</p>
          <div className="mt-5 grid gap-2 text-xs text-slate-500 dark:text-slate-400">
            <p>Calculation Engine und KI-Hinweise sind klar getrennt.</p>
            <p>Förder-, Steuer- und Finanzhinweise sind als Orientierung gekennzeichnet.</p>
          </div>
        </div>
        <div className="grid gap-6 text-sm sm:grid-cols-2 lg:grid-cols-1">
          <div className="space-y-3">
            <p className="font-bold text-ink dark:text-white">Plattform</p>
            <Link href="/analyse" className="block text-slate-600 hover:text-teal dark:text-slate-300">Kostenlose Analyse</Link>
            <Link href="/dashboard/zahlungen" className="block text-slate-600 hover:text-teal dark:text-slate-300">Pakete</Link>
            <Link href="/#so-funktionierts" className="block text-slate-600 hover:text-teal dark:text-slate-300">So funktioniert’s</Link>
          </div>
          <div className="space-y-3">
            <p className="font-bold text-ink dark:text-white">Konto</p>
            <Link href="/login" className="block text-slate-600 hover:text-teal dark:text-slate-300">Anmelden</Link>
            <Link href="/analysen" className="block text-slate-600 hover:text-teal dark:text-slate-300">Analysen</Link>
            <Link href="/dashboard/properties" className="block text-slate-600 hover:text-teal dark:text-slate-300">Immobilien</Link>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-bold text-ink dark:text-white">Mehr Vertrauen vor der Entscheidung</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <li>Transparent: Zahlen stammen ausschließlich aus der Berechnungslogik.</li>
            <li>Nachvollziehbar: Risiken, Annahmen und nächste Schritte werden getrennt dargestellt.</li>
            <li>Klar gekennzeichnet: Keine Finanz-, Rechts- oder Steuerberatung.</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 px-4 py-5 text-center text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">Schätzung und Orientierung, keine Finanz-, Rechts- oder Steuerberatung. Angaben und offizielle Unterlagen vor einer Entscheidung prüfen.</div>
    </footer>
  );
}
