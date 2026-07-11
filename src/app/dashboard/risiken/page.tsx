import Link from "next/link";

import {
  calculateAnalysis
} from "@/features/analysis/calculations";

import {
  defaultAnalysisInput,
  validateAnalysisInput
} from "@/features/analysis/domain";

import {
  analyzeRisks,
  getRiskLabel
} from "@/features/analysis/risks";

import type {
  RiskLevel
} from "@/features/analysis/domain";

const levelClasses: Record<
  RiskLevel,
  string
> = {
  low:
    "border-emerald-200 bg-emerald-50 text-emerald-900",
  medium:
    "border-amber-200 bg-amber-50 text-amber-900",
  high:
    "border-orange-200 bg-orange-50 text-orange-900",
  critical:
    "border-red-200 bg-red-50 text-red-900"
};

const badgeClasses: Record<
  RiskLevel,
  string
> = {
  low:
    "bg-emerald-200 text-emerald-900",
  medium:
    "bg-amber-200 text-amber-900",
  high:
    "bg-orange-200 text-orange-900",
  critical:
    "bg-red-200 text-red-900"
};

export default function RisksPage() {
  const validation =
    validateAnalysisInput(
      defaultAnalysisInput
    );

  if (!validation.success) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="text-3xl font-bold">
          Risikoanalyse nicht möglich
        </h1>

        <ul className="mt-6 space-y-2 text-red-700">
          {validation.errors.map(
            (error) => (
              <li
                key={`${error.field}-${error.message}`}
              >
                {error.field}: {error.message}
              </li>
            )
          )}
        </ul>
      </main>
    );
  }

  const calculation =
    calculateAnalysis(validation.data);

  const riskAnalysis =
    analyzeRisks(
      validation.data,
      calculation
    );

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        ← Zurück zum Dashboard
      </Link>

      <div className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Phase 1 · Schritt 3
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Risikoanalyse
        </h1>

        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Die Risiko-Engine prüft Finanzierung,
          Liquidität, Eigenkapital, Rendite,
          Sanierungsaufwand und Restschuld.
        </p>
      </div>

      <section
        className={`mt-10 rounded-2xl border p-7 ${
          levelClasses[
            riskAnalysis.overallRiskLevel
          ]
        }`}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide">
              Gesamtrisiko
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {getRiskLabel(
                riskAnalysis.overallRiskLevel
              )}
            </h2>
          </div>

          <div className="rounded-2xl bg-white/70 px-6 py-4 text-center">
            <p className="text-sm font-medium">
              Risikowert
            </p>

            <p className="mt-1 text-3xl font-bold">
              {riskAnalysis.riskScore}/100
            </p>
          </div>
        </div>

        <p className="mt-5 max-w-4xl leading-7">
          {
            riskAnalysis.recommendationSummary
          }
        </p>
      </section>

      <section className="mt-8 space-y-5">
        {riskAnalysis.risks.map(
          (risk) => (
            <article
              key={risk.id}
              className={`rounded-2xl border p-6 ${
                levelClasses[risk.level]
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {risk.title}
                  </h2>

                  <p className="mt-3 leading-7">
                    {risk.description}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                    badgeClasses[
                      risk.level
                    ]
                  }`}
                >
                  {getRiskLabel(
                    risk.level
                  )}
                </span>
              </div>

              {risk.recommendation ? (
                <div className="mt-5 rounded-xl bg-white/70 p-4">
                  <p className="text-sm font-semibold">
                    Empfehlung
                  </p>

                  <p className="mt-1 leading-6">
                    {risk.recommendation}
                  </p>
                </div>
              ) : null}
            </article>
          )
        )}
      </section>

      <section className="mt-10 rounded-2xl bg-slate-950 p-7 text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Aktuelle Basiswerte
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-slate-400">
              Monatsrate
            </p>

            <p className="mt-1 text-xl font-semibold">
              {calculation.financing
                .monthlyLoanRate
                .toLocaleString(
                  "de-DE",
                  {
                    style: "currency",
                    currency: "EUR"
                  }
                )}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-400">
              Schuldendienstquote
            </p>

            <p className="mt-1 text-xl font-semibold">
              {
                calculation.affordability
                  .debtServiceRatioPercent
              } %
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-400">
              Monatliche Liquidität
            </p>

            <p className="mt-1 text-xl font-semibold">
              {calculation.affordability
                .remainingMonthlyLiquidity
                .toLocaleString(
                  "de-DE",
                  {
                    style: "currency",
                    currency: "EUR"
                  }
                )}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-400">
              Restschuld
            </p>

            <p className="mt-1 text-xl font-semibold">
              {calculation.financing
                .remainingDebtAfterFixedPeriod
                .toLocaleString(
                  "de-DE",
                  {
                    style: "currency",
                    currency: "EUR"
                  }
                )}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
