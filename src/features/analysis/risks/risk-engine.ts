import type {
  AnalysisInput,
  CalculationResult,
  RiskIndicator,
  RiskLevel
} from "../domain";

export type RiskAnalysisResult = {
  risks: RiskIndicator[];
  overallRiskLevel: RiskLevel;
  riskScore: number;
  recommendationSummary: string;
};

const weight: Record<RiskLevel, number> = { low: 0, medium: 30, high: 65, critical: 100 };

function add(
  risks: RiskIndicator[],
  condition: boolean,
  risk: RiskIndicator
): void {
  if (condition) risks.push(risk);
}

function overall(risks: RiskIndicator[]): RiskLevel {
  if (risks.some((r) => r.level === "critical")) return "critical";
  const high = risks.filter((r) => r.level === "high").length;
  const medium = risks.filter((r) => r.level === "medium").length;
  if (high >= 2) return "critical";
  if (high >= 1 || medium >= 3) return "high";
  if (medium >= 1) return "medium";
  return "low";
}

export function analyzeRisks(
  input: AnalysisInput,
  calculation: CalculationResult
): RiskAnalysisResult {
  const risks: RiskIndicator[] = [];
  const { financing, affordability, profitability, purchaseCosts } = calculation;
  const remainingDebtRatio = financing.requiredLoanAmount > 0
    ? financing.remainingDebtAfterFixedPeriod / financing.requiredLoanAmount * 100
    : 0;
  const projectRatio = purchaseCosts.totalProjectCosts / input.property.purchasePrice * 100;

  add(risks, financing.monthlyLoanRate > input.user.plannedMonthlyMaximumRate, {
    id: "rate-limit",
    title: "Monatsrate über persönlichem Limit",
    description: `Die Rate liegt bei ${financing.monthlyLoanRate.toFixed(0)} € und damit über dem gesetzten Maximum.`,
    level: "critical",
    affectedField: "financing.monthlyLoanRate",
    recommendation: "Kaufpreis, Eigenkapital oder Finanzierungsstruktur anpassen."
  });

  add(risks, affordability.debtServiceRatioPercent > 50, {
    id: "debt-service-critical",
    title: "Kritisch hohe Schuldendienstquote",
    description: `${affordability.debtServiceRatioPercent.toFixed(1)} % des Einkommens fließen in Kreditraten.`,
    level: "critical",
    recommendation: "Finanzierungsvolumen deutlich reduzieren."
  });

  add(risks, affordability.debtServiceRatioPercent > 40 && affordability.debtServiceRatioPercent <= 50, {
    id: "debt-service-high",
    title: "Hohe Schuldendienstquote",
    description: `${affordability.debtServiceRatioPercent.toFixed(1)} % des Einkommens sind durch Kreditraten gebunden.`,
    level: "high",
    recommendation: "Mit Einkommensrückgang und höherem Anschlusszins gegenrechnen."
  });

  add(risks, affordability.remainingMonthlyLiquidity < 0, {
    id: "negative-liquidity",
    title: "Negative monatliche Liquidität",
    description: "Nach laufenden Ausgaben und Immobilie entsteht ein monatliches Defizit.",
    level: "critical",
    recommendation: "Die aktuelle Konstellation ist nicht tragfähig."
  });

  add(risks, affordability.remainingMonthlyLiquidity >= 0 && affordability.remainingMonthlyLiquidity < 750, {
    id: "low-liquidity",
    title: "Geringer monatlicher Puffer",
    description: `Es verbleiben nur ${affordability.remainingMonthlyLiquidity.toFixed(0)} € monatlich.`,
    level: "high",
    recommendation: "Mehr Sicherheitsabstand einplanen."
  });

  add(risks, affordability.remainingEquityReserve < input.user.desiredRemainingReserve, {
    id: "reserve",
    title: "Reserve unter Zielwert",
    description: `Nach Eigenkapitaleinsatz bleiben ${affordability.remainingEquityReserve.toFixed(0)} € übrig.`,
    level: "high",
    recommendation: "Eigenkapitaleinsatz reduzieren oder Rücklagen erhöhen."
  });

  add(risks, financing.loanToValuePercent > 110, {
    id: "ltv-critical",
    title: "Finanzierung deutlich über Kaufpreis",
    description: `Die Darlehenssumme entspricht ${financing.loanToValuePercent.toFixed(1)} % des Kaufpreises.`,
    level: "critical",
    recommendation: "Nebenkosten und Sanierung stärker aus Eigenkapital decken."
  });

  add(risks, financing.loanToValuePercent > 100 && financing.loanToValuePercent <= 110, {
    id: "ltv-high",
    title: "Finanzierung über 100 %",
    description: `Die Beleihungsquote beträgt ${financing.loanToValuePercent.toFixed(1)} %.`,
    level: "high",
    recommendation: "Mit höheren Zinsaufschlägen und strengeren Bankanforderungen rechnen."
  });

  add(risks, remainingDebtRatio > 80, {
    id: "remaining-debt",
    title: "Hohe Restschuld nach Zinsbindung",
    description: `${remainingDebtRatio.toFixed(1)} % des ursprünglichen Darlehens bleiben bestehen.`,
    level: "high",
    recommendation: "Höhere Tilgung, Sondertilgung oder längere Zinsbindung prüfen."
  });

  const isInvestment = input.user.purchaseGoal !== "owner_occupation";
  add(risks, isInvestment && profitability.monthlyCashflowBeforeTax < -500, {
    id: "cashflow-critical",
    title: "Stark negativer Cashflow",
    description: `Monatlicher Fehlbetrag vor Steuern: ${Math.abs(profitability.monthlyCashflowBeforeTax).toFixed(0)} €.`,
    level: "critical",
    recommendation: "Kaufpreis, Miete und Finanzierung grundlegend neu bewerten."
  });

  add(risks, isInvestment && profitability.monthlyCashflowBeforeTax < 0 && profitability.monthlyCashflowBeforeTax >= -500, {
    id: "cashflow-high",
    title: "Negativer Cashflow",
    description: `Monatlicher Fehlbetrag vor Steuern: ${Math.abs(profitability.monthlyCashflowBeforeTax).toFixed(0)} €.`,
    level: "high",
    recommendation: "Mietannahmen und nicht umlagefähige Kosten prüfen."
  });

  add(risks, isInvestment && profitability.grossRentalYieldPercent < 3.5, {
    id: "yield",
    title: "Schwache Bruttomietrendite",
    description: `Die Bruttomietrendite beträgt ${profitability.grossRentalYieldPercent.toFixed(2)} %.`,
    level: "high",
    recommendation: "Kaufpreis verhandeln oder Alternativobjekt vergleichen."
  });

  add(risks, projectRatio > 30, {
    id: "project-costs",
    title: "Sehr hoher Sanierungsaufwand",
    description: `Projektkosten entsprechen ${projectRatio.toFixed(1)} % des Kaufpreises.`,
    level: "critical",
    recommendation: "Fachplanung, Angebote und Baukostenpuffer vor Kauf einholen."
  });

  add(risks, projectRatio > 15 && projectRatio <= 30, {
    id: "project-costs-high",
    title: "Hoher Sanierungsaufwand",
    description: `Projektkosten entsprechen ${projectRatio.toFixed(1)} % des Kaufpreises.`,
    level: "high",
    recommendation: "Mindestens 15 % Kostenpuffer auf die Baumaßnahmen einplanen."
  });

  add(risks, input.financing.fixedInterestYears < 10, {
    id: "fixed-interest",
    title: "Kurze Zinsbindung",
    description: `Die Zinsbindung beträgt nur ${input.financing.fixedInterestYears} Jahre.`,
    level: "medium",
    recommendation: "Längere Zinsbindung oder höhere Tilgung vergleichen."
  });

  if (risks.length === 0) {
    risks.push({
      id: "no-major-risk",
      title: "Keine wesentlichen rechnerischen Risiken erkannt",
      description: "Die aktuellen Eingaben liegen innerhalb der definierten Schwellen.",
      level: "low",
      recommendation: "Unterlagen, Zustand und Annahmen trotzdem fachlich prüfen."
    });
  }

  const overallRiskLevel = overall(risks);
  const riskScore = Math.round(
    risks.reduce((sum, risk) => sum + weight[risk.level], 0) / risks.length
  );

  const summaries: Record<RiskLevel, string> = {
    low: "Die Konstellation wirkt rechnerisch stabil. Objektunterlagen und Annahmen bleiben vor Kauf zu prüfen.",
    medium: "Das Vorhaben ist grundsätzlich darstellbar, weist aber relevante Punkte mit Optimierungsbedarf auf.",
    high: "Mehrere wesentliche Risiken sprechen für eine Anpassung von Preis, Eigenkapital oder Finanzierung.",
    critical: "Die aktuelle Konstellation ist rechnerisch kritisch und sollte vor einer Kaufentscheidung deutlich verändert werden."
  };

  return { risks, overallRiskLevel, riskScore, recommendationSummary: summaries[overallRiskLevel] };
}
