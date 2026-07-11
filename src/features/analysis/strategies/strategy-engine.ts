import type { AnalysisInput, StrategyResult, StrategyType } from "../domain";
import { calculateAnalysis } from "../calculations";

type Config = {
  type: StrategyType;
  title: string;
  reserveFloor: number;
  targetEquityShare: number;
  interestDelta: number;
  repaymentDelta: number;
  financeCosts: boolean;
  financeProject: boolean;
};

const configs: Config[] = [
  { type: "safe", title: "Sichere Strategie", reserveFloor: 20000, targetEquityShare: 30, interestDelta: -0.1, repaymentDelta: 0.75, financeCosts: false, financeProject: false },
  { type: "balanced", title: "Ausgewogene Strategie", reserveFloor: 12000, targetEquityShare: 18, interestDelta: 0, repaymentDelta: 0.25, financeCosts: false, financeProject: true },
  { type: "maximum", title: "Maximale Strategie", reserveFloor: 8000, targetEquityShare: 8, interestDelta: 0.45, repaymentDelta: -0.5, financeCosts: true, financeProject: true },
  { type: "alternative", title: "Alternative Strategie", reserveFloor: 15000, targetEquityShare: 20, interestDelta: 0.15, repaymentDelta: 0.5, financeCosts: false, financeProject: false }
];

const eur = (value: number) => value.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function buildInput(input: AnalysisInput, config: Config): AnalysisInput {
  const availableForProject = Math.max(
    0,
    input.user.availableEquity - Math.max(config.reserveFloor, input.user.desiredRemainingReserve)
  );
  const purchaseCosts =
    input.property.purchasePrice *
    (input.property.realEstateTransferTaxPercent +
      input.property.notaryAndLandRegistryPercent +
      input.property.brokerCommissionPercent) / 100;
  const projectCosts =
    input.property.renovationCosts +
    input.property.modernizationCosts +
    input.property.furnishingCosts;
  const targetDownPayment = input.property.purchasePrice * config.targetEquityShare / 100;
  const requiredCashCosts = (config.financeCosts ? 0 : purchaseCosts) + (config.financeProject ? 0 : projectCosts);
  const equity = Math.min(
    input.user.availableEquity,
    Math.max(requiredCashCosts, Math.min(availableForProject, targetDownPayment + requiredCashCosts))
  );

  return {
    ...input,
    financing: {
      ...input.financing,
      equityForPurchase: Math.round(equity * 100) / 100,
      annualInterestRatePercent: Math.max(0.1, input.financing.annualInterestRatePercent + config.interestDelta),
      initialRepaymentPercent: Math.max(1, input.financing.initialRepaymentPercent + config.repaymentDelta),
      includePurchaseCostsInLoan: config.financeCosts,
      includeRenovationInLoan: config.financeProject
    }
  };
}

export function generateStrategies(input: AnalysisInput): StrategyResult[] {
  return configs.map((config) => {
    const scenario = buildInput(input, config);
    const result = calculateAnalysis(scenario);
    const reserve = input.user.availableEquity - scenario.financing.equityForPurchase;
    const values = {
      equity: scenario.financing.equityForPurchase,
      loan: result.financing.requiredLoanAmount,
      rate: result.financing.monthlyLoanRate,
      reserve
    };

    const commonNext = [
      "Finanzierungsangebot mit identischen Annahmen einholen.",
      "Anschlussrate mit höherem Zins simulieren.",
      "Objektunterlagen und Sanierungskosten verifizieren."
    ];

    const texts: Record<StrategyType, {
      summary: string;
      advantages: string[];
      disadvantages: string[];
      nextSteps: string[];
    }> = {
      safe: {
        summary: `Hoher Eigenkapitaleinsatz und höhere Tilgung reduzieren Darlehen und Restschuld. Rate: ${eur(values.rate)}.`,
        advantages: ["Niedrigere Restschuld", "Besserer Schutz vor Zinsanstieg", "Konservativer Sicherheitspuffer"],
        disadvantages: ["Hoher Kapitaleinsatz", "Weniger Liquidität für weitere Vorhaben"],
        nextSteps: ["15 bis 20 Jahre Zinsbindung vergleichen.", "Sondertilgungsrecht vereinbaren.", ...commonNext]
      },
      balanced: {
        summary: `Ausgewogenes Verhältnis zwischen Eigenkapital, Reserve und Monatsrate. Rate: ${eur(values.rate)}.`,
        advantages: ["Reserve bleibt teilweise erhalten", "Moderate Darlehenssumme", "Flexibler als die sichere Variante"],
        disadvantages: ["Mittlere Restschuld", "Sanierung kann Darlehen erhöhen"],
        nextSteps: ["Varianten mit und ohne Sanierungsfinanzierung vergleichen.", ...commonNext]
      },
      maximum: {
        summary: `Niedriger Eigenkapitaleinsatz maximiert den Kaufrahmen, erhöht aber Kosten und Risiko. Rate: ${eur(values.rate)}.`,
        advantages: ["Hohe Liquiditätsreserve", "Höherer Kaufrahmen", "Nebenkosten können mitfinanziert werden"],
        disadvantages: ["Hohe Beleihung", "Höhere Zinskosten", "Hohes Anschlussfinanzierungsrisiko"],
        nextSteps: ["Bankfähigkeit einer Finanzierung über 100 % prüfen.", "Kaufpreis konsequent verhandeln.", ...commonNext]
      },
      alternative: {
        summary: `Moderates Eigenkapital und höhere Tilgung, kombiniert mit Preisverhandlung oder günstigerem Vergleichsobjekt.`,
        advantages: ["Reduziertes Gesamtrisiko", "Gute Tilgungswirkung", "Reserve bleibt bestehen"],
        disadvantages: ["Nebenkosten benötigen Eigenkapital", "Erfordert häufig Preisnachlass oder Alternativobjekt"],
        nextSteps: ["Zielkaufpreis mindestens 5 % unter Angebot simulieren.", "Fördermöglichkeiten vor Beauftragung prüfen.", ...commonNext]
      }
    };

    return {
      type: config.type,
      title: config.title,
      summary: texts[config.type].summary,
      recommendedEquity: Math.round(values.equity * 100) / 100,
      estimatedLoanAmount: Math.round(values.loan * 100) / 100,
      estimatedMonthlyRate: Math.round(values.rate * 100) / 100,
      estimatedRemainingReserve: Math.round(values.reserve * 100) / 100,
      advantages: texts[config.type].advantages,
      disadvantages: texts[config.type].disadvantages,
      nextSteps: texts[config.type].nextSteps
    };
  });
}

export function getRecommendedStrategyType(input: AnalysisInput): StrategyType {
  if (input.user.riskPreference === "conservative") return "safe";
  if (input.user.riskPreference === "growth") return "maximum";
  return "balanced";
}
