"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AnalysisInput, FullAnalysisResult, RiskLevel, StrategyType } from "@/features/analysis/domain";
import { FundingIntelligence } from "./funding-intelligence";
import { hasTier, type AccessTier } from "@/features/payments/packages";

const eur = (value: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);

const pct = (value: number) =>
  new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  }).format(value) + " %";

const riskClass: Record<RiskLevel, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-950",
  medium: "border-amber-200 bg-amber-50 text-amber-950",
  high: "border-orange-200 bg-orange-50 text-orange-950",
  critical: "border-red-200 bg-red-50 text-red-950"
};

const riskLabel: Record<RiskLevel, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch"
};

const strategyClass: Record<StrategyType, string> = {
  safe: "border-emerald-200 bg-emerald-50",
  balanced: "border-blue-200 bg-blue-50",
  maximum: "border-orange-200 bg-orange-50",
  alternative: "border-violet-200 bg-violet-50"
};

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      {note ? <p className="mt-2 text-xs leading-5 text-slate-500">{note}</p> : null}
    </article>
  );
}

function Upgrade({ title, tier }: { title: string; tier: string }) {
  return <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6"><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">Diese vertiefende Auswertung gehört zum Paket {tier}. Die grundlegende Immobilienanalyse bleibt kostenlos.</p><Link href="/dashboard/zahlungen" className="mt-4 inline-block rounded-xl bg-slate-950 px-4 py-3 font-bold text-white">Pakete vergleichen</Link></section>;
}

export function ResultPanel({
  result,
  aiSummary,
  aiLoading,
  cloudStatus,
  onExplain,
  onCloudSave,
  input
}: {
  result: FullAnalysisResult;
  aiSummary: string;
  aiLoading: boolean;
  cloudStatus: string;
  onExplain: () => void;
  onCloudSave: () => void;
  input: AnalysisInput;
}) {
  const [accessTier, setAccessTier] = useState<AccessTier>("free");
  useEffect(() => { fetch("/api/payments/entitlements").then((response) => response.json()).then((data: { tier?: AccessTier }) => setAccessTier(data.tier ?? "free")).catch(() => setAccessTier("free")); }, []);
  const recommended = result.strategies.find(
    (strategy) => strategy.type === result.recommendedStrategyType
  );

  return (
    <div id="ergebnis" className="space-y-10">
      <section className={`rounded-3xl border p-7 ${riskClass[result.overallRiskLevel]}`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide">Gesamtbewertung</p>
            <h2 className="mt-2 text-3xl font-bold">
              Risiko {riskLabel[result.overallRiskLevel]}
            </h2>
            <p className="mt-4 max-w-3xl leading-7">{result.recommendationSummary}</p>
          </div>
          <div className="rounded-2xl bg-white/70 px-6 py-4 text-center">
            <p className="text-sm font-medium">Risikowert</p>
            <p className="mt-1 text-3xl font-bold">{result.riskScore}/100</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Kernzahlen</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Gesamtinvestition" value={eur(result.purchaseCosts.totalInvestmentCosts)} />
          <Metric label="Darlehenssumme" value={eur(result.financing.requiredLoanAmount)} />
          <Metric label="Monatliche Rate" value={eur(result.financing.monthlyLoanRate)} />
          <Metric label="Kaufpreis je m²" value={eur(result.profitability.pricePerSquareMeter)} />
          <Metric label="Verbleibende Liquidität" value={eur(result.affordability.remainingMonthlyLiquidity)} />
        </div>
      </section>

      <section id="risiken">
        <h2 className="text-2xl font-bold">Erkannte Risiken</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {result.risks.slice(0, 4).map((risk) => (
            <article key={risk.id} className={`rounded-2xl border p-5 ${riskClass[risk.level]}`}>
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-bold">{risk.title}</h3>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">
                  {riskLabel[risk.level]}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6">{risk.description}</p>
              {risk.recommendation ? (
                <p className="mt-4 rounded-xl bg-white/70 p-3 text-sm leading-6">
                  <strong>Empfehlung:</strong> {risk.recommendation}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {hasTier(accessTier, "plus") ? <section id="strategien">
        <div>
          <h2 className="text-2xl font-bold">Finanzierungsstrategien</h2>
          {recommended ? (
            <p className="mt-2 text-slate-600">
              Auf Basis des Risikoprofils bevorzugt: <strong>{recommended.title}</strong>
            </p>
          ) : null}
        </div>

        <div className="mt-5 space-y-5">
          {result.strategies.map((strategy) => (
            <article
              key={strategy.type}
              className={`rounded-3xl border p-6 ${strategyClass[strategy.type]}`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-xl font-bold">{strategy.title}</h3>
                  <p className="mt-2 max-w-4xl leading-7 text-slate-700">{strategy.summary}</p>
                </div>
                {strategy.type === result.recommendedStrategyType ? (
                  <span className="w-fit rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                    Bevorzugt
                  </span>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Eigenkapital" value={eur(strategy.recommendedEquity)} />
                <Metric label="Darlehen" value={eur(strategy.estimatedLoanAmount)} />
                <Metric label="Monatsrate" value={eur(strategy.estimatedMonthlyRate)} />
                <Metric label="Reserve" value={eur(strategy.estimatedRemainingReserve)} />
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-3">
                <div className="rounded-2xl bg-white/75 p-5">
                  <h4 className="font-bold">Vorteile</h4>
                  <ul className="mt-3 space-y-2 text-sm leading-6">
                    {strategy.advantages.map((item) => <li key={item}>+ {item}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl bg-white/75 p-5">
                  <h4 className="font-bold">Nachteile</h4>
                  <ul className="mt-3 space-y-2 text-sm leading-6">
                    {strategy.disadvantages.map((item) => <li key={item}>− {item}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl bg-white/75 p-5">
                  <h4 className="font-bold">Nächste Schritte</h4>
                  <ol className="mt-3 space-y-2 text-sm leading-6">
                    {strategy.nextSteps.map((item, index) => (
                      <li key={item}>{index + 1}. {item}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section> : <Upgrade title="Finanzierungsalternativen verständlich vergleichen" tier="Finanzierung" />}

      {hasTier(accessTier, "pro") ? <section id="agenten">
        <h2 className="text-2xl font-bold">Agenten- und Supervisor-Prüfung</h2>
        {result.supervisor ? <>
        <div className="mt-5 rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">Supervisor</p>
          <p className="mt-3 text-lg leading-7">{result.supervisor.verdict}</p>
          <ol className="mt-4 space-y-2 text-sm text-slate-200">{result.supervisor.priorityActions.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol>
          {result.supervisor.conflicts.map((item) => <p key={item} className="mt-3 rounded-xl bg-amber-400/15 p-3 text-sm text-amber-100">Konflikt: {item}</p>)}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(result.agentFindings ?? []).map((item) => (
            <article key={item.agent} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3"><h3 className="font-bold">{item.facts.title}</h3><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">{item.facts.score}/100</span></div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.facts.summary}</p>
              {item.warnings.map((warning) => <p key={warning} className="mt-3 text-sm font-medium text-amber-700">{warning}</p>)}
            </article>
          ))}
        </div>
        </> : <p className="mt-4 text-slate-600">Für ältere gespeicherte Analysen bitte die Analyse erneut berechnen.</p>}
      </section> : <Upgrade title="Persönliche Strategie- und Agentenprüfung" tier="Strategie" />}

      {hasTier(accessTier, "pro") ? <section id="steuer" className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Steuerliche Orientierung</h2>
          <p className="mt-2 text-sm text-slate-600">
            {result.tax.assessmentType === "joint" ? "Gemeinsamer Kauf" : "Kauf allein"} · {result.tax.useType === "owner_occupation" ? "Eigennutzung" : result.tax.useType === "capital_investment" ? "Kapitalanlage" : "Gemischte Nutzung"} · Schätzung
          </p>
          {result.tax.enabled ? (
            <div className="mt-4 space-y-3">
              <p>Geschätzte Zinsen im ersten Jahr: <strong>{eur(result.tax.annualInterestEstimate)}</strong></p>
              <p>Geschätzte AfA: <strong>{eur(result.tax.annualDepreciationEstimate)}</strong></p>
              <p>Geschätzte Werbungskosten: <strong>{eur(result.tax.annualAdvertisingCostsEstimate)}</strong></p>
              <p>Geschätztes steuerliches Vermietungsergebnis: <strong>{eur(result.tax.estimatedTaxableRentalResult)}</strong></p>
              <p>Orientierender Steuereffekt: <strong>{eur(result.tax.estimatedAnnualTaxEffect)}</strong></p>
            </div>
          ) : (
            <p className="mt-4 text-slate-600">Für diese Nutzung wurde keine Vermietungs-Steuerschätzung berechnet.</p>
          )}
          <p className="mt-5 text-xs leading-5 text-slate-500">{result.tax.disclaimer}</p>
        </article>

        {hasTier(accessTier, "plus") ? <FundingIntelligence input={input} /> : null}
      </section>
      : hasTier(accessTier, "plus") ? <FundingIntelligence input={input} /> : <Upgrade title="Förderung und steuerliche Orientierung" tier="Finanzierung oder Strategie" />}

      {hasTier(accessTier, "starter") ? <section className="rounded-3xl bg-slate-950 p-7 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">KI-Erklärung und Cloudspeicherung</h2>
            <p className="mt-2 max-w-3xl leading-7 text-slate-300">
              Die Berechnungen sind deterministisch. Die KI wird nur auf Knopfdruck für eine verständliche Erklärung verwendet.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onExplain}
              disabled={aiLoading}
              className="rounded-xl bg-white px-4 py-3 font-bold text-slate-950 disabled:opacity-50"
            >
              {aiLoading ? "KI wertet aus…" : "KI-Erklärung erstellen"}
            </button>
            {hasTier(accessTier, "premium") ? <button type="button" onClick={() => { sessionStorage.setItem("property-strategy-report", JSON.stringify({ input, result, aiSummary })); window.open("/analyse/bericht", "_blank", "noopener,noreferrer"); }} className="rounded-xl border border-emerald-400 px-4 py-3 font-bold text-emerald-300">PDF-Bericht erstellen</button> : null}
            <button
              type="button"
              onClick={onCloudSave}
              className="rounded-xl border border-slate-600 px-4 py-3 font-bold"
            >
              In Supabase speichern
            </button>
          </div>
        </div>

        {cloudStatus ? <p className="mt-4 text-sm text-slate-300">{cloudStatus}</p> : null}
        {aiSummary ? (
          <div className="mt-6 whitespace-pre-wrap rounded-2xl bg-white/10 p-5 leading-7 text-slate-100">
            {aiSummary}
          </div>
        ) : null}
      </section> : <Upgrade title="KI-Erklärung und Cloudspeicherung" tier="Basis Plus" />}

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="font-bold">Annahmen und Grenzen</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          {result.assumptions.map((assumption) => <li key={assumption}>• {assumption}</li>)}
        </ul>
      </section>
    </div>
  );
}
