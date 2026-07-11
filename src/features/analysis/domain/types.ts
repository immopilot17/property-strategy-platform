import type { z } from "zod";

import type {
  riskLevels,
  strategyTypes
} from "./enums";

import type {
  analysisInputSchema,
  analysisSettingsSchema,
  financingProfileSchema,
  propertyAddressSchema,
  propertyProfileSchema,
  userProfileSchema
} from "./schemas";

export type UserProfile =
  z.infer<typeof userProfileSchema>;

export type PropertyAddress =
  z.infer<typeof propertyAddressSchema>;

export type PropertyProfile =
  z.infer<typeof propertyProfileSchema>;

export type FinancingProfile =
  z.infer<typeof financingProfileSchema>;

export type AnalysisSettings =
  z.infer<typeof analysisSettingsSchema>;

export type AnalysisInput =
  z.infer<typeof analysisInputSchema>;

export type StrategyType =
  (typeof strategyTypes)[number];

export type RiskLevel =
  (typeof riskLevels)[number];

export type ValidationError = {
  field: string;
  message: string;
};

export type ValidationResult<T> =
  | {
      success: true;
      data: T;
      errors: [];
    }
  | {
      success: false;
      data: null;
      errors: ValidationError[];
    };

export type AnalysisMetric = {
  label: string;
  value: number;
  unit: "EUR" | "PERCENT" | "YEARS" | "NUMBER";
  explanation?: string;
};

export type RiskIndicator = {
  id: string;
  title: string;
  description: string;
  level: RiskLevel;
  affectedField?: string;
  recommendation?: string;
};

export type StrategyResult = {
  type: StrategyType;
  title: string;
  summary: string;

  recommendedEquity: number;
  estimatedLoanAmount: number;
  estimatedMonthlyRate: number;
  estimatedRemainingReserve: number;

  advantages: string[];
  disadvantages: string[];
  nextSteps: string[];
};

export type FinancingResult = {
  totalPurchaseCosts: number;
  totalInvestmentCosts: number;
  requiredLoanAmount: number;
  monthlyLoanRate: number;
  annualLoanRate: number;
  remainingDebtAfterFixedPeriod: number;
  loanToValuePercent: number;
};

export type ProfitabilityResult = {
  annualColdRent: number;
  grossRentalYieldPercent: number;
  netRentalYieldPercent: number;
  monthlyCashflowBeforeTax: number;
  annualCashflowBeforeTax: number;
};

export type AffordabilityResult = {
  availableMonthlyIncome: number;
  housingCostRatioPercent: number;
  debtServiceRatioPercent: number;
  remainingMonthlyLiquidity: number;
  remainingEquityReserve: number;
};

export type AnalysisResult = {
  analysisId: string;
  calculatedAt: string;

  financing: FinancingResult;
  profitability: ProfitabilityResult;
  affordability: AffordabilityResult;

  risks: RiskIndicator[];
  strategies: StrategyResult[];

  overallRiskLevel: RiskLevel;
  recommendationSummary: string;
};
