"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readLocalAnalyses, type SavedAnalysis } from "@/lib/storage/analyses";

export function DashboardHome() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);

  useEffect(() => setAnalyses(readLocalAnalyses()), []);

  const latest = analyses[0];

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Dashboard</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Deine Immobilienentscheidungen</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Analysiere neue Objekte, öffne gespeicherte Ergebnisse und vergleiche Risiken und Strategien.
          </p>
        </div>
        <Link href="/analyse" className="rounded-2xl bg-slate-950 px-6 py-4 font-bold text-white">
          Neue Analyse
        </Link>
      </div>

      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Lokal gespeichert</p>
          <p className="mt-2 text-4xl font-bold">{analyses.length}</p>
          <Link href="/analysen" className="mt-5 inline-block font-bold text-emerald-700">Alle Analysen →</Link>
        </article>

        <Link href="/analyse#finanzen" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Finanzen</p>
          <h2 className="mt-2 text-xl font-bold">Haushalt und Eigenkapital</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Einkommen, Ausgaben, Kredite und Reserve erfassen.</p>
        </Link>

        <Link href="/analyse#immobilie" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Objekt</p>
          <h2 className="mt-2 text-xl font-bold">Immobilie vollständig prüfen</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Preis, Miete, Nebenkosten, Zustand und Sanierung.</p>
        </Link>

        <Link href="/analyse#ergebnis" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Ergebnis</p>
          <h2 className="mt-2 text-xl font-bold">Risiken und Strategien</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Mehrere Finanzierungswege statt nur einer Zahl.</p>
        </Link>
      </section>

      {latest ? (
        <section className="mt-10 rounded-3xl bg-slate-950 p-7 text-white">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Letzte Analyse</p>
          <h2 className="mt-2 text-2xl font-bold">{latest.title}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-slate-400">Gesamtinvestition</p>
              <p className="mt-1 text-xl font-bold">
                {latest.result.purchaseCosts.totalInvestmentCosts.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Monatsrate</p>
              <p className="mt-1 text-xl font-bold">
                {latest.result.financing.monthlyLoanRate.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Risiko</p>
              <p className="mt-1 text-xl font-bold">{latest.result.overallRiskLevel}</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <h2 className="text-xl font-bold">Noch keine Analyse gespeichert</h2>
          <p className="mt-2 text-slate-600">Die erste vollständige Berechnung wird automatisch lokal gespeichert.</p>
        </section>
      )}
    </main>
  );
}
