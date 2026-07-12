import type { z } from "zod";
import type { riskLevels, strategyTypes } from "./enums";
import type {
  analysisInputSchema,
  analysisSettingsSchema,
  financingProfileSchema,
  propertyAddressSchema,
  propertyProfileSchema,
  userProfileSchema
} from "./schemas";
import type { AnalysisAgentFinding, SupervisorResult } from "@/modules/agents/agent-types";

export type UserProfile = z.infer<typeof userProfileSchema>;
export type PropertyAddress = z.infer<typeof propertyAddressSchema>;
export type PropertyProfile = z.infer<typeof propertyProfileSchema>;
export type FinancingProfile = z.infer<typeof financingProfileSchema>;
export type AnalysisSettings = z.infer<typeof analysisSettingsSchema>;
export type AnalysisInput = z.infer<typeof analysisInputSchema>;
export type StrategyType = (typeof strategyTypes)[number];
export type RiskLevel = (typeof riskLevels)[number];

export type ValidationError = { field: string; message: string };
export type ValidationResult<T> =
  | { success: true; data: T; errors: [] }
  | { success: false; data: null; errors: ValidationError[] };

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

export type FinancingResult = {
  totalPurchaseCosts: number;
  totalInvestmentCosts: number;
  cashCostsOutsideLoan: number;
  equityAppliedToFinancedAmount: number;
  requiredLoanAmount: number;
  monthlyLoanRate: number;
  annualLoanRate: number;
  remainingDebtAfterFixedPeriod: number;
  loanToValuePercent: number;
};

export type ProfitabilityResult = {
  pricePerSquareMeter: number;
  monthlyRentPerSquareMeter: number;
  annualColdRent: number;
  effectiveAnnualRent: number;
  annualOperatingIncome: number;
  grossRentalYieldPercent: number;
  netRentalYieldPercent: number;
  monthlyCashflowBeforeTax: number;
  annualCashflowBeforeTax: number;
};

export type AffordabilityResult = {
  totalMonthlyIncome: number;
  totalExistingLoanPayments: number;
  totalAvailableEquity: number;
  availableMonthlyIncome: number;
  housingCostRatioPercent: number;
  debtServiceRatioPercent: number;
  remainingMonthlyLiquidity: number;
  remainingEquityReserve: number;
  personalMonthlyPropertyBurden: number;
};

export type TaxEstimate = {
  enabled: boolean;
  assessmentType: "individual" | "joint";
  useType: "owner_occupation" | "capital_investment" | "mixed_use";
  annualInterestEstimate: number;
  annualDepreciationEstimate: number;
  annualAdvertisingCostsEstimate: number;
  estimatedTaxableRentalResult: number;
  estimatedAnnualTaxEffect: number;
  disclaimer: string;
};

export type FundingSuggestion = {
  id: string;
  title: string;
  reason: string;
  status: "potentially_relevant" | "needs_current_verification";
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

export type CalculationResult = {
  purchaseCosts: PurchaseCostBreakdown;
  financing: FinancingResult;
  profitability: ProfitabilityResult;
  affordability: AffordabilityResult;
  tax: TaxEstimate;
  fundingSuggestions: FundingSuggestion[];
};

export type FullAnalysisResult = CalculationResult & {
  analysisId: string;
  calculatedAt: string;
  risks: RiskIndicator[];
  overallRiskLevel: RiskLevel;
  riskScore: number;
  recommendationSummary: string;
  strategies: StrategyResult[];
  recommendedStrategyType: StrategyType;
  assumptions: string[];
  agentFindings: AnalysisAgentFinding[];
  supervisor: SupervisorResult;
};
