"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readAnalysisDraft, readLocalAnalyses, type SavedAnalysis } from "@/lib/storage/analyses";

export function DashboardHome() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [hasDraft, setHasDraft] = useState(false);
  useEffect(() => { setAnalyses(readLocalAnalyses()); setHasDraft(Boolean(readAnalysisDraft())); }, []);
  const latest = analyses[0];

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Dashboard</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Deine Immobilienentscheidungen</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">Starte mit einem Objekt. Die Plattform führt dich in klaren Schritten zu einer nachvollziehbaren Einschätzung.</p></div><Link href="/analyse?entry=link" className="rounded-2xl bg-slate-950 px-6 py-4 font-bold text-white">Neue Analyse</Link></div>

      {latest ? (
        <section className="mt-10 rounded-3xl bg-slate-950 p-7 text-white"><p className="text-sm font-bold uppercase tracking-wide text-slate-400">Letzte Analyse</p><h2 className="mt-2 text-2xl font-bold">{latest.title}</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><div><p className="text-sm text-slate-400">Gesamtinvestition</p><p className="mt-1 text-xl font-bold">{latest.result.purchaseCosts.totalInvestmentCosts.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}</p></div><div><p className="text-sm text-slate-400">Monatsrate</p><p className="mt-1 text-xl font-bold">{latest.result.financing.monthlyLoanRate.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}</p></div><div><p className="text-sm text-slate-400">Risiko</p><p className="mt-1 text-xl font-bold">{latest.result.overallRiskLevel}</p></div></div></section>
      ) : (
        <section className="mt-10 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]"><article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-7"><p className="text-sm font-bold uppercase tracking-wide text-emerald-800">Dein nächster Schritt</p><h2 className="mt-2 text-2xl font-bold">In wenigen Minuten zu einer ersten Einschätzung.</h2><p className="mt-3 max-w-xl leading-7 text-slate-700">Füge einen Exposé-Link ein oder erfasse die wichtigsten Angaben selbst. Eine Anmeldung ist dafür nicht nötig.</p><Link href="/analyse?entry=link" className="mt-6 inline-block rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white">Exposé hinzufügen</Link>{hasDraft ? <Link href="/analyse" className="ml-3 inline-block rounded-xl border border-emerald-700 px-5 py-3 font-bold text-emerald-800">Entwurf fortsetzen</Link> : null}</article><aside className="rounded-3xl border border-slate-200 bg-white p-7"><p className="text-sm font-bold uppercase tracking-wide text-slate-500">So funktioniert es</p><ol className="mt-4 space-y-4 text-sm leading-6 text-slate-700"><li><strong>1. Objekt</strong><br />Preis, Lage und Zustand erfassen.</li><li><strong>2. Haushalt</strong><br />Rate und Reserve realistisch prüfen.</li><li><strong>3. Ergebnis</strong><br />Kosten, Chancen und Risiken verstehen.</li></ol></aside></section>
      )}

      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4"><article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-medium text-slate-500">Lokal gespeichert</p><p className="mt-2 text-4xl font-bold">{analyses.length}</p><Link href="/analysen" className="mt-5 inline-block font-bold text-emerald-700">Alle Analysen →</Link></article><Link href="/analyse?entry=manual" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1"><p className="text-sm font-bold uppercase tracking-wide text-slate-500">Finanzen</p><h2 className="mt-2 text-xl font-bold">Haushalt und Eigenkapital</h2><p className="mt-3 text-sm leading-6 text-slate-600">Einkommen, Ausgaben, Kredite und Reserve erfassen.</p></Link><Link href="/analyse?entry=manual" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1"><p className="text-sm font-bold uppercase tracking-wide text-slate-500">Objekt</p><h2 className="mt-2 text-xl font-bold">Immobilie prüfen</h2><p className="mt-3 text-sm leading-6 text-slate-600">Preis, Miete, Nebenkosten, Zustand und Sanierung.</p></Link><Link href="/pakete" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1"><p className="text-sm font-bold uppercase tracking-wide text-slate-500">Mehr Tiefe</p><h2 className="mt-2 text-xl font-bold">Finanzierung und Strategie</h2><p className="mt-3 text-sm leading-6 text-slate-600">Optionale Hilfe, wenn du weitergehen möchtest.</p></Link></section>
    </main>
  );
}
