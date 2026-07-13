"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Building2, CircleDollarSign, Clock3, Sparkles, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { FeedbackState } from "@/components/ui/feedback-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { readAnalysisDraft, readLocalAnalyses, type SavedAnalysis } from "@/lib/storage/analyses";

const currency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const riskStatus = {
  low: { label: "Empfehlenswert", tone: "positive" as const },
  medium: { label: "Mit Vorsicht", tone: "caution" as const },
  high: { label: "Nicht empfehlenswert", tone: "negative" as const },
  critical: { label: "Nicht empfehlenswert", tone: "negative" as const }
};

const actions = [
  { href: "/analyse", icon: BarChart3, title: "Neue Immobilie analysieren", description: "Kosten, Rate und Risiken verständlich prüfen" },
  { href: "/dashboard/foerderungen", icon: Sparkles, title: "Passende Förderprogramme prüfen", description: "KfW- und L-Bank-Programme aus offiziellen Quellen ansehen" },
  { href: "/dashboard/strategien", icon: WalletCards, title: "Finanzierungsstrategie öffnen", description: "Eigenkapital, Rate und Reserve einordnen" },
  { href: "/dashboard/properties", icon: Building2, title: "Gespeicherte Immobilien", description: "Objekte verwalten und Analysen fortsetzen" }
];

export function DashboardHome() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [hasDraft, setHasDraft] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAnalyses(readLocalAnalyses());
    setHasDraft(Boolean(readAnalysisDraft()));
    setReady(true);
  }, []);

  const latest = analyses[0];
  const currentStatus = latest ? riskStatus[latest.result.overallRiskLevel] : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal dark:text-teal-300">Deine Übersicht</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-ink dark:text-white sm:text-4xl">Was möchtest du als Nächstes tun?</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">Setze deine Entscheidung fort oder beginne eine neue, kostenlose Analyse.</p>
        </div>
        <ButtonLink href="/analyse" className="w-full sm:w-auto">Neue Analyse <ArrowRight size={18} aria-hidden="true" /></ButtonLink>
      </header>

      <section className="mt-8" aria-labelledby="continue-title">
        {!ready ? <FeedbackState kind="loading" title="Übersicht wird geladen" /> : hasDraft ? (
          <article className="overflow-hidden rounded-3xl bg-ink text-white shadow-soft">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-bold text-teal-200"><Clock3 size={17} aria-hidden="true" /> Gespeicherter Entwurf</p>
                <h2 id="continue-title" className="mt-3 text-2xl font-bold">Deine Analyse ist bereit zum Fortsetzen.</h2>
                <p className="mt-3 max-w-2xl leading-7 text-slate-300">Deine bisherigen Angaben wurden automatisch auf diesem Gerät gespeichert.</p>
              </div>
              <ButtonLink href="/analyse" variant="secondary" className="border-white/20 bg-white text-ink hover:bg-slate-100">Analyse fortsetzen <ArrowRight size={18} aria-hidden="true" /></ButtonLink>
            </div>
          </article>
        ) : latest ? (
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Letzte Analyse</p>
                <h2 id="continue-title" className="mt-2 text-2xl font-bold text-ink dark:text-white">{latest.title}</h2>
              </div>
              {currentStatus ? <StatusBadge tone={currentStatus.tone}>{currentStatus.label}</StatusBadge> : null}
            </div>
            <dl className="mt-6 grid gap-4 border-y border-slate-200 py-5 dark:border-slate-700 sm:grid-cols-3">
              <div><dt className="text-sm text-slate-500 dark:text-slate-400">Gesamtinvestition</dt><dd className="mt-1 text-xl font-bold text-ink dark:text-white">{currency.format(latest.result.purchaseCosts.totalInvestmentCosts)}</dd></div>
              <div><dt className="text-sm text-slate-500 dark:text-slate-400">Monatliche Rate</dt><dd className="mt-1 text-xl font-bold text-ink dark:text-white">{currency.format(latest.result.financing.monthlyLoanRate)}</dd></div>
              <div><dt className="text-sm text-slate-500 dark:text-slate-400">Gespeichert</dt><dd className="mt-1 text-base font-bold text-ink dark:text-white">{new Date(latest.createdAt).toLocaleDateString("de-DE")}</dd></div>
            </dl>
            <ButtonLink href="/analysen" variant="secondary" className="mt-5 w-full sm:w-auto">Ergebnis öffnen <ArrowRight size={18} aria-hidden="true" /></ButtonLink>
          </article>
        ) : (
          <article className="rounded-3xl border border-teal-200 bg-mint p-6 dark:border-teal-800 dark:bg-teal-950/50 sm:p-8">
            <p className="text-sm font-bold text-teal dark:text-teal-200">Dein nächster Schritt</p>
            <h2 id="continue-title" className="mt-2 text-2xl font-bold text-ink dark:text-white">Starte mit einer ersten Einschätzung.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-700 dark:text-slate-200">Du brauchst nur wenige Angaben. Eine Anmeldung ist für die kostenlose Immobilienanalyse nicht nötig.</p>
            <ButtonLink href="/analyse" className="mt-6 w-full sm:w-auto">Kostenlos analysieren <ArrowRight size={18} aria-hidden="true" /></ButtonLink>
          </article>
        )}
      </section>

      <section className="mt-10" aria-labelledby="actions-title">
        <div className="flex items-center justify-between gap-4">
          <h2 id="actions-title" className="text-xl font-bold text-ink dark:text-white">Schnellzugriff</h2>
          {analyses.length ? <Link href="/analysen" className="text-sm font-bold text-teal hover:underline dark:text-teal-300">Alle Analysen</Link> : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-soft focus-visible:outline-none dark:border-slate-700 dark:bg-slate-900 dark:hover:border-teal-700">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint text-teal dark:bg-teal-950 dark:text-teal-200"><Icon size={21} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block font-bold text-ink dark:text-white">{action.title}</span><span className="mt-1 block text-sm leading-6 text-slate-500 dark:text-slate-400">{action.description}</span></span>
                <ArrowRight className="mt-2 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal" size={18} aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      <aside className="mt-8 flex items-start gap-3 rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
        <CircleDollarSign className="mt-0.5 shrink-0 text-teal" size={19} aria-hidden="true" />
        <p>Berechnungen basieren auf deinen Angaben. Schätzungen, Annahmen und kostenpflichtige Vertiefungen werden immer klar gekennzeichnet.</p>
      </aside>
    </main>
  );
}
