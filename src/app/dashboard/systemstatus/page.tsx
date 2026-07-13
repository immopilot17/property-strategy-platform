import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

const modules = [
  ["Analyse-Engine", "Kaufkosten, Tragbarkeit, Finanzierung, Cashflow, Steuern und Risiken werden nachvollziehbar berechnet."],
  ["Förderintelligenz", "Versionierte KfW- und Landesprogramme werden über eine erweiterbare Provider-Schicht normalisiert."],
  ["Agenten-Prüfung", "Fachagenten und Supervisor trennen Fakten, Annahmen, Warnungen und Empfehlungen."],
  ["Konto und Pakete", "Analysen, Tokenbudgets und Käufe werden dem angemeldeten Konto zugeordnet."],
  ["Premium-Bericht", "Analyse, Förderrecherche, Finanzierung, Steuern, Risiken und Empfehlungen können als PDF dokumentiert werden."]
];

export default function SystemstatusPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-teal dark:text-slate-300 dark:hover:text-teal-200"><ArrowLeft size={16} aria-hidden="true" />Zur Übersicht</Link>
      <header className="mt-8 max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-teal dark:text-teal-300">Systemübersicht</p><h1 className="mt-3 text-3xl font-black tracking-tight text-ink dark:text-white sm:text-5xl">Plattformmodule</h1><p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">Die zentralen Funktionen verwenden gemeinsame Datenmodelle, Validierung und nachvollziehbare Berechnungsregeln.</p></header>
      <section className="mt-9 grid gap-4 sm:grid-cols-2">
        {modules.map(([title, description]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-ink dark:text-white">{title}</h2><StatusBadge tone="positive">Bereit</StatusBadge></div><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p></article>)}
      </section>
      <aside className="mt-7 flex items-start gap-3 rounded-2xl bg-cloud p-5 text-sm leading-6 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><CheckCircle2 className="mt-0.5 shrink-0 text-teal" size={19} aria-hidden="true" /><p>Der technische Modulstatus ersetzt keine Verfügbarkeitsmessung externer Dienste wie Supabase, OpenAI, Stripe, PayPal oder offizieller Förderquellen.</p></aside>
    </main>
  );
}
