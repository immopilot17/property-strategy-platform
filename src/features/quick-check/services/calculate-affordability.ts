import type { QuickCheckInput } from "../types";

export type AffordabilityResult = {
  availableMonthlyBudget: number;
  bankablePurchasePrice: number;
  sustainablePurchasePrice: number;
  recommendedPurchasePrice: number;
  reserveAfterPurchase: number;
};

export function calculateAffordability(input: QuickCheckInput): AffordabilityResult {
  const disposableIncome =
    input.householdNetIncome -
    input.monthlyFixedCosts -
    input.existingLoanPayments;

  const bankableRate = Math.max(disposableIncome * 0.75, 0);
  const sustainableRate = Math.max(disposableIncome * 0.58, 0);
  const recommendedRate = Math.max(disposableIncome * 0.48, 0);

  const annualDebtServiceFactor = 12 / 0.06;
  const usableEquity = Math.max(input.equity - 15000, 0);

  return {
    availableMonthlyBudget: recommendedRate,
    bankablePurchasePrice: Math.round(bankableRate * annualDebtServiceFactor + usableEquity),
    sustainablePurchasePrice: Math.round(sustainableRate * annualDebtServiceFactor + usableEquity),
    recommendedPurchasePrice: Math.round(recommendedRate * annualDebtServiceFactor + usableEquity),
    reserveAfterPurchase: Math.min(input.equity, 15000)
  };
}
