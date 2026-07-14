"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Bot, Database, Download, ExternalLink, FileCheck2, Sparkles } from "lucide-react";
import type { AnalysisInput, FullAnalysisResult, RiskLevel } from "@/features/analysis/domain";
import { hasTier, type AccessTier } from "@/features/payments/packages";
import { Button, ButtonLink } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { StatusBadge } from "@/components/ui/status-badge";
import { FundingIntelligence, type FundingResponse } from "./funding-intelligence";

const eur = (value: number) => new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
}).format(value);

const pct = (value: number) => new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2
}).format(value) + " %";

const riskLabel: Record<RiskLevel, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch"
};

const decisionStatus: Record<RiskLevel, {
  label: string;
  tone: "positive" | "caution" | "negative";
  panel: string;
}> = {
  low: { label: "Empfehlenswert", tone: "positive", panel: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40" },
  medium: { label: "Mit Vorsicht", tone: "caution", panel: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40" },
  high: { label: "Nicht empfehlenswert", tone: "negative", panel: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40" },
  critical: { label: "Nicht empfehlenswert", tone: "negative", panel: "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/50" }
};

const confidenceLabel = { low: "Niedrig", medium: "Mittel", high: "Hoch" } as const;

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-2 text-2xl font-black tracking-tight text-ink dark:text-white">{value}</dd>
      {note ? <dd className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{note}</dd> : null}
    </div>
  );
}

function Upgrade({ title, tier, description }: { title: string; tier: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-cloud p-5 dark:border-slate-700 dark:bg-slate-800/70">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-teal dark:text-teal-300">Paket {tier}</p>
      <h3 className="mt-2 text-lg font-bold text-ink dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description} Die grundlegende Immobilienanalyse bleibt kostenlos.</p>
      <ButtonLink href="/dashboard/zahlungen" variant="secondary" size="sm" className="mt-4">Pakete vergleichen <ArrowRight size={16} aria-hidden="true" /></ButtonLink>
    </div>
  );
}

function ResultRow({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-200 py-3 last:border-b-0 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="text-sm text-slate-600 dark:text-slate-300">{label}</dt>
      <dd className={emphasis ? "font-black text-ink dark:text-white" : "font-bold text-ink dark:text-white"}>{value}</dd>
    </div>
  );
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
  const [fundingData, setFundingData] = useState<FundingResponse | null>(null);
  const [tokenBalance, setTokenBalance] = useState(0);

  useEffect(() => {
    fetch("/api/payments/entitlements")
      .then((response) => response.json())
      .then((data: { tier?: AccessTier; tokenBalance?: number }) => {
        setAccessTier(data.tier ?? "free");
        setTokenBalance(data.tokenBalance ?? 0);
      })
      .catch(() => setAccessTier("free"));
  }, []);

  const decision = decisionStatus[result.overallRiskLevel];
  const recommended = result.strategies.find((strategy) => strategy.type === result.recommendedStrategyType);
  const calculatedAt = new Date(result.calculatedAt).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
  const handlePdf = () => {
    sessionStorage.setItem("property-strategy-report", JSON.stringify({ input, result, aiSummary, fundingData }));
    window.open("/analyse/bericht", "_blank", "noopener,noreferrer");
  };

  return (
    <section id="ergebnis" className="mt-16 scroll-mt-24 border-t border-slate-200 pt-12 dark:border-slate-800" aria-labelledby="result-title">
      <header className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal dark:text-teal-300">Dein Ergebnis</p>
        <h2 id="result-title" className="text-balance mt-2 text-3xl font-black tracking-tight text-ink dark:text-white sm:text-5xl">Was die Zahlen für deine Entscheidung bedeuten.</h2>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Berechnet am {calculatedAt}</p>
      </header>

      <div className={`mt-8 rounded-3xl border p-6 sm:p-8 ${decision.panel}`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <StatusBadge tone={decision.tone}>{decision.label}</StatusBadge>
            <h3 className="mt-5 text-2xl font-black tracking-tight text-ink dark:text-white sm:text-3xl">Gesamtbewertung</h3>
            <p className="mt-4 text-lg leading-8 text-slate-700 dark:text-slate-200">{result.recommendationSummary}</p>
            {result.supervisor?.verdict ? <p className="mt-4 rounded-2xl bg-white/70 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-950/50 dark:text-slate-200"><strong>Einordnung:</strong> {result.supervisor.verdict}</p> : null}
          </div>
          <div className="shrink-0 rounded-2xl bg-white/80 px-6 py-5 text-center dark:bg-slate-950/60">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Risikoindikator</p>
            <p className="mt-1 text-3xl font-black text-ink dark:text-white">{result.riskScore}<span className="text-base font-semibold text-slate-500"> / 100</span></p>
            <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{riskLabel[result.overallRiskLevel]}</p>
          </div>
        </div>
      </div>

      {hasTier(accessTier, "starter") ? (
        <section className="mt-5 rounded-3xl bg-ink p-6 text-white sm:p-8" aria-labelledby="ai-analysis-title">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Bot className="text-teal-200" size={22} aria-hidden="true" />
                <h3 id="ai-analysis-title" className="text-xl font-black">KI-Analyse zu deinem Ergebnis</h3>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Lass Risiken, Annahmen und die nächsten sinnvollen Schritte verständlich einordnen. Verfügbares API-Budget: {new Intl.NumberFormat("de-DE").format(tokenBalance)} Tokens.</p>
            </div>
            <Button onClick={onExplain} disabled={aiLoading} variant="secondary" className="shrink-0 border-white/20 bg-white text-ink hover:bg-slate-100">
              <Sparkles size={17} aria-hidden="true" />
              {aiLoading ? "KI-Analyse wird erstellt …" : "KI-Analyse erstellen"}
            </Button>
          </div>
          {aiSummary ? <div className="mt-5 whitespace-pre-wrap rounded-2xl bg-white/[0.08] p-5 text-sm leading-7 text-slate-100"><p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-teal-200">KI-Interpretation</p>{aiSummary}</div> : null}
        </section>
      ) : (
        <div className="mt-5"><Upgrade title="KI-Analyse erstellen" tier="Analyse" description="Der Assistent erklärt Risiken, Annahmen und nächste Schritte anhand deiner Berechnung." /></div>
      )}

      <dl className="mt-5 grid gap-4 md:grid-cols-3">
        <Metric label="Gesamtinvestition" value={eur(result.purchaseCosts.totalInvestmentCosts)} note="Kaufpreis, Nebenkosten und Projektkosten" />
        <Metric label="Monatliche Darlehensrate" value={eur(result.financing.monthlyLoanRate)} note={`Bei ${pct(input.financing.annualInterestRatePercent)} Sollzins`} />
        <Metric label="Verbleibende Liquidität" value={eur(result.affordability.remainingMonthlyLiquidity)} note="Nach Lebenshaltung, Krediten und Immobilienbelastung" />
      </dl>

      {result.supervisor?.priorityActions.length ? (
        <section className="mt-8 rounded-3xl bg-ink p-6 text-white sm:p-8" aria-labelledby="next-actions-title">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-200">Deine nächsten Schritte</p>
          <h3 id="next-actions-title" className="mt-2 text-2xl font-bold">Jetzt sinnvoll weitergehen</h3>
          <ol className="mt-6 grid gap-3 lg:grid-cols-3">
            {result.supervisor.priorityActions.slice(0, 3).map((action, index) => (
              <li key={action} className="flex gap-3 rounded-2xl bg-white/[0.07] p-4 text-sm leading-6 text-slate-200">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal text-xs font-black text-white">{index + 1}</span>
                <span>{action}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900" aria-label="Analyse-Details">
        <Disclosure title="Finanzierung und Cashflow" description="Kaufkosten, Darlehen, Rate und laufende Tragbarkeit">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="font-bold text-ink dark:text-white">Kauf und Finanzierung</h3>
              <dl className="mt-2">
                <ResultRow label="Kaufpreis" value={eur(result.purchaseCosts.purchasePrice)} />
                <ResultRow label="Kaufnebenkosten" value={eur(result.purchaseCosts.totalPurchaseCosts)} />
                <ResultRow label="Projektkosten" value={eur(result.purchaseCosts.totalProjectCosts)} />
                <ResultRow label="Benötigtes Darlehen" value={eur(result.financing.requiredLoanAmount)} emphasis />
                <ResultRow label="Restschuld nach Zinsbindung" value={eur(result.financing.remainingDebtAfterFixedPeriod)} />
              </dl>
            </div>
            <div>
              <h3 className="font-bold text-ink dark:text-white">Monatliche Einordnung</h3>
              <dl className="mt-2">
                <ResultRow label="Haushaltseinkommen gesamt" value={eur(result.affordability.totalMonthlyIncome)} />
                <ResultRow label="Bestehende Kreditraten gesamt" value={eur(result.affordability.totalExistingLoanPayments)} />
                <ResultRow label="Persönliche Immobilienbelastung" value={eur(result.affordability.personalMonthlyPropertyBurden)} />
                <ResultRow label="Schuldendienstquote" value={pct(result.affordability.debtServiceRatioPercent)} />
                <ResultRow label="Verbleibende Liquidität" value={eur(result.affordability.remainingMonthlyLiquidity)} emphasis />
              </dl>
            </div>
          </div>
          {result.financing.projectedMonthlyLoanRateAfterFixedPeriod > 0 ? (
            <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">Bei einem geschätzten Anschlusszins von {pct(result.financing.projectedAnnualInterestRateAfterFixedPeriodPercent)} könnte die monatliche Rate nach der Zinsbindung etwa {eur(result.financing.projectedMonthlyLoanRateAfterFixedPeriod)} betragen.</p>
          ) : null}
          {input.user.purchaseGoal !== "owner_occupation" ? (
            <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
              <h3 className="font-bold text-ink dark:text-white">Vermietung und Cashflow</h3>
              <dl className="mt-2 grid gap-x-8 lg:grid-cols-2">
                <ResultRow label="Bruttomietrendite" value={pct(result.profitability.grossRentalYieldPercent)} />
                <ResultRow label="Nettomietrendite" value={pct(result.profitability.netRentalYieldPercent)} />
                <ResultRow label="Monatlicher Cashflow vor Steuern" value={eur(result.profitability.monthlyCashflowBeforeTax)} emphasis />
                <ResultRow label="Kaufpreis pro m²" value={eur(result.profitability.pricePerSquareMeter)} />
              </dl>
            </div>
          ) : null}
        </Disclosure>

        <Disclosure id="risiken" title="Risiken" description={`${result.risks.length} Hinweise – zuerst die wichtigsten prüfen`}>
          <div className="grid gap-3 lg:grid-cols-2">
            {result.risks.map((risk) => {
              const status = decisionStatus[risk.level];
              return (
                <article key={risk.id} className={`rounded-2xl border p-5 ${status.panel}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="font-bold text-ink dark:text-white">{risk.title}</h3>
                    <StatusBadge tone={status.tone}>Risiko {riskLabel[risk.level]}</StatusBadge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">{risk.description}</p>
                  {risk.recommendation ? <p className="mt-4 rounded-xl bg-white/70 p-3 text-sm leading-6 text-slate-700 dark:bg-slate-950/50 dark:text-slate-200"><strong>Nächster Schritt:</strong> {risk.recommendation}</p> : null}
                </article>
              );
            })}
          </div>
        </Disclosure>

        <Disclosure id="foerderungen" title="Förderungen" description={`${result.fundingSuggestions.length} mögliche Hinweise aus deinen Angaben`}>
          {result.fundingSuggestions.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {result.fundingSuggestions.map((suggestion) => (
                <article key={suggestion.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="font-bold text-ink dark:text-white">{suggestion.title}</h3>
                    <StatusBadge tone={suggestion.status === "needs_current_verification" ? "caution" : "info"}>{suggestion.status === "needs_current_verification" ? "Angaben ergänzen" : "Prüfen"}</StatusBadge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{suggestion.reason}</p>
                </article>
              ))}
            </div>
          ) : <p className="text-sm text-slate-600 dark:text-slate-300">Aus den aktuellen Angaben wurde kein allgemeiner Förderhinweis abgeleitet.</p>}
          <div className="mt-5">
            {hasTier(accessTier, "plus") ? <FundingIntelligence input={input} onLoaded={setFundingData} /> : <Upgrade title="Offizielle KfW- und Landesprogramme prüfen" tier="Finanzierung" description="Die vertiefte Prüfung zeigt Voraussetzungen, Fristen, Dokumente, Konflikte und verlinkt jede Empfehlung mit der offiziellen Quelle." />}
          </div>
        </Disclosure>

        <Disclosure id="steuer" title="Steuerliche Orientierung" description="Zinsen, AfA, Werbungskosten und möglicher Steuereffekt – klar als Schätzung">
          {hasTier(accessTier, "pro") ? (
            <article className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-ink dark:text-white">Unverbindliche Steuerschätzung</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{result.tax.assessmentType === "joint" ? "Gemeinsamer Kauf" : "Kauf allein"} · {result.tax.useType === "owner_occupation" ? "Eigennutzung" : result.tax.useType === "capital_investment" ? "Kapitalanlage" : "Gemischte Nutzung"}</p>
                </div>
                <StatusBadge tone="caution">Schätzung</StatusBadge>
              </div>
              {result.tax.enabled ? (
                <dl className="mt-5">
                  <ResultRow label="Zinsen im ersten Jahr" value={eur(result.tax.annualInterestEstimate)} />
                  <ResultRow label="AfA" value={eur(result.tax.annualDepreciationEstimate)} />
                  <ResultRow label="Werbungskosten" value={eur(result.tax.annualAdvertisingCostsEstimate)} />
                  <ResultRow label="Steuerliches Vermietungsergebnis" value={eur(result.tax.estimatedTaxableRentalResult)} />
                  <ResultRow label="Orientierender jährlicher Steuereffekt" value={eur(result.tax.estimatedAnnualTaxEffect)} emphasis />
                </dl>
              ) : <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">Für die gewählte Eigennutzung wird keine Vermietungs-Steuerschätzung berechnet.</p>}
              <p className="mt-5 text-xs leading-5 text-slate-500 dark:text-slate-400">{result.tax.disclaimer}</p>
            </article>
          ) : <Upgrade title="Steuerliche Auswirkungen einordnen" tier="Strategie" description="Die Orientierung unterscheidet Kauf allein oder gemeinsam sowie Eigennutzung, Kapitalanlage oder gemischte Nutzung." />}
        </Disclosure>

        <Disclosure id="strategien" title="Finanzierungsalternativen" description="Sicherheits-, Balance- und weitere Szenarien verständlich vergleichen">
          {hasTier(accessTier, "plus") ? (
            <div className="space-y-4">
              {recommended ? <p className="rounded-2xl bg-mint p-4 text-sm leading-6 text-teal dark:bg-teal-950 dark:text-teal-100"><strong>Bevorzugtes Szenario:</strong> {recommended.title}. {recommended.summary}</p> : null}
              {result.strategies.map((strategy) => (
                <article key={strategy.type} className={strategy.type === result.recommendedStrategyType ? "rounded-2xl border-2 border-teal p-5" : "rounded-2xl border border-slate-200 p-5 dark:border-slate-700"}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="font-bold text-ink dark:text-white">{strategy.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{strategy.summary}</p></div>
                    {strategy.type === result.recommendedStrategyType ? <StatusBadge tone="positive">Bevorzugt</StatusBadge> : null}
                  </div>
                  <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric label="Eigenkapital" value={eur(strategy.recommendedEquity)} />
                    <Metric label="Darlehen" value={eur(strategy.estimatedLoanAmount)} />
                    <Metric label="Monatsrate" value={eur(strategy.estimatedMonthlyRate)} />
                    <Metric label="Reserve" value={eur(strategy.estimatedRemainingReserve)} />
                  </dl>
                  <div className="mt-5 grid gap-5 text-sm leading-6 lg:grid-cols-3">
                    <div><h4 className="font-bold text-ink dark:text-white">Vorteile</h4><ul className="mt-2 space-y-1.5 text-slate-600 dark:text-slate-300">{strategy.advantages.map((item) => <li key={item}>+ {item}</li>)}</ul></div>
                    <div><h4 className="font-bold text-ink dark:text-white">Nachteile</h4><ul className="mt-2 space-y-1.5 text-slate-600 dark:text-slate-300">{strategy.disadvantages.map((item) => <li key={item}>− {item}</li>)}</ul></div>
                    <div><h4 className="font-bold text-ink dark:text-white">Nächste Schritte</h4><ol className="mt-2 space-y-1.5 text-slate-600 dark:text-slate-300">{strategy.nextSteps.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol></div>
                  </div>
                </article>
              ))}
            </div>
          ) : <Upgrade title="Finanzierungsalternativen vergleichen" tier="Finanzierung" description="Mehrere Szenarien zeigen Rate, Darlehen, Reserve sowie Vor- und Nachteile nebeneinander." />}
        </Disclosure>

        <Disclosure id="ki-agenten" title="Nachvollziehbarkeit und KI-Prüfung" description="Datenquellen, Aktualität, Vertrauen, Fakten, Annahmen und Interpretation">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-cloud p-4 dark:bg-slate-800"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Datenquelle</p><p className="mt-1 text-sm font-bold text-ink dark:text-white">Deine Eingaben und deterministische Berechnungen</p></div>
            <div className="rounded-2xl bg-cloud p-4 dark:bg-slate-800"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Aktualität</p><p className="mt-1 text-sm font-bold text-ink dark:text-white">{calculatedAt}</p></div>
            <div className="rounded-2xl bg-cloud p-4 dark:bg-slate-800"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Vertrauensniveau</p><p className="mt-1 text-sm font-bold text-ink dark:text-white">{confidenceLabel[result.supervisor.confidence]}</p></div>
          </div>

          {hasTier(accessTier, "pro") ? (
            <div className="mt-5 space-y-4">
              <article className="rounded-2xl bg-ink p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-200">Supervisor-Interpretation</p>
                <p className="mt-3 leading-7 text-slate-200">{result.supervisor.verdict}</p>
                {result.supervisor.conflicts.map((conflict) => <p key={conflict} className="mt-3 rounded-xl bg-amber-400/15 p-3 text-sm text-amber-100"><strong>Konflikt:</strong> {conflict}</p>)}
              </article>
              <div className="grid gap-3 lg:grid-cols-2">
                {result.agentFindings.map((finding) => (
                  <article key={finding.agent} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                    <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="font-bold text-ink dark:text-white">{finding.facts.title}</h3><StatusBadge tone={finding.confidence === "high" ? "positive" : finding.confidence === "medium" ? "caution" : "negative"}>Vertrauen {confidenceLabel[finding.confidence]}</StatusBadge></div>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300"><strong>Fakten:</strong> {finding.facts.summary}</p>
                    {finding.assumptions.length ? <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300"><strong>Annahmen:</strong> {finding.assumptions.join(" · ")}</p> : null}
                    {finding.warnings.map((warning) => <p key={warning} className="mt-3 text-sm font-semibold text-amber-800 dark:text-amber-200">{warning}</p>)}
                    {finding.facts.recommendations.length ? <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300"><strong>KI-Interpretation:</strong> {finding.facts.recommendations.join(" · ")}</p> : null}
                  </article>
                ))}
              </div>
            </div>
          ) : <div className="mt-5"><Upgrade title="Agenten- und Supervisor-Prüfung öffnen" tier="Strategie" description="Spezialisierte Agenten prüfen Finanzierung, Objekt, Förderung, Steuern und Risiken; der Supervisor löst Widersprüche auf." /></div>}

          <div className="mt-5 rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
            <h3 className="font-bold text-ink dark:text-white">Annahmen und Grenzen</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{result.assumptions.map((assumption) => <li key={assumption}>• {assumption}</li>)}</ul>
          </div>
        </Disclosure>

        <Disclosure title="Speichern und Bericht" description="Kontospeicherung und Premium-PDF">
          {hasTier(accessTier, "starter") ? (
            <div className="rounded-2xl bg-ink p-5 text-white sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2"><Database className="text-teal-200" size={20} aria-hidden="true" /><h3 className="font-bold">Analyse sichern</h3></div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Speichere das Ergebnis in deinem Konto oder erstelle den vollständigen Bericht.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button onClick={onCloudSave} variant="ghost" className="border border-white/20 text-white hover:bg-white/10"><Database size={17} aria-hidden="true" />Im Konto speichern</Button>
                  {hasTier(accessTier, "premium") ? <Button onClick={handlePdf} variant="ghost" className="border border-teal-400/50 text-teal-100 hover:bg-teal-400/10"><Download size={17} aria-hidden="true" />Gesamtbericht als PDF</Button> : null}
                </div>
              </div>
              {cloudStatus ? <p className="mt-4 text-sm text-slate-300" aria-live="polite">{cloudStatus}</p> : null}
              {!hasTier(accessTier, "premium") ? <p className="mt-4 text-xs text-slate-400">Der vollständige PDF-Bericht mit Analyse, Förderrecherche, Finanzierung und Steuerorientierung ist im Premium-Paket enthalten.</p> : null}
            </div>
          ) : <Upgrade title="Analyse im Konto speichern" tier="Analyse" description="Speichere deine Ergebnisse und rufe sie später wieder auf." />}
        </Disclosure>
      </section>

      <aside className="mt-6 flex flex-col gap-4 rounded-2xl bg-cloud p-5 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 shrink-0 text-teal" size={20} aria-hidden="true" /><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Diese Analyse ist eine Entscheidungshilfe. Steuer-, Rechts-, Finanzierungs- und Förderangaben sind keine individuelle Beratung.</p></div>
        <Link href="/analyse" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-teal hover:underline dark:text-teal-300">Angaben ändern <ExternalLink size={15} aria-hidden="true" /></Link>
      </aside>
    </section>
  );
}
