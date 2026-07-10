"use client";

import { useState } from "react";
import { calculateAffordability } from "@/features/quick-check/services/calculate-affordability";
import type { QuickCheckInput } from "@/features/quick-check/types";

const initialValues: QuickCheckInput = {
  householdNetIncome: 5000,
  equity: 30000,
  existingLoanPayments: 0,
  monthlyFixedCosts: 2200,
  purchasePurpose: "owner_occupied"
};

export function QuickCheckForm() {
  const [values, setValues] = useState<QuickCheckInput>(initialValues);
  const [result, setResult] = useState<ReturnType<typeof calculateAffordability> | null>(null);

  function updateNumber(key: keyof QuickCheckInput, value: string) {
    setValues((current) => ({ ...current, [key]: Number(value) }));
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Haushaltsnetto">
          <input
            type="number"
            value={values.householdNetIncome}
            onChange={(e) => updateNumber("householdNetIncome", e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />
        </Field>

        <Field label="Eigenkapital">
          <input
            type="number"
            value={values.equity}
            onChange={(e) => updateNumber("equity", e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />
        </Field>

        <Field label="Bestehende Kreditraten">
          <input
            type="number"
            value={values.existingLoanPayments}
            onChange={(e) => updateNumber("existingLoanPayments", e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />
        </Field>

        <Field label="Monatliche Fixkosten">
          <input
            type="number"
            value={values.monthlyFixedCosts}
            onChange={(e) => updateNumber("monthlyFixedCosts", e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />
        </Field>
      </div>

      <button
        type="button"
        onClick={() => setResult(calculateAffordability(values))}
        className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white"
      >
        Strategie berechnen
      </button>

      {result && (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <ResultCard label="Bankfähig" value={result.bankablePurchasePrice} />
          <ResultCard label="Tragbar" value={result.sustainablePurchasePrice} />
          <ResultCard label="Empfohlen" value={result.recommendedPurchasePrice} />
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function ResultCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-100 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">
        {new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 0
        }).format(value)}
      </p>
    </div>
  );
}
