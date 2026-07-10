export type PurchasePurpose = "owner_occupied" | "investment";

export type QuickCheckInput = {
  householdNetIncome: number;
  equity: number;
  existingLoanPayments: number;
  monthlyFixedCosts: number;
  purchasePurpose: PurchasePurpose;
};
