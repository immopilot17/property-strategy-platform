import Link from "next/link";

import {
  defaultAnalysisInput,
  validateAnalysisInput
} from "@/features/analysis/domain";

import {
  generateStrategies,
  getRecommendedStrategy
} from "@/features/analysis/strategies";

import type {
  StrategyType
} from "@/features/analysis/domain";

const strategyStyles: Record<
  StrategyType,
  string
> = {
  safe:
    "border-emerald-200 bg-emerald-50",
  balanced:
    "border-blue-200 bg-blue-50",
  maximum:
    "border-orange-200 bg-orange-50",
  alternative:
    "border-violet-200 bg-violet-50"
};

const strategyBadges: Record<
  StrategyType,
  string
> = {
  safe:
    "bg-emerald-200 text-emerald-900",
  balanced:
    "bg-blue-200 text-blue-900",
  maximum:
    "bg-orange-200 text-orange-900",
  alternative:
    "bg-violet-200 text-violet-900"
};

const strategyLabels: Record<
  StrategyType,
  string
> = {
  safe: "Sicher",
  balanced: "Ausgewogen",
  maximum: "Maximal",
  alternative: "Alternativ"
};

function formatCurrency(
  value: number
): string {
  return new Intl.NumberFormat(
    "de-DE",
    {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2
    }
  ).format(value);
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({
  label,
  value
}: MetricProps) {
  return (
    <div className="rounded-xl bg-white/80 p-4">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}

export default function StrategiesPage() {
  const validation =
    validateAnalysisInput(
      defaultAnalysisInput
    );

  if (!validation.success) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="text-3xl font-bold">
          Strategien können nicht erzeugt werden
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

  const strategies =
    generateStrategies(
      validation.data
    );

  const recommendedStrategy =
    getRecommendedStrategy(
      validation.data,
      strategies
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
          Phase 1 · Schritt 4
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Immobilienstrategien
        </h1>

        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Die Strategie-Engine erzeugt mehrere
          Finanzierungswege, statt nur eine
          einzelne Kaufempfehlung auszugeben.
        </p>
      </div>

      <section className="mt-10 rounded-2xl bg-slate-950 p-7 text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Bevorzugte Strategie auf Basis des Risikoprofils
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {recommendedStrategy.title}
        </h2>

        <p className="mt-4 max-w-4xl leading-7 text-slate-300">
          {recommendedStrategy.summary}
        </p>
      </section>

      <section className="mt-8 space-y-7">
        {strategies.map(
          (strategy) => (
            <article
              key={strategy.type}
              className={`rounded-2xl border p-6 ${
                strategyStyles[
                  strategy.type
                ]
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    {strategy.title}
                  </h2>

                  <p className="mt-3 max-w-4xl leading-7 text-slate-700">
                    {strategy.summary}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                    strategyBadges[
                      strategy.type
                    ]
                  }`}
                >
                  {
                    strategyLabels[
                      strategy.type
                    ]
                  }
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label="Empfohlenes Eigenkapital"
                  value={formatCurrency(
                    strategy.recommendedEquity
                  )}
                />

                <Metric
                  label="Geschätztes Darlehen"
                  value={formatCurrency(
                    strategy.estimatedLoanAmount
                  )}
                />

                <Metric
                  label="Geschätzte Monatsrate"
                  value={formatCurrency(
                    strategy.estimatedMonthlyRate
                  )}
                />

                <Metric
                  label="Verbleibende Reserve"
                  value={formatCurrency(
                    strategy.estimatedRemainingReserve
                  )}
                />
              </div>

              <div className="mt-7 grid gap-6 lg:grid-cols-3">
                <section className="rounded-xl bg-white/80 p-5">
                  <h3 className="font-semibold text-slate-950">
                    Vorteile
                  </h3>

                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                    {strategy.advantages.map(
                      (advantage) => (
                        <li
                          key={advantage}
                          className="flex gap-2"
                        >
                          <span aria-hidden="true">
                            +
                          </span>

                          <span>
                            {advantage}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </section>

                <section className="rounded-xl bg-white/80 p-5">
                  <h3 className="font-semibold text-slate-950">
                    Nachteile
                  </h3>

                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                    {strategy.disadvantages.map(
                      (disadvantage) => (
                        <li
                          key={disadvantage}
                          className="flex gap-2"
                        >
                          <span aria-hidden="true">
                            −
                          </span>

                          <span>
                            {disadvantage}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </section>

                <section className="rounded-xl bg-white/80 p-5">
                  <h3 className="font-semibold text-slate-950">
                    Nächste Schritte
                  </h3>

                  <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                    {strategy.nextSteps.map(
                      (step, index) => (
                        <li
                          key={step}
                          className="flex gap-3"
                        >
                          <span className="font-semibold">
                            {index + 1}.
                          </span>

                          <span>
                            {step}
                          </span>
                        </li>
                      )
                    )}
                  </ol>
                </section>
              </div>
            </article>
          )
        )}
      </section>
    </main>
  );
}
