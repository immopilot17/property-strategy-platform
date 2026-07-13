"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AnalysisInput, FullAnalysisResult } from "@/features/analysis/domain";
import type { FundingResponse } from "@/components/analysis/funding-intelligence";

type ReportData = { input: AnalysisInput; result: FullAnalysisResult; aiSummary?: string; fundingData?: FundingResponse | null };
const eur = (value: number) => value.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="border border-slate-200 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}

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
      const parsed = JSON.parse(stored) as ReportData;
      setReport(parsed);
      setMessage("");
      document.title = `Immobilienanalyse-${parsed.input.property.title || "Bericht"}`;
    }).catch(() => setMessage("Bericht konnte nicht geladen werden."));
  }, []);

  if (!report) return <main className="mx-auto max-w-3xl px-4 py-16"><p>{message}</p><Link href="/analyse" className="mt-5 inline-block font-bold text-emerald-700">Zur Analyse</Link></main>;
  const { input, result, fundingData } = report;

  return <main className="mx-auto max-w-4xl bg-white px-6 py-10 text-slate-950 print:max-w-none print:px-0">
    <div className="mb-8 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between"><Link href="/analyse" className="font-bold text-emerald-700">Zurück</Link><div className="flex flex-col items-start gap-2 sm:items-end"><button onClick={() => window.print()} className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">PDF herunterladen</button><p className="text-xs text-slate-500">Im Druckfenster „Als PDF speichern“ wählen.</p></div></div>

    <header className="border-b border-slate-300 pb-6"><p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Property Strategy Platform · Premium</p><h1 className="mt-2 text-3xl font-bold">Vollständige Immobilienanalyse</h1><p className="mt-2 text-slate-600">{input.property.title} · erstellt am {new Date(result.calculatedAt).toLocaleDateString("de-DE")}</p></header>

    <section className="mt-8"><h2 className="text-xl font-bold">Entscheidungsübersicht</h2><p className="mt-3 leading-7">{result.recommendationSummary}</p><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4"><Metric label="Gesamtinvestition" value={eur(result.purchaseCosts.totalInvestmentCosts)} /><Metric label="Darlehen" value={eur(result.financing.requiredLoanAmount)} /><Metric label="Monatsrate" value={eur(result.financing.monthlyLoanRate)} /><Metric label="Risiko" value={`${result.riskScore}/100`} /></div></section>

    <section className="mt-8 break-inside-avoid"><h2 className="text-xl font-bold">Haushalt und Tragbarkeit</h2><div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4"><Metric label="Haushaltseinkommen" value={eur(result.affordability.totalMonthlyIncome)} /><Metric label="Kreditbelastungen" value={eur(result.affordability.totalExistingLoanPayments)} /><Metric label="Eigenkapital gesamt" value={eur(result.affordability.totalAvailableEquity)} /><Metric label="Liquidität nach Kauf" value={eur(result.affordability.remainingMonthlyLiquidity)} /></div><p className="mt-4 text-sm leading-6">Kaufart: <strong>{input.user.purchaseType === "joint" ? "gemeinsam" : "allein"}</strong> · Nutzung: <strong>{input.user.purchaseGoal === "owner_occupation" ? "Eigennutzung" : input.user.purchaseGoal === "capital_investment" ? "Kapitalanlage" : "gemischte Nutzung"}</strong></p></section>

    <section className="mt-8 break-inside-avoid"><h2 className="text-xl font-bold">Kauf- und Projektkosten</h2><div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4"><Metric label="Kaufpreis" value={eur(result.purchaseCosts.purchasePrice)} /><Metric label="Kaufnebenkosten" value={eur(result.purchaseCosts.totalPurchaseCosts)} /><Metric label="Sanierung/Projekt" value={eur(result.purchaseCosts.totalProjectCosts)} /><Metric label="Restschuld" value={eur(result.financing.remainingDebtAfterFixedPeriod)} /></div></section>

    <section className="mt-8 break-inside-avoid"><h2 className="text-xl font-bold">Supervisor-Empfehlung</h2><p className="mt-3 leading-7">{result.supervisor.verdict}</p><ol className="mt-4 space-y-2 text-sm leading-6">{result.supervisor.priorityActions.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol>{result.supervisor.conflicts.map((item) => <p key={item} className="mt-3 border-l-4 border-amber-400 pl-4 text-sm">Konflikt: {item}</p>)}</section>

    <section className="mt-8 break-before-page"><h2 className="text-xl font-bold">Offizielle Förderrecherche</h2>{fundingData ? <><p className="mt-3 text-sm leading-6">{fundingData.supervisor.summary}</p>{fundingData.matches.map(({ program, status, openRequirements, estimatedFirstYearInterestAdvantage }) => <article key={`${program.providerId}-${program.programId}`} className="mt-5 break-inside-avoid border border-slate-200 p-5"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{program.providerId} · Programm {program.programId} · {status === "matching" ? "passend" : "Angaben prüfen"}</p><h3 className="mt-2 font-bold">{program.programName}</h3><p className="mt-2 text-sm leading-6">{program.description}</p>{program.maximumFunding.amount !== null ? <p className="mt-2 text-sm"><strong>Maximale Förderung:</strong> {eur(program.maximumFunding.amount)}</p> : null}{estimatedFirstYearInterestAdvantage !== null ? <p className="mt-2 text-sm"><strong>Geschätzter Zinsvorteil im ersten Jahr:</strong> {eur(estimatedFirstYearInterestAdvantage)}</p> : null}<p className="mt-2 text-sm"><strong>Antrag:</strong> {program.applicationProcess}</p><p className="mt-2 text-sm"><strong>Frist:</strong> {program.applicationDeadline}</p>{openRequirements.map((item) => <p key={item} className="mt-2 text-sm"><strong>Offene Voraussetzung:</strong> {item}</p>)}<p className="mt-3 break-all text-xs text-slate-500">Offizielle Quelle: {program.officialSource} · aktualisiert {new Date(program.lastUpdated).toLocaleDateString("de-DE")}</p></article>)}{fundingData.supervisor.conflicts.map((item) => <p key={item} className="mt-4 border-l-4 border-amber-400 pl-4 text-sm">Möglicher Förderkonflikt: {item}</p>)}<p className="mt-4 text-xs leading-5 text-slate-500">{fundingData.supervisor.warning}</p></> : <p className="mt-3 text-sm text-slate-600">Zum Zeitpunkt der Berichtserstellung lagen keine geladenen offiziellen Fördertreffer vor. Förderbedingungen müssen vor Antragstellung erneut geprüft werden.</p>}</section>

    <section className="mt-8 break-before-page"><h2 className="text-xl font-bold">Finanzierungsalternativen</h2>{result.strategies.map((strategy) => <article key={strategy.type} className="mt-5 break-inside-avoid border border-slate-200 p-5"><h3 className="font-bold">{strategy.title}{strategy.type === result.recommendedStrategyType ? " · empfohlen" : ""}</h3><p className="mt-2 text-sm leading-6">{strategy.summary}</p><p className="mt-2 text-sm">Eigenkapital: {eur(strategy.recommendedEquity)} · Darlehen: {eur(strategy.estimatedLoanAmount)} · Rate: {eur(strategy.estimatedMonthlyRate)} · Reserve: {eur(strategy.estimatedRemainingReserve)}</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><h4 className="text-sm font-bold">Abwägung</h4>{strategy.advantages.map((item) => <p key={item} className="mt-1 text-sm">+ {item}</p>)}{strategy.disadvantages.map((item) => <p key={item} className="mt-1 text-sm">− {item}</p>)}</div><div><h4 className="text-sm font-bold">Nächste Schritte</h4>{strategy.nextSteps.map((item, index) => <p key={item} className="mt-1 text-sm">{index + 1}. {item}</p>)}</div></div></article>)}</section>

    <section className="mt-8 break-inside-avoid"><h2 className="text-xl font-bold">Steuerliche Orientierung · Schätzung</h2><p className="mt-3 text-sm leading-6">Zinsen: {eur(result.tax.annualInterestEstimate)} · AfA: {eur(result.tax.annualDepreciationEstimate)} · Werbungskosten: {eur(result.tax.annualAdvertisingCostsEstimate)} · steuerliches Vermietungsergebnis: {eur(result.tax.estimatedTaxableRentalResult)} · geschätzter Steuereffekt: {eur(result.tax.estimatedAnnualTaxEffect)}</p><p className="mt-2 text-xs text-slate-500">{result.tax.disclaimer}</p></section>

    <section className="mt-8 break-inside-avoid"><h2 className="text-xl font-bold">Risiken und Empfehlungen</h2>{result.risks.map((risk) => <div key={risk.id} className="mt-4 border-l-4 border-amber-400 pl-4"><h3 className="font-bold">{risk.title}</h3><p className="mt-1 text-sm leading-6">{risk.description}</p>{risk.recommendation ? <p className="mt-1 text-sm"><strong>Empfehlung:</strong> {risk.recommendation}</p> : null}</div>)}</section>

    {report.aiSummary ? <section className="mt-8 break-inside-avoid"><h2 className="text-xl font-bold">KI-Erklärung</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{report.aiSummary}</p></section> : null}
    <section className="mt-8 break-inside-avoid"><h2 className="text-xl font-bold">Annahmen</h2>{result.assumptions.map((item) => <p key={item} className="mt-2 text-sm leading-6">• {item}</p>)}</section>
    <footer className="mt-10 border-t border-slate-300 pt-4 text-xs leading-5 text-slate-500">Rechnerische und KI-gestützte Orientierung, keine Finanz-, Rechts- oder Steuerberatung. Förderbedingungen, Eingaben, Annahmen und offizielle Unterlagen müssen vor einer Entscheidung geprüft werden.</footer>
  </main>;
}
