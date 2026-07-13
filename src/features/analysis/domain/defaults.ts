import type {
  AnalysisInput,
  AnalysisSettings,
  FinancingProfile,
  PropertyProfile,
  UserProfile
} from "./types";

export const defaultUserProfile: UserProfile = {
  maritalStatus: "married",
  purchaseType: "joint",
  householdNetIncome: 5300,
  additionalMonthlyIncome: 0,
  monthlyLivingCosts: 2100,
  existingLoanPayments: 292,
  availableEquity: 30000,
  emergencyReserve: 10000,
  numberOfAdults: 2,
  numberOfChildren: 0,
  employmentStatus: "permanent",
  annualGrossIncome: 78000,
  marginalTaxRatePercent: 35,
  partner: {
    monthlyNetIncome: 0,
    additionalMonthlyIncome: 0,
    employmentStatus: "permanent",
    existingLoanPayments: 0,
    availableEquity: 0,
    annualGrossIncome: 0,
    marginalTaxRatePercent: 35
  },
  purchaseGoal: "capital_investment",
  riskPreference: "balanced",
  plannedMonthlyMaximumRate: 2200,
  desiredRemainingReserve: 10000,
  notes: undefined
};

export const defaultPropertyProfile: PropertyProfile = {
  title: "Neue Immobilie",
  sourceUrl: undefined,
  propertyType: "apartment",
  condition: "good",
  occupancyType: "vacant",
  projectType: "existing",
  energeticRenovationPlanned: false,
  firstPurchase: true,
  address: { street: "", houseNumber: "", postalCode: "", city: "", federalState: "" },
  purchasePrice: 300000,
  livingArea: 80,
  landArea: 0,
  numberOfUnits: 1,
  yearBuilt: undefined,
  monthlyColdRent: 1200,
  monthlyNonRecoverableCosts: 120,
  monthlyHouseMoney: 300,
  renovationCosts: 15000,
  modernizationCosts: 0,
  furnishingCosts: 0,
  brokerCommissionPercent: 3.57,
  realEstateTransferTaxPercent: 5,
  notaryAndLandRegistryPercent: 2,
  expectedVacancyPercent: 2,
  annualMaintenancePercent: 1,
  energyClass: undefined,
  notes: undefined
};

export const defaultFinancingProfile: FinancingProfile = {
  equityForPurchase: 20000,
  annualInterestRatePercent: 3.5,
  initialRepaymentPercent: 2,
  fixedInterestYears: 10,
  totalTermYears: 30,
  additionalMonthlyPayment: 0,
  annualSpecialRepaymentPercent: 0,
  includePurchaseCostsInLoan: true,
  includeRenovationInLoan: true,
  expectedInterestAfterFixedPeriodPercent: 4.5,
  desiredMaximumLoanToValuePercent: 100
};

export const defaultAnalysisSettings: AnalysisSettings = {
  projectionYears: 10,
  annualPropertyValueGrowthPercent: 1,
  annualRentGrowthPercent: 1.5,
  annualCostGrowthPercent: 2,
  incomeSafetyReductionPercent: 10,
  buildingValueSharePercent: 80,
  depreciationRatePercent: 2,
  marginalTaxRatePercent: 35,
  calculateTaxScenario: true,
  calculateSubsidyScenario: true
};

export const defaultAnalysisInput: AnalysisInput = {
  user: defaultUserProfile,
  property: defaultPropertyProfile,
  financing: defaultFinancingProfile,
  settings: defaultAnalysisSettings
};
