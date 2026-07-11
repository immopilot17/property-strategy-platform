import type {
  AnalysisInput,
  RiskIndicator,
  RiskLevel
} from "../domain";

import type {
  CalculationResult
} from "../calculations";

export type RiskAnalysisResult = {
  risks: RiskIndicator[];
  overallRiskLevel: RiskLevel;
  riskScore: number;
  recommendationSummary: string;
};

const riskWeights: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3
};

const riskLabels: Record<RiskLevel, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch"
};

function createRisk(
  risk: RiskIndicator
): RiskIndicator {
  return risk;
}

function calculateRemainingDebtRatio(
  remainingDebt: number,
  originalLoanAmount: number
): number {
  if (originalLoanAmount <= 0) {
    return 0;
  }

  return (
    remainingDebt /
    originalLoanAmount
  ) * 100;
}

function calculateRenovationRatio(
  renovationCosts: number,
  purchasePrice: number
): number {
  if (purchasePrice <= 0) {
    return 0;
  }

  return (
    renovationCosts /
    purchasePrice
  ) * 100;
}

function determineOverallRiskLevel(
  risks: RiskIndicator[]
): RiskLevel {
  if (
    risks.some(
      (risk) => risk.level === "critical"
    )
  ) {
    return "critical";
  }

  const highRisks = risks.filter(
    (risk) => risk.level === "high"
  ).length;

  if (highRisks >= 2) {
    return "critical";
  }

  if (highRisks === 1) {
    return "high";
  }

  const mediumRisks = risks.filter(
    (risk) => risk.level === "medium"
  ).length;

  if (mediumRisks >= 3) {
    return "high";
  }

  if (mediumRisks >= 1) {
    return "medium";
  }

  return "low";
}

function calculateRiskScore(
  risks: RiskIndicator[]
): number {
  if (risks.length === 0) {
    return 0;
  }

  const totalWeight = risks.reduce(
    (sum, risk) =>
      sum + riskWeights[risk.level],
    0
  );

  const maximumWeight =
    risks.length *
    riskWeights.critical;

  if (maximumWeight === 0) {
    return 0;
  }

  return Math.round(
    (totalWeight / maximumWeight) * 100
  );
}

function createRecommendationSummary(
  level: RiskLevel
): string {
  switch (level) {
    case "critical":
      return "Die aktuelle Konstellation ist finanziell kritisch. Vor einem Kauf sollten Kaufpreis, Eigenkapital, Finanzierung oder Objektwahl deutlich angepasst werden.";

    case "high":
      return "Die Analyse zeigt mehrere wesentliche Risiken. Ein Kauf sollte nur nach einer konkreten Anpassung der Finanzierung und einer zusätzlichen Sicherheitsprüfung erfolgen.";

    case "medium":
      return "Die Immobilie kann grundsätzlich tragbar sein, enthält aber relevante Risiken. Sicherheitsreserve, Finanzierung und Objektkosten sollten vor einer Entscheidung optimiert werden.";

    case "low":
      return "Die aktuelle Konstellation wirkt auf Basis der eingegebenen Daten grundsätzlich stabil. Einzelne Annahmen sollten trotzdem vor dem Kauf geprüft werden.";
  }
}

export function analyzeRisks(
  input: AnalysisInput,
  calculation: CalculationResult
): RiskAnalysisResult {
  const risks: RiskIndicator[] = [];

  const {
    user,
    property,
    financing
  } = input;

  const {
    affordability,
    profitability
  } = calculation;

  const remainingDebtRatio =
    calculateRemainingDebtRatio(
      calculation.financing
        .remainingDebtAfterFixedPeriod,
      calculation.financing
        .requiredLoanAmount
    );

  const totalRenovationCosts =
    property.renovationCosts +
    property.modernizationCosts +
    property.furnishingCosts;

  const renovationRatio =
    calculateRenovationRatio(
      totalRenovationCosts,
      property.purchasePrice
    );

  if (
    calculation.financing.monthlyLoanRate >
    user.plannedMonthlyMaximumRate
  ) {
    risks.push(
      createRisk({
        id: "monthly-rate-above-limit",
        title: "Monatsrate über dem geplanten Maximum",
        description:
          `Die berechnete Kreditrate liegt über der selbst festgelegten maximalen Monatsrate von ${user.plannedMonthlyMaximumRate.toFixed(2)} Euro.`,
        level: "critical",
        affectedField:
          "financing.monthlyLoanRate",
        recommendation:
          "Kaufpreis reduzieren, mehr Eigenkapital einsetzen oder Finanzierung neu strukturieren."
      })
    );
  } else if (
    calculation.financing.monthlyLoanRate >
    user.plannedMonthlyMaximumRate * 0.9
  ) {
    risks.push(
      createRisk({
        id: "monthly-rate-near-limit",
        title: "Monatsrate nahe am persönlichen Limit",
        description:
          "Die Kreditrate nutzt mehr als 90 Prozent des selbst festgelegten maximalen Finanzierungsrahmens.",
        level: "high",
        affectedField:
          "financing.monthlyLoanRate",
        recommendation:
          "Zusätzlichen monatlichen Puffer einplanen und Finanzierung mit höheren Zinsen testen."
      })
    );
  }

  if (
    affordability.debtServiceRatioPercent >
    50
  ) {
    risks.push(
      createRisk({
        id: "critical-debt-service-ratio",
        title: "Kritisch hohe Schuldendienstquote",
        description:
          `Kreditrate und bestehende Verpflichtungen beanspruchen ${affordability.debtServiceRatioPercent.toFixed(2)} Prozent des monatlichen Einkommens.`,
        level: "critical",
        affectedField:
          "affordability.debtServiceRatioPercent",
        recommendation:
          "Darlehenssumme reduzieren oder Kaufentscheidung zurückstellen."
      })
    );
  } else if (
    affordability.debtServiceRatioPercent >
    40
  ) {
    risks.push(
      createRisk({
        id: "high-debt-service-ratio",
        title: "Hohe Schuldendienstquote",
        description:
          `Die monatlichen Kreditverpflichtungen beanspruchen ${affordability.debtServiceRatioPercent.toFixed(2)} Prozent des Einkommens.`,
        level: "high",
        affectedField:
          "affordability.debtServiceRatioPercent",
        recommendation:
          "Die Finanzierung sollte mit konservativeren Einkommens- und Zinsannahmen geprüft werden."
      })
    );
  } else if (
    affordability.debtServiceRatioPercent >
    30
  ) {
    risks.push(
      createRisk({
        id: "medium-debt-service-ratio",
        title: "Erhöhte Schuldendienstquote",
        description:
          `Die monatlichen Kreditverpflichtungen liegen bei ${affordability.debtServiceRatioPercent.toFixed(2)} Prozent des Einkommens.`,
        level: "medium",
        affectedField:
          "affordability.debtServiceRatioPercent",
        recommendation:
          "Ausreichende Liquiditätsreserve und stabile Einkommenssituation sicherstellen."
      })
    );
  }

  if (
    affordability.remainingMonthlyLiquidity <
    0
  ) {
    risks.push(
      createRisk({
        id: "negative-monthly-liquidity",
        title: "Negative monatliche Liquidität",
        description:
          "Nach Lebenshaltungskosten, bestehenden Krediten und Immobilienfinanzierung verbleibt kein ausreichender monatlicher Überschuss.",
        level: "critical",
        affectedField:
          "affordability.remainingMonthlyLiquidity",
        recommendation:
          "Objekt oder Finanzierung ist in der aktuellen Form nicht tragbar."
      })
    );
  } else if (
    affordability.remainingMonthlyLiquidity <
    500
  ) {
    risks.push(
      createRisk({
        id: "low-monthly-liquidity",
        title: "Sehr geringer monatlicher Puffer",
        description:
          `Nach allen berücksichtigten Kosten verbleiben nur ${affordability.remainingMonthlyLiquidity.toFixed(2)} Euro pro Monat.`,
        level: "high",
        affectedField:
          "affordability.remainingMonthlyLiquidity",
        recommendation:
          "Mindestens mehrere hundert Euro zusätzlichen monatlichen Sicherheitspuffer vorsehen."
      })
    );
  } else if (
    affordability.remainingMonthlyLiquidity <
    1000
  ) {
    risks.push(
      createRisk({
        id: "limited-monthly-liquidity",
        title: "Begrenzter monatlicher Puffer",
        description:
          `Der verbleibende monatliche Überschuss beträgt ${affordability.remainingMonthlyLiquidity.toFixed(2)} Euro.`,
        level: "medium",
        affectedField:
          "affordability.remainingMonthlyLiquidity",
        recommendation:
          "Unvorhergesehene Ausgaben und mögliche Einkommensausfälle zusätzlich simulieren."
      })
    );
  }

  if (
    affordability.remainingEquityReserve <
    0
  ) {
    risks.push(
      createRisk({
        id: "negative-equity-reserve",
        title: "Eigenkapital wird überschritten",
        description:
          "Das geplante Eigenkapital für den Kauf übersteigt das verfügbare Eigenkapital.",
        level: "critical",
        affectedField:
          "affordability.remainingEquityReserve",
        recommendation:
          "Eigenkapitaleinsatz korrigieren oder zusätzliches Kapital aufbauen."
      })
    );
  } else if (
    affordability.remainingEquityReserve <
    user.desiredRemainingReserve
  ) {
    risks.push(
      createRisk({
        id: "reserve-below-target",
        title: "Sicherheitsreserve unter Zielwert",
        description:
          `Nach dem Kauf verbleiben ${affordability.remainingEquityReserve.toFixed(2)} Euro. Gewünscht sind mindestens ${user.desiredRemainingReserve.toFixed(2)} Euro.`,
        level: "high",
        affectedField:
          "affordability.remainingEquityReserve",
        recommendation:
          "Weniger Eigenkapital einsetzen oder vor dem Kauf weitere Rücklagen bilden."
      })
    );
  } else if (
    affordability.remainingEquityReserve <
    user.emergencyReserve
  ) {
    risks.push(
      createRisk({
        id: "reserve-below-emergency-level",
        title: "Reserve unter der vorgesehenen Notfallreserve",
        description:
          "Die verbleibende Eigenkapitalreserve liegt unter der angegebenen Notfallreserve.",
        level: "medium",
        affectedField:
          "affordability.remainingEquityReserve",
        recommendation:
          "Notfallreserve nicht vollständig für den Immobilienkauf verwenden."
      })
    );
  }

  if (
    calculation.financing.loanToValuePercent >
    110
  ) {
    risks.push(
      createRisk({
        id: "critical-loan-to-value",
        title: "Finanzierung deutlich über dem Kaufpreis",
        description:
          `Die Darlehenssumme entspricht ${calculation.financing.loanToValuePercent.toFixed(2)} Prozent des Kaufpreises.`,
        level: "critical",
        affectedField:
          "financing.loanToValuePercent",
        recommendation:
          "Kaufnebenkosten und Sanierung möglichst durch Eigenkapital finanzieren."
      })
    );
  } else if (
    calculation.financing.loanToValuePercent >
    100
  ) {
    risks.push(
      createRisk({
        id: "loan-to-value-above-100",
        title: "Finanzierung über 100 Prozent",
        description:
          `Die Beleihungsquote beträgt ${calculation.financing.loanToValuePercent.toFixed(2)} Prozent.`,
        level: "high",
        affectedField:
          "financing.loanToValuePercent",
        recommendation:
          "Mit höheren Finanzierungskosten und strengeren Bankanforderungen rechnen."
      })
    );
  } else if (
    calculation.financing.loanToValuePercent >
    90
  ) {
    risks.push(
      createRisk({
        id: "high-loan-to-value",
        title: "Hohe Beleihungsquote",
        description:
          `Die Beleihungsquote liegt bei ${calculation.financing.loanToValuePercent.toFixed(2)} Prozent.`,
        level: "medium",
        affectedField:
          "financing.loanToValuePercent",
        recommendation:
          "Mehr Eigenkapital kann Zinskonditionen und Risikopuffer verbessern."
      })
    );
  }

  if (
    remainingDebtRatio > 85
  ) {
    risks.push(
      createRisk({
        id: "critical-remaining-debt",
        title: "Sehr hohe Restschuld nach Zinsbindung",
        description:
          `Nach Ablauf der Zinsbindung bestehen noch ${remainingDebtRatio.toFixed(2)} Prozent der ursprünglichen Darlehenssumme.`,
        level: "high",
        affectedField:
          "financing.remainingDebtAfterFixedPeriod",
        recommendation:
          "Höhere Tilgung, längere Zinsbindung oder regelmäßige Sondertilgungen prüfen."
      })
    );
  } else if (
    remainingDebtRatio > 70
  ) {
    risks.push(
      createRisk({
        id: "high-remaining-debt",
        title: "Hohe Restschuld nach Zinsbindung",
        description:
          `Nach der Zinsbindung verbleiben noch ${remainingDebtRatio.toFixed(2)} Prozent der ursprünglichen Darlehenssumme.`,
        level: "medium",
        affectedField:
          "financing.remainingDebtAfterFixedPeriod",
        recommendation:
          "Anschlussfinanzierung mit höherem Zinssatz simulieren."
      })
    );
  }

  if (
    input.user.purchaseGoal !==
      "owner_occupation"
  ) {
    if (
      profitability.monthlyCashflowBeforeTax <
      -500
    ) {
      risks.push(
        createRisk({
          id: "critical-negative-cashflow",
          title: "Stark negativer Cashflow",
          description:
            `Die Immobilie verursacht vor Steuern einen monatlichen Fehlbetrag von ${Math.abs(profitability.monthlyCashflowBeforeTax).toFixed(2)} Euro.`,
          level: "critical",
          affectedField:
            "profitability.monthlyCashflowBeforeTax",
          recommendation:
            "Kaufpreis, Miete, Eigenkapital und Finanzierung grundlegend neu bewerten."
        })
      );
    } else if (
      profitability.monthlyCashflowBeforeTax <
      0
    ) {
      risks.push(
        createRisk({
          id: "negative-cashflow",
          title: "Negativer Cashflow",
          description:
            `Die Immobilie verursacht vor Steuern einen monatlichen Fehlbetrag von ${Math.abs(profitability.monthlyCashflowBeforeTax).toFixed(2)} Euro.`,
          level: "high",
          affectedField:
            "profitability.monthlyCashflowBeforeTax",
          recommendation:
            "Mietpotenzial und sämtliche nicht umlagefähigen Kosten realistisch überprüfen."
        })
      );
    }

    if (
      profitability.grossRentalYieldPercent <
      3
    ) {
      risks.push(
        createRisk({
          id: "weak-gross-rental-yield",
          title: "Schwache Bruttomietrendite",
          description:
            `Die Bruttomietrendite beträgt nur ${profitability.grossRentalYieldPercent.toFixed(2)} Prozent.`,
          level: "high",
          affectedField:
            "profitability.grossRentalYieldPercent",
          recommendation:
            "Kaufpreis verhandeln oder renditestärkeres Objekt prüfen."
        })
      );
    } else if (
      profitability.grossRentalYieldPercent <
      4
    ) {
      risks.push(
        createRisk({
          id: "limited-gross-rental-yield",
          title: "Begrenzte Bruttomietrendite",
          description:
            `Die Bruttomietrendite beträgt ${profitability.grossRentalYieldPercent.toFixed(2)} Prozent.`,
          level: "medium",
          affectedField:
            "profitability.grossRentalYieldPercent",
          recommendation:
            "Nettorendite und langfristige Wertentwicklung besonders kritisch prüfen."
        })
      );
    }
  }

  if (renovationRatio > 30) {
    risks.push(
      createRisk({
        id: "critical-renovation-ratio",
        title: "Sehr hoher Sanierungsaufwand",
        description:
          `Sanierung, Modernisierung und Ausstattung entsprechen ${renovationRatio.toFixed(2)} Prozent des Kaufpreises.`,
        level: "critical",
        affectedField:
          "property.renovationCosts",
        recommendation:
          "Detaillierte Kostenschätzung und ausreichenden Baukostenpuffer einplanen."
      })
    );
  } else if (renovationRatio > 15) {
    risks.push(
      createRisk({
        id: "high-renovation-ratio",
        title: "Hoher Sanierungsaufwand",
        description:
          `Die geplanten Projektkosten entsprechen ${renovationRatio.toFixed(2)} Prozent des Kaufpreises.`,
        level: "high",
        affectedField:
          "property.renovationCosts",
        recommendation:
          "Mindestens zehn bis zwanzig Prozent Kostenreserve auf die Sanierung einplanen."
      })
    );
  } else if (renovationRatio > 8) {
    risks.push(
      createRisk({
        id: "medium-renovation-ratio",
        title: "Relevanter Sanierungsaufwand",
        description:
          `Die geplanten Projektkosten entsprechen ${renovationRatio.toFixed(2)} Prozent des Kaufpreises.`,
        level: "medium",
        affectedField:
          "property.renovationCosts",
        recommendation:
          "Handwerkerangebote und technische Prüfung vor Vertragsabschluss einholen."
      })
    );
  }

  if (
    financing.fixedInterestYears < 10
  ) {
    risks.push(
      createRisk({
        id: "short-fixed-interest-period",
        title: "Kurze Zinsbindung",
        description:
          `Die Zinsbindung beträgt nur ${financing.fixedInterestYears} Jahre.`,
        level: "medium",
        affectedField:
          "financing.fixedInterestYears",
        recommendation:
          "Längere Zinsbindung oder höhere Tilgung zur Reduzierung des Anschlussfinanzierungsrisikos prüfen."
      })
    );
  }

  if (
    financing.expectedInterestAfterFixedPeriodPercent &&
    financing.expectedInterestAfterFixedPeriodPercent >
      financing.annualInterestRatePercent + 2
  ) {
    risks.push(
      createRisk({
        id: "interest-rate-shock",
        title: "Erhöhtes Anschlusszinsrisiko",
        description:
          "Der erwartete Zinssatz nach der Zinsbindung liegt deutlich über dem aktuellen Zinssatz.",
        level: "high",
        affectedField:
          "financing.expectedInterestAfterFixedPeriodPercent",
        recommendation:
          "Anschlussrate mit dem höheren Zinssatz vollständig berechnen."
      })
    );
  }

  if (risks.length === 0) {
    risks.push(
      createRisk({
        id: "no-major-risks",
        title: "Keine wesentlichen Risiken erkannt",
        description:
          "Auf Basis der aktuellen Eingabedaten wurden keine erhöhten Risikofaktoren erkannt.",
        level: "low",
        recommendation:
          "Trotzdem Dokumente, Zustand, Finanzierung und Annahmen fachlich prüfen lassen."
      })
    );
  }

  const overallRiskLevel =
    determineOverallRiskLevel(risks);

  const riskScore =
    calculateRiskScore(risks);

  return {
    risks,
    overallRiskLevel,
    riskScore,
    recommendationSummary:
      createRecommendationSummary(
        overallRiskLevel
      )
  };
}

export function getRiskLabel(
  level: RiskLevel
): string {
  return riskLabels[level];
}
