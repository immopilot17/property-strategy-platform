import type {
  AffordabilityResult,
  AnalysisInput,
  CalculationResult,
  FinancingResult,
  FundingSuggestion,
  ProfitabilityResult,
  PurchaseCostBreakdown,
  TaxEstimate
} from "../domain";

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const roundPercent = roundMoney;
const percent = (part: number, total: number) => total > 0 ? (part / total) * 100 : 0;

export function calculatePurchaseCosts(input: AnalysisInput): PurchaseCostBreakdown {
  const { property } = input;
  const realEstateTransferTax = property.purchasePrice * property.realEstateTransferTaxPercent / 100;
  const notaryAndLandRegistry = property.purchasePrice * property.notaryAndLandRegistryPercent / 100;
  const brokerCommission = property.purchasePrice * property.brokerCommissionPercent / 100;
  const totalPurchaseCosts = realEstateTransferTax + notaryAndLandRegistry + brokerCommission;
  const totalProjectCosts = property.renovationCosts + property.modernizationCosts + property.furnishingCosts;

  return {
    purchasePrice: roundMoney(property.purchasePrice),
    realEstateTransferTax: roundMoney(realEstateTransferTax),
    notaryAndLandRegistry: roundMoney(notaryAndLandRegistry),
    brokerCommission: roundMoney(brokerCommission),
    totalPurchaseCosts: roundMoney(totalPurchaseCosts),
    renovationCosts: roundMoney(property.renovationCosts),
    modernizationCosts: roundMoney(property.modernizationCosts),
    furnishingCosts: roundMoney(property.furnishingCosts),
    totalProjectCosts: roundMoney(totalProjectCosts),
    totalInvestmentCosts: roundMoney(property.purchasePrice + totalPurchaseCosts + totalProjectCosts)
  };
}

export function calculateMonthlyLoanRate(
  loanAmount: number,
  annualInterestRatePercent: number,
  initialRepaymentPercent: number
): number {
  if (loanAmount <= 0) return 0;
  return roundMoney(loanAmount * ((annualInterestRatePercent + initialRepaymentPercent) / 100) / 12);
}

export function calculateRemainingDebt(
  loanAmount: number,
  annualInterestRatePercent: number,
  monthlyLoanRate: number,
  years: number
): number {
  if (loanAmount <= 0) return 0;
  const months = Math.max(0, years * 12);
  const monthlyInterest = annualInterestRatePercent / 100 / 12;

  if (monthlyInterest === 0) {
    return roundMoney(Math.max(0, loanAmount - monthlyLoanRate * months));
  }

  const factor = Math.pow(1 + monthlyInterest, months);
  const remaining = loanAmount * factor - monthlyLoanRate * ((factor - 1) / monthlyInterest);
  return roundMoney(Math.max(0, remaining));
}

export function calculateFinancing(
  input: AnalysisInput,
  costs: PurchaseCostBreakdown
): FinancingResult {
  const { property, financing } = input;

  const cashPurchaseCosts = financing.includePurchaseCostsInLoan ? 0 : costs.totalPurchaseCosts;
  const cashProjectCosts = financing.includeRenovationInLoan ? 0 : costs.totalProjectCosts;
  const cashCostsOutsideLoan = cashPurchaseCosts + cashProjectCosts;

  const financedBase =
    property.purchasePrice +
    (financing.includePurchaseCostsInLoan ? costs.totalPurchaseCosts : 0) +
    (financing.includeRenovationInLoan ? costs.totalProjectCosts : 0);

  const equityAppliedToFinancedAmount = Math.max(
    0,
    financing.equityForPurchase - cashCostsOutsideLoan
  );

  const requiredLoanAmount = Math.max(0, financedBase - equityAppliedToFinancedAmount);
  const monthlySpecialRepayment = roundMoney(requiredLoanAmount * financing.annualSpecialRepaymentPercent / 100 / 12);
  const baseRate = calculateMonthlyLoanRate(
    requiredLoanAmount,
    financing.annualInterestRatePercent,
    financing.initialRepaymentPercent
  );
  const monthlyLoanRate = baseRate + financing.additionalMonthlyPayment + monthlySpecialRepayment;

  const remainingDebtAfterFixedPeriod = calculateRemainingDebt(
    requiredLoanAmount,
    financing.annualInterestRatePercent,
    monthlyLoanRate,
    financing.fixedInterestYears
  );

  const remainingTermYears = Math.max(0, financing.totalTermYears - financing.fixedInterestYears);
  const projectedAnnualInterestRateAfterFixedPeriodPercent = financing.expectedInterestAfterFixedPeriodPercent ?? financing.annualInterestRatePercent;
  const projectedMonthlyLoanRateAfterFixedPeriod = remainingTermYears > 0
    ? calculateMonthlyLoanRate(
        remainingDebtAfterFixedPeriod,
        projectedAnnualInterestRateAfterFixedPeriodPercent,
        financing.initialRepaymentPercent
      )
    : 0;

  return {
    totalPurchaseCosts: costs.totalPurchaseCosts,
    totalInvestmentCosts: costs.totalInvestmentCosts,
    cashCostsOutsideLoan: roundMoney(cashCostsOutsideLoan),
    equityAppliedToFinancedAmount: roundMoney(equityAppliedToFinancedAmount),
    requiredLoanAmount: roundMoney(requiredLoanAmount),
    monthlyLoanRate: roundMoney(monthlyLoanRate),
    monthlySpecialRepayment,
    annualLoanRate: roundMoney(monthlyLoanRate * 12),
    remainingDebtAfterFixedPeriod: roundMoney(remainingDebtAfterFixedPeriod),
    projectedMonthlyLoanRateAfterFixedPeriod: roundMoney(projectedMonthlyLoanRateAfterFixedPeriod),
    projectedAnnualInterestRateAfterFixedPeriodPercent: roundMoney(projectedAnnualInterestRateAfterFixedPeriodPercent),
    loanToValuePercent: roundPercent(percent(requiredLoanAmount, property.purchasePrice))
  };
}

export function calculateProfitability(
  input: AnalysisInput,
  costs: PurchaseCostBreakdown,
  financing: FinancingResult
): ProfitabilityResult {
  const { property } = input;
  const annualColdRent = property.monthlyColdRent * 12;
  const vacancyLoss = annualColdRent * property.expectedVacancyPercent / 100;
  const effectiveAnnualRent = annualColdRent - vacancyLoss;
  const annualMaintenance = property.purchasePrice * property.annualMaintenancePercent / 100;
  const annualNonRecoverableCosts = property.monthlyNonRecoverableCosts * 12;
  const annualOperatingIncome = effectiveAnnualRent - annualMaintenance - annualNonRecoverableCosts;
  const annualCashflowBeforeTax = annualOperatingIncome - financing.annualLoanRate;

  return {
    pricePerSquareMeter: roundMoney(property.purchasePrice / property.livingArea),
    monthlyRentPerSquareMeter: roundMoney(property.monthlyColdRent / property.livingArea),
    annualColdRent: roundMoney(annualColdRent),
    effectiveAnnualRent: roundMoney(effectiveAnnualRent),
    annualOperatingIncome: roundMoney(annualOperatingIncome),
    grossRentalYieldPercent: roundPercent(percent(annualColdRent, property.purchasePrice)),
    netRentalYieldPercent: roundPercent(percent(annualOperatingIncome, costs.totalInvestmentCosts)),
    monthlyCashflowBeforeTax: roundMoney(annualCashflowBeforeTax / 12),
    annualCashflowBeforeTax: roundMoney(annualCashflowBeforeTax)
  };
}

export function calculateAffordability(
  input: AnalysisInput,
  financing: FinancingResult,
  profitability: ProfitabilityResult
): AffordabilityResult {
  const { user, property } = input;
  const includePartner = user.purchaseType === "joint" && Boolean(user.partner);
  const partnerIncome = includePartner ? (user.partner?.monthlyNetIncome ?? 0) + (user.partner?.additionalMonthlyIncome ?? 0) : 0;
  const partnerLoans = includePartner ? user.partner?.existingLoanPayments ?? 0 : 0;
  const partnerEquity = includePartner ? user.partner?.availableEquity ?? 0 : 0;
  const totalMonthlyIncome = user.householdNetIncome + user.additionalMonthlyIncome + partnerIncome;
  const totalExistingLoanPayments = user.existingLoanPayments + partnerLoans;
  const totalAvailableEquity = user.availableEquity + partnerEquity;
  const availableMonthlyIncome =
    totalMonthlyIncome - user.monthlyLivingCosts - totalExistingLoanPayments;

  const isInvestment = user.purchaseGoal !== "owner_occupation";
  const personalMonthlyPropertyBurden = isInvestment
    ? -profitability.monthlyCashflowBeforeTax
    : financing.monthlyLoanRate + property.monthlyHouseMoney;

  const remainingMonthlyLiquidity = isInvestment
    ? availableMonthlyIncome + profitability.monthlyCashflowBeforeTax
    : availableMonthlyIncome - financing.monthlyLoanRate - property.monthlyHouseMoney;

  return {
    totalMonthlyIncome: roundMoney(totalMonthlyIncome),
    totalExistingLoanPayments: roundMoney(totalExistingLoanPayments),
    totalAvailableEquity: roundMoney(totalAvailableEquity),
    availableMonthlyIncome: roundMoney(availableMonthlyIncome),
    housingCostRatioPercent: roundPercent(percent(
      Math.max(0, personalMonthlyPropertyBurden),
      totalMonthlyIncome
    )),
    debtServiceRatioPercent: roundPercent(percent(
      financing.monthlyLoanRate + totalExistingLoanPayments,
      totalMonthlyIncome
    )),
    remainingMonthlyLiquidity: roundMoney(remainingMonthlyLiquidity),
    remainingEquityReserve: roundMoney(totalAvailableEquity - input.financing.equityForPurchase),
    personalMonthlyPropertyBurden: roundMoney(personalMonthlyPropertyBurden)
  };
}

export function calculateTaxEstimate(
  input: AnalysisInput,
  financing: FinancingResult,
  profitability: ProfitabilityResult
): TaxEstimate {
  const enabled =
    input.settings.calculateTaxScenario &&
    input.user.purchaseGoal !== "owner_occupation";
  const assessmentType = input.user.purchaseType === "joint" ? "joint" : "individual";
  const useType = input.user.purchaseGoal;

  if (!enabled) {
    return {
      enabled: false,
      assessmentType,
      useType,
      annualInterestEstimate: 0,
      annualDepreciationEstimate: 0,
      annualAdvertisingCostsEstimate: 0,
      estimatedTaxableRentalResult: 0,
      estimatedAnnualTaxEffect: 0,
      disclaimer: "Für reine Eigennutzung wird keine Vermietungs-Steuerschätzung berechnet."
    };
  }

  const annualInterestEstimate =
    financing.requiredLoanAmount * input.financing.annualInterestRatePercent / 100;
  const depreciableBuildingValue =
    input.property.purchasePrice * input.settings.buildingValueSharePercent / 100;
  const annualDepreciationEstimate =
    depreciableBuildingValue * input.settings.depreciationRatePercent / 100;
  const annualAdvertisingCostsEstimate =
    input.property.monthlyNonRecoverableCosts * 12 +
    input.property.purchasePrice * input.property.annualMaintenancePercent / 100;
  const estimatedTaxableRentalResult =
    profitability.effectiveAnnualRent - annualInterestEstimate - annualDepreciationEstimate - annualAdvertisingCostsEstimate;
  const partnerTaxRate = input.user.purchaseType === "joint"
    ? input.user.partner?.marginalTaxRatePercent ?? input.user.marginalTaxRatePercent
    : input.user.marginalTaxRatePercent;
  const effectiveTaxRate = input.user.purchaseType === "joint"
    ? (input.user.marginalTaxRatePercent + partnerTaxRate) / 2
    : input.user.marginalTaxRatePercent;
  const estimatedAnnualTaxEffect =
    -estimatedTaxableRentalResult * effectiveTaxRate / 100;

  return {
    enabled: true,
    assessmentType,
    useType,
    annualInterestEstimate: roundMoney(annualInterestEstimate),
    annualDepreciationEstimate: roundMoney(annualDepreciationEstimate),
    annualAdvertisingCostsEstimate: roundMoney(annualAdvertisingCostsEstimate),
    estimatedTaxableRentalResult: roundMoney(estimatedTaxableRentalResult),
    estimatedAnnualTaxEffect: roundMoney(estimatedAnnualTaxEffect),
    disclaimer:
      "Vereinfachte Orientierung, keine Steuerberatung. Gebäudeanteil, AfA-Satz, Werbungskosten und persönliche Verhältnisse müssen fachlich geprüft werden."
  };
}

export function createFundingSuggestions(input: AnalysisInput): FundingSuggestion[] {
  if (!input.settings.calculateSubsidyScenario) {
    return [];
  }

  const suggestions: FundingSuggestion[] = [];
  const hasFederalState = Boolean(input.property.address.federalState?.trim());
  const isInvestment = input.user.purchaseGoal === "capital_investment" || input.user.purchaseGoal === "mixed_use";

  function addSuggestion(id: string, title: string, reason: string, status: FundingSuggestion["status"] = "potentially_relevant") {
    suggestions.push({ id, title, reason, status });
  }

  if (input.property.energeticRenovationPlanned) {
    addSuggestion(
      "energy-renovation",
      "Energieeffiziente Renovierung prüfen",
      "Für energetische Modernisierung gibt es häufig zinsgünstige Kredite und Zuschüsse, beispielsweise über KfW oder BAFA.",
      hasFederalState ? "potentially_relevant" : "needs_current_verification"
    );
  }

  if (input.property.projectType === "new_build") {
    addSuggestion(
      "new-build",
      "Förderung für Neubau recherchieren",
      "Neubauprojekte können von speziellen Förderdarlehen und Baukindergeld profitieren.",
      hasFederalState ? "potentially_relevant" : "needs_current_verification"
    );
  }

  if (input.property.firstPurchase) {
    addSuggestion(
      "first-purchase",
      "Erstkäufer-Förderung prüfen",
      "Erstkäufer können in vielen Regionen Zugang zu vergünstigten Konditionen oder zusätzlichen Fördermitteln haben.",
      "potentially_relevant"
    );
  }

  if (isInvestment && input.property.occupancyType === "fully_rented") {
    addSuggestion(
      "investment-subsidy",
      "Investitionsförderung bei Vermietung berücksichtigen",
      "Bei Anlageimmobilien lohnt sich die Prüfung von Förderprogrammen, die energetische Maßnahmen und Mietausfallrisiken entlasten.",
      "potentially_relevant"
    );
  }

  if (input.user.desiredRemainingReserve > input.user.availableEquity * 0.5) {
    addSuggestion(
      "reserve-pressure",
      "Reservebedarf mit Förderkonditionen abgleichen",
      "Ein hoher gewünschter Liquiditätspuffer kann durch günstige Förderdarlehen oder Tilgungszuschüsse unterstützt werden.",
      "needs_current_verification"
    );
  }

  if (!hasFederalState) {
    addSuggestion(
      "state-missing",
      "Bundesland für Förderprüfung ergänzen",
      "Förderprogramme variieren stark nach Bundesland. Ergänze die Angabe, um passende Programme zu finden.",
      "needs_current_verification"
    );
  }

  return suggestions;
}

export function calculateAnalysis(input: AnalysisInput): CalculationResult {
  const purchaseCosts = calculatePurchaseCosts(input);
  const financing = calculateFinancing(input, purchaseCosts);
  const profitability = calculateProfitability(input, purchaseCosts, financing);
  const affordability = calculateAffordability(input, financing, profitability);
  const tax = calculateTaxEstimate(input, financing, profitability);
  const fundingSuggestions = createFundingSuggestions(input);

  return { purchaseCosts, financing, profitability, affordability, tax, fundingSuggestions };
}
