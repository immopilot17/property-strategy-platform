import type {
  AffordabilityResult,
  AnalysisInput,
  FinancingResult,
  ProfitabilityResult
} from "../domain";

export type PurchaseCostBreakdown = {
  purchasePrice: number;
  realEstateTransferTax: number;
  notaryAndLandRegistry: number;
  brokerCommission: number;
  totalPurchaseCosts: number;

  renovationCosts: number;
  modernizationCosts: number;
  furnishingCosts: number;
  totalProjectCosts: number;

  totalInvestmentCosts: number;
};

export type CalculationResult = {
  purchaseCosts: PurchaseCostBreakdown;
  financing: FinancingResult;
  profitability: ProfitabilityResult;
  affordability: AffordabilityResult;
};

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function safePercentage(
  numerator: number,
  denominator: number
): number {
  if (denominator <= 0) {
    return 0;
  }

  return (numerator / denominator) * 100;
}

export function calculatePurchaseCosts(
  input: AnalysisInput
): PurchaseCostBreakdown {
  const { property } = input;

  const realEstateTransferTax =
    property.purchasePrice *
    (property.realEstateTransferTaxPercent / 100);

  const notaryAndLandRegistry =
    property.purchasePrice *
    (property.notaryAndLandRegistryPercent / 100);

  const brokerCommission =
    property.purchasePrice *
    (property.brokerCommissionPercent / 100);

  const totalPurchaseCosts =
    realEstateTransferTax +
    notaryAndLandRegistry +
    brokerCommission;

  const totalProjectCosts =
    property.renovationCosts +
    property.modernizationCosts +
    property.furnishingCosts;

  const totalInvestmentCosts =
    property.purchasePrice +
    totalPurchaseCosts +
    totalProjectCosts;

  return {
    purchasePrice: roundCurrency(property.purchasePrice),
    realEstateTransferTax:
      roundCurrency(realEstateTransferTax),
    notaryAndLandRegistry:
      roundCurrency(notaryAndLandRegistry),
    brokerCommission:
      roundCurrency(brokerCommission),
    totalPurchaseCosts:
      roundCurrency(totalPurchaseCosts),

    renovationCosts:
      roundCurrency(property.renovationCosts),
    modernizationCosts:
      roundCurrency(property.modernizationCosts),
    furnishingCosts:
      roundCurrency(property.furnishingCosts),
    totalProjectCosts:
      roundCurrency(totalProjectCosts),

    totalInvestmentCosts:
      roundCurrency(totalInvestmentCosts)
  };
}

export function calculateMonthlyLoanRate(
  loanAmount: number,
  annualInterestRatePercent: number,
  initialRepaymentPercent: number
): number {
  if (loanAmount <= 0) {
    return 0;
  }

  const annualRatePercent =
    annualInterestRatePercent +
    initialRepaymentPercent;

  const annualPayment =
    loanAmount * (annualRatePercent / 100);

  return roundCurrency(annualPayment / 12);
}

export function calculateRemainingDebt(
  loanAmount: number,
  annualInterestRatePercent: number,
  monthlyLoanRate: number,
  years: number
): number {
  if (loanAmount <= 0) {
    return 0;
  }

  const numberOfMonths = years * 12;
  const monthlyInterestRate =
    annualInterestRatePercent / 100 / 12;

  if (monthlyInterestRate === 0) {
    return roundCurrency(
      Math.max(
        0,
        loanAmount -
          monthlyLoanRate * numberOfMonths
      )
    );
  }

  const growthFactor =
    Math.pow(
      1 + monthlyInterestRate,
      numberOfMonths
    );

  const remainingDebt =
    loanAmount * growthFactor -
    monthlyLoanRate *
      ((growthFactor - 1) /
        monthlyInterestRate);

  return roundCurrency(
    Math.max(0, remainingDebt)
  );
}

export function calculateFinancing(
  input: AnalysisInput,
  purchaseCosts: PurchaseCostBreakdown
): FinancingResult {
  const { property, financing } = input;

  let financedAmount =
    property.purchasePrice;

  if (financing.includePurchaseCostsInLoan) {
    financedAmount +=
      purchaseCosts.totalPurchaseCosts;
  }

  if (financing.includeRenovationInLoan) {
    financedAmount +=
      purchaseCosts.totalProjectCosts;
  }

  const requiredLoanAmount =
    Math.max(
      0,
      financedAmount -
        financing.equityForPurchase
    );

  const baseMonthlyLoanRate =
    calculateMonthlyLoanRate(
      requiredLoanAmount,
      financing.annualInterestRatePercent,
      financing.initialRepaymentPercent
    );

  const monthlyLoanRate =
    baseMonthlyLoanRate +
    financing.additionalMonthlyPayment;

  const annualLoanRate =
    monthlyLoanRate * 12;

  const remainingDebtAfterFixedPeriod =
    calculateRemainingDebt(
      requiredLoanAmount,
      financing.annualInterestRatePercent,
      monthlyLoanRate,
      financing.fixedInterestYears
    );

  const loanToValuePercent =
    safePercentage(
      requiredLoanAmount,
      property.purchasePrice
    );

  return {
    totalPurchaseCosts:
      roundCurrency(
        purchaseCosts.totalPurchaseCosts
      ),

    totalInvestmentCosts:
      roundCurrency(
        purchaseCosts.totalInvestmentCosts
      ),

    requiredLoanAmount:
      roundCurrency(requiredLoanAmount),

    monthlyLoanRate:
      roundCurrency(monthlyLoanRate),

    annualLoanRate:
      roundCurrency(annualLoanRate),

    remainingDebtAfterFixedPeriod:
      roundCurrency(
        remainingDebtAfterFixedPeriod
      ),

    loanToValuePercent:
      roundPercent(loanToValuePercent)
  };
}

export function calculateProfitability(
  input: AnalysisInput,
  purchaseCosts: PurchaseCostBreakdown,
  financing: FinancingResult
): ProfitabilityResult {
  const { property } = input;

  const annualColdRent =
    property.monthlyColdRent * 12;

  const annualVacancyLoss =
    annualColdRent *
    (property.expectedVacancyPercent / 100);

  const effectiveAnnualRent =
    annualColdRent -
    annualVacancyLoss;

  const annualMaintenanceCosts =
    property.purchasePrice *
    (property.annualMaintenancePercent / 100);

  const annualNonRecoverableCosts =
    property.monthlyNonRecoverableCosts * 12;

  const annualOperatingIncome =
    effectiveAnnualRent -
    annualMaintenanceCosts -
    annualNonRecoverableCosts;

  const grossRentalYieldPercent =
    safePercentage(
      annualColdRent,
      property.purchasePrice
    );

  const netRentalYieldPercent =
    safePercentage(
      annualOperatingIncome,
      purchaseCosts.totalInvestmentCosts
    );

  const annualCashflowBeforeTax =
    annualOperatingIncome -
    financing.annualLoanRate;

  const monthlyCashflowBeforeTax =
    annualCashflowBeforeTax / 12;

  return {
    annualColdRent:
      roundCurrency(annualColdRent),

    grossRentalYieldPercent:
      roundPercent(
        grossRentalYieldPercent
      ),

    netRentalYieldPercent:
      roundPercent(
        netRentalYieldPercent
      ),

    monthlyCashflowBeforeTax:
      roundCurrency(
        monthlyCashflowBeforeTax
      ),

    annualCashflowBeforeTax:
      roundCurrency(
        annualCashflowBeforeTax
      )
  };
}

export function calculateAffordability(
  input: AnalysisInput,
  financing: FinancingResult,
  profitability: ProfitabilityResult
): AffordabilityResult {
  const { user } = input;

  const totalMonthlyIncome =
    user.householdNetIncome +
    user.additionalMonthlyIncome;

  const availableMonthlyIncome =
    totalMonthlyIncome -
    user.monthlyLivingCosts -
    user.existingLoanPayments;

  const rentalContribution =
    input.user.purchaseGoal ===
      "owner_occupation"
      ? 0
      : Math.max(
          0,
          profitability.annualColdRent /
            12 +
            profitability.monthlyCashflowBeforeTax -
            financing.monthlyLoanRate
        );

  const housingCostRatioPercent =
    safePercentage(
      financing.monthlyLoanRate,
      totalMonthlyIncome
    );

  const debtServiceRatioPercent =
    safePercentage(
      financing.monthlyLoanRate +
        user.existingLoanPayments,
      totalMonthlyIncome
    );

  const remainingMonthlyLiquidity =
    availableMonthlyIncome -
    financing.monthlyLoanRate +
    rentalContribution;

  const remainingEquityReserve =
    user.availableEquity -
    input.financing.equityForPurchase;

  return {
    availableMonthlyIncome:
      roundCurrency(
        availableMonthlyIncome
      ),

    housingCostRatioPercent:
      roundPercent(
        housingCostRatioPercent
      ),

    debtServiceRatioPercent:
      roundPercent(
        debtServiceRatioPercent
      ),

    remainingMonthlyLiquidity:
      roundCurrency(
        remainingMonthlyLiquidity
      ),

    remainingEquityReserve:
      roundCurrency(
        remainingEquityReserve
      )
  };
}

export function calculateAnalysis(
  input: AnalysisInput
): CalculationResult {
  const purchaseCosts =
    calculatePurchaseCosts(input);

  const financing =
    calculateFinancing(
      input,
      purchaseCosts
    );

  const profitability =
    calculateProfitability(
      input,
      purchaseCosts,
      financing
    );

  const affordability =
    calculateAffordability(
      input,
      financing,
      profitability
    );

  return {
    purchaseCosts,
    financing,
    profitability,
    affordability
  };
}
