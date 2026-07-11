import Link from "next/link";

import {
  calculateAnalysis
} from "@/features/analysis/calculations";

import {
  defaultAnalysisInput,
  validateAnalysisInput
} from "@/features/analysis/domain";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value) + " %";
}

type ResultRowProps = {
  label: string;
  value: string;
};

function ResultRow({
  label,
  value
}: ResultRowProps) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-slate-100 py-3 last:border-b-0">
      <span className="text-slate-600">
        {label}
      </span>

      <strong className="text-right text-slate-950">
        {value}
      </strong>
    </div>
  );
}

export default function CalculationPage() {
  const validation =
    validateAnalysisInput(
      defaultAnalysisInput
    );

  if (!validation.success) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="text-3xl font-bold">
          Berechnung nicht möglich
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

  const result =
    calculateAnalysis(validation.data);

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
          Phase 1 · Schritt 2
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Berechnungs-Engine
        </h1>

        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Diese Seite verwendet aktuell die zentralen
          Standardwerte aus dem Datenmodell. Im nächsten
          Entwicklungsschritt werden die Werte über ein
          vollständiges Eingabeformular vom Nutzer erfasst.
        </p>
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Kauf und Nebenkosten
          </h2>

          <div className="mt-4">
            <ResultRow
              label="Kaufpreis"
              value={formatCurrency(
                result.purchaseCosts.purchasePrice
              )}
            />

            <ResultRow
              label="Grunderwerbsteuer"
              value={formatCurrency(
                result.purchaseCosts
                  .realEstateTransferTax
              )}
            />

            <ResultRow
              label="Notar und Grundbuch"
              value={formatCurrency(
                result.purchaseCosts
                  .notaryAndLandRegistry
              )}
            />

            <ResultRow
              label="Maklerprovision"
              value={formatCurrency(
                result.purchaseCosts
                  .brokerCommission
              )}
            />

            <ResultRow
              label="Gesamte Kaufnebenkosten"
              value={formatCurrency(
                result.purchaseCosts
                  .totalPurchaseCosts
              )}
            />

            <ResultRow
              label="Gesamtinvestition"
              value={formatCurrency(
                result.purchaseCosts
                  .totalInvestmentCosts
              )}
            />
          </div>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Finanzierung
          </h2>

          <div className="mt-4">
            <ResultRow
              label="Darlehenssumme"
              value={formatCurrency(
                result.financing
                  .requiredLoanAmount
              )}
            />

            <ResultRow
              label="Monatliche Kreditrate"
              value={formatCurrency(
                result.financing
                  .monthlyLoanRate
              )}
            />

            <ResultRow
              label="Jährliche Kreditrate"
              value={formatCurrency(
                result.financing
                  .annualLoanRate
              )}
            />

            <ResultRow
              label="Restschuld nach Zinsbindung"
              value={formatCurrency(
                result.financing
                  .remainingDebtAfterFixedPeriod
              )}
            />

            <ResultRow
              label="Beleihungsquote"
              value={formatPercent(
                result.financing
                  .loanToValuePercent
              )}
            />
          </div>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Rendite und Cashflow
          </h2>

          <div className="mt-4">
            <ResultRow
              label="Jährliche Kaltmiete"
              value={formatCurrency(
                result.profitability
                  .annualColdRent
              )}
            />

            <ResultRow
              label="Bruttomietrendite"
              value={formatPercent(
                result.profitability
                  .grossRentalYieldPercent
              )}
            />

            <ResultRow
              label="Nettomietrendite"
              value={formatPercent(
                result.profitability
                  .netRentalYieldPercent
              )}
            />

            <ResultRow
              label="Monatlicher Cashflow vor Steuer"
              value={formatCurrency(
                result.profitability
                  .monthlyCashflowBeforeTax
              )}
            />

            <ResultRow
              label="Jährlicher Cashflow vor Steuer"
              value={formatCurrency(
                result.profitability
                  .annualCashflowBeforeTax
              )}
            />
          </div>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Tragbarkeit
          </h2>

          <div className="mt-4">
            <ResultRow
              label="Verfügbares Einkommen"
              value={formatCurrency(
                result.affordability
                  .availableMonthlyIncome
              )}
            />

            <ResultRow
              label="Wohnkostenquote"
              value={formatPercent(
                result.affordability
                  .housingCostRatioPercent
              )}
            />

            <ResultRow
              label="Schuldendienstquote"
              value={formatPercent(
                result.affordability
                  .debtServiceRatioPercent
              )}
            />

            <ResultRow
              label="Verbleibende monatliche Liquidität"
              value={formatCurrency(
                result.affordability
                  .remainingMonthlyLiquidity
              )}
            />

            <ResultRow
              label="Verbleibende Eigenkapitalreserve"
              value={formatCurrency(
                result.affordability
                  .remainingEquityReserve
              )}
            />
          </div>
        </article>
      </section>
    </main>
  );
}
