"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AnalysisInput, FullAnalysisResult } from "@/features/analysis/domain";

type ReportData = { input: AnalysisInput; result: FullAnalysisResult; aiSummary?: string };
const eur = (value: number) => value.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export default function AnalysisReportPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [message, setMessage] = useState("Bericht wird vorbereitet …");

  useEffect(() => {
    Promise.all([
      fetch("/api/payments/entitlements").then((response) => response.json() as Promise<{ tier: string }>),
      Promise.resolve(sessionStorage.getItem("property-strategy-report"))
    ]).then(([access, stored]) => {
      if (access.tier !== "premium") { setMessage("Der vollständige PDF-Bericht ist im Premium-Paket verfügbar."); return; }
      if (!stored) { setMessage("Keine Analyse für den Bericht gefunden."); return; }
      setReport(JSON.parse(stored) as ReportData); setMessage("");
    }).catch(() => setMessage("Bericht konnte nicht geladen werden."));
  }, []);

  if (!report) return <main className="mx-auto max-w-3xl px-4 py-16"><p>{message}</p><Link href="/analyse" className="mt-5 inline-block font-bold text-emerald-700">Zur Analyse</Link></main>;
  const { input, result } = report;
  return <main className="mx-auto max-w-4xl bg-white px-6 py-10 text-slate-950 print:max-w-none print:px-0">
    <div className="mb-8 flex items-center justify-between gap-4 print:hidden"><Link href="/analyse" className="font-bold text-emerald-700">Zurück</Link><button onClick={() => window.print()} className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Als PDF speichern</button></div>
    <header className="border-b border-slate-300 pb-6"><p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Property Strategy Platform</p><h1 className="mt-2 text-3xl font-bold">Vollständige Immobilienanalyse</h1><p className="mt-2 text-slate-600">{input.property.title} · erstellt am {new Date(result.calculatedAt).toLocaleDateString("de-DE")}</p></header>
    <section className="mt-8"><h2 className="text-xl font-bold">Zusammenfassung</h2><p className="mt-3 leading-7">{result.recommendationSummary}</p></section>
    {result.fundingSuggestions.length ? <section className="mt-8 break-inside-avoid"><h2 className="text-xl font-bold">Förderhinweise</h2>{result.fundingSuggestions.map((suggestion) => <div key={suggestion.id} className="mt-4 rounded-2xl border border-slate-200 p-5"><h3 className="font-bold">{suggestion.title}</h3><p className="mt-2 text-sm leading-6 text-slate-700">{suggestion.reason}</p></div>)}</section> : null}
    <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">{[["Gesamtinvestition", result.purchaseCosts.totalInvestmentCosts], ["Darlehen", result.financing.requiredLoanAmount], ["Monatsrate", result.financing.monthlyLoanRate], ["Restschuld", result.financing.remainingDebtAfterFixedPeriod]].map(([label, value]) => <div key={String(label)} className="border border-slate-200 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-bold">{eur(Number(value))}</p></div>)}</section>
    {result.financing.monthlySpecialRepayment > 0 ? <section className="mt-6 border border-slate-200 p-4"><p className="text-sm"><strong>Monatliche Sondertilgung:</strong> {eur(result.financing.monthlySpecialRepayment)}</p>{result.financing.projectedMonthlyLoanRateAfterFixedPeriod > 0 ? <p className="mt-2 text-sm">Nach der Zinsbindung wird bei einem erwarteten Anschlusszins von {result.financing.projectedAnnualInterestRateAfterFixedPeriodPercent.toFixed(2)} % eine neue monatliche Rate von ca. {eur(result.financing.projectedMonthlyLoanRateAfterFixedPeriod)} erwartet.</p> : null}</section> : null}
    <section className="mt-8 break-inside-avoid"><h2 className="text-xl font-bold">Risiken und nächste Schritte</h2>{result.risks.map((risk) => <div key={risk.id} className="mt-4 border-l-4 border-amber-400 pl-4"><h3 className="font-bold">{risk.title}</h3><p className="mt-1 text-sm leading-6">{risk.description}</p></div>)}</section>
    <section className="mt-8 break-before-page"><h2 className="text-xl font-bold">Finanzierungsalternativen</h2>{result.strategies.map((strategy) => <div key={strategy.type} className="mt-5 break-inside-avoid border border-slate-200 p-5"><h3 className="font-bold">{strategy.title}</h3><p className="mt-2 text-sm leading-6">{strategy.summary}</p><p className="mt-2 text-sm">Rate: {eur(strategy.estimatedMonthlyRate)} · Reserve: {eur(strategy.estimatedRemainingReserve)}</p></div>)}</section>
    <section className="mt-8 break-inside-avoid"><h2 className="text-xl font-bold">Steuerliche Orientierung</h2><p className="mt-3 text-sm leading-6">Zinsen: {eur(result.tax.annualInterestEstimate)} · AfA: {eur(result.tax.annualDepreciationEstimate)} · Werbungskosten: {eur(result.tax.annualAdvertisingCostsEstimate)} · geschätzter Steuereffekt: {eur(result.tax.estimatedAnnualTaxEffect)}</p><p className="mt-2 text-xs text-slate-500">{result.tax.disclaimer}</p></section>
    {report.aiSummary ? <section className="mt-8 break-inside-avoid"><h2 className="text-xl font-bold">KI-Erklärung</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{report.aiSummary}</p></section> : null}
    <footer className="mt-10 border-t border-slate-300 pt-4 text-xs leading-5 text-slate-500">Rechnerische Orientierung, keine Finanz-, Rechts- oder Steuerberatung. Eingaben, Annahmen und offizielle Unterlagen müssen vor einer Entscheidung geprüft werden.</footer>
  </main>;
}
