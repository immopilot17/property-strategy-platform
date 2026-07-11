import type {
  AnalysisInput,
  StrategyResult,
  StrategyType
} from "../domain";

import {
  calculateFinancing,
  calculateMonthlyLoanRate,
  calculatePurchaseCosts
} from "../calculations";

type StrategyConfiguration = {
  type: StrategyType;
  title: string;
  equitySharePercent: number;
  minimumReserve: number;
  interestAdjustment: number;
  repaymentAdjustment: number;
  financePurchaseCosts: boolean;
  financeProjectCosts: boolean;
};

const strategyConfigurations: StrategyConfiguration[] = [
  {
    type: "safe",
    title: "Sichere Strategie",
    equitySharePercent: 35,
    minimumReserve: 20000,
    interestAdjustment: 0.25,
    repaymentAdjustment: 0.5,
    financePurchaseCosts: false,
    financeProjectCosts: false
  },
  {
    type: "balanced",
    title: "Ausgewogene Strategie",
    equitySharePercent: 20,
    minimumReserve: 12000,
    interestAdjustment: 0,
    repaymentAdjustment: 0,
    financePurchaseCosts: false,
    financeProjectCosts: true
  },
  {
    type: "maximum",
    title: "Maximale Strategie",
    equitySharePercent: 10,
    minimumReserve: 8000,
    interestAdjustment: 0.5,
    repaymentAdjustment: -0.25,
    financePurchaseCosts: true,
    financeProjectCosts: true
  },
  {
    type: "alternative",
    title: "Alternative Strategie",
    equitySharePercent: 25,
    minimumReserve: 15000,
    interestAdjustment: -0.15,
    repaymentAdjustment: 0.25,
    financePurchaseCosts: false,
    financeProjectCosts: false
  }
];

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    Math.max(value, minimum),
    maximum
  );
}

function calculateRecommendedEquity(
  input: AnalysisInput,
  configuration: StrategyConfiguration
): number {
  const purchaseCosts =
    calculatePurchaseCosts(input);

  const targetEquity =
    input.property.purchasePrice *
    (configuration.equitySharePercent / 100);

  const costsPaidFromEquity =
    configuration.financePurchaseCosts
      ? 0
      : purchaseCosts.totalPurchaseCosts;

  const projectCostsPaidFromEquity =
    configuration.financeProjectCosts
      ? 0
      : purchaseCosts.totalProjectCosts;

  const maximumUsableEquity =
    Math.max(
      0,
      input.user.availableEquity -
        Math.max(
          configuration.minimumReserve,
          input.user.desiredRemainingReserve
        )
    );

  const requestedEquity =
    targetEquity +
    costsPaidFromEquity +
    projectCostsPaidFromEquity;

  return roundCurrency(
    clamp(
      requestedEquity,
      0,
      maximumUsableEquity
    )
  );
}

function createStrategyInput(
  input: AnalysisInput,
  configuration: StrategyConfiguration,
  recommendedEquity: number
): AnalysisInput {
  const adjustedInterest =
    Math.max(
      0.1,
      input.financing
        .annualInterestRatePercent +
        configuration.interestAdjustment
    );

  const adjustedRepayment =
    Math.max(
      1,
      input.financing
        .initialRepaymentPercent +
        configuration.repaymentAdjustment
    );

  return {
    ...input,
    financing: {
      ...input.financing,
      equityForPurchase:
        recommendedEquity,
      annualInterestRatePercent:
        adjustedInterest,
      initialRepaymentPercent:
        adjustedRepayment,
      includePurchaseCostsInLoan:
        configuration.financePurchaseCosts,
      includeRenovationInLoan:
        configuration.financeProjectCosts
    }
  };
}

function createAdvantages(
  type: StrategyType,
  remainingReserve: number,
  loanAmount: number,
  monthlyRate: number
): string[] {
  switch (type) {
    case "safe":
      return [
        "Niedrigere Darlehenssumme durch höheren Eigenkapitaleinsatz",
        "Höhere Tilgung reduziert die Restschuld schneller",
        `Verbleibende Reserve von rund ${remainingReserve.toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR"
        })}`,
        "Geringeres Risiko bei steigenden Zinsen"
      ];

    case "balanced":
      return [
        "Ausgewogenes Verhältnis zwischen Eigenkapital und Liquiditätsreserve",
        "Sanierungs- oder Modernisierungskosten können mitfinanziert werden",
        `Darlehenssumme von rund ${loanAmount.toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR"
        })}`,
        "Geeignet für Käufer mit mittlerer Risikobereitschaft"
      ];

    case "maximum":
      return [
        "Geringerer unmittelbarer Eigenkapitaleinsatz",
        "Höhere Liquiditätsreserve bleibt verfügbar",
        "Kaufnebenkosten und Projektkosten können mitfinanziert werden",
        "Ermöglicht einen höheren Kaufpreisrahmen"
      ];

    case "alternative":
      return [
        "Moderater Eigenkapitaleinsatz",
        "Leicht konservativer Zinssatz",
        "Höhere Tilgung als in der Standardvariante",
        `Monatliche Rate von rund ${monthlyRate.toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR"
        })}`
      ];
  }
}

function createDisadvantages(
  type: StrategyType,
  remainingReserve: number,
  loanAmount: number,
  monthlyRate: number
): string[] {
  switch (type) {
    case "safe":
      return [
        "Hoher Eigenkapitaleinsatz reduziert die frei verfügbare Liquidität",
        "Weniger Kapital für weitere Investitionen",
        "Kann bei niedrigem Eigenkapital nicht vollständig umgesetzt werden"
      ];

    case "balanced":
      return [
        "Mittlere Monatsrate und mittlere Restschuld",
        "Sanierungskosten erhöhen die Darlehenssumme",
        "Bei unerwarteten Kosten kann die Reserve schneller sinken"
      ];

    case "maximum":
      return [
        `Hohe Darlehenssumme von rund ${loanAmount.toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR"
        })}`,
        `Hohe Monatsrate von rund ${monthlyRate.toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR"
        })}`,
        "Höhere Finanzierungskosten",
        "Erhöhtes Anschlussfinanzierungs- und Zinsrisiko"
      ];

    case "alternative":
      return [
        "Kaufnebenkosten müssen überwiegend aus Eigenkapital bezahlt werden",
        `Verbleibende Reserve von rund ${remainingReserve.toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR"
        })}`,
        "Nicht für sehr hohe Sanierungskosten geeignet"
      ];
  }
}

function createNextSteps(
  type: StrategyType
): string[] {
  switch (type) {
    case "safe":
      return [
        "Bankangebote mit mindestens zehn bis fünfzehn Jahren Zinsbindung einholen",
        "Tilgung von mindestens 2,5 Prozent prüfen",
        "Sicherheitsreserve nicht für Kaufnebenkosten aufbrauchen",
        "Anschlussfinanzierung mit höheren Zinsen simulieren"
      ];

    case "balanced":
      return [
        "Finanzierungsangebote mit und ohne Sanierungskosten vergleichen",
        "Eigenkapitalreserve nach Kauf kontrollieren",
        "Monatsrate mit einem Einkommensrückgang von zehn Prozent testen",
        "Sondertilgungsrecht vereinbaren"
      ];

    case "maximum":
      return [
        "Prüfen, ob die Bank eine Finanzierung über 100 Prozent akzeptiert",
        "Zinsaufschläge und Zusatzsicherheiten berücksichtigen",
        "Mindestens sechs Monatsraten als Liquiditätsreserve behalten",
        "Kaufpreis konsequent verhandeln"
      ];

    case "alternative":
      return [
        "Kaufpreisreduzierung oder günstigeres Vergleichsobjekt prüfen",
        "Förderdarlehen und energetische Programme einbeziehen",
        "Projektkosten möglichst aus Eigenmitteln bezahlen",
        "Höhere Tilgung bei gleichbleibender Monatsrate verhandeln"
      ];
  }
}

function createSummary(
  type: StrategyType,
  monthlyRate: number,
  remainingReserve: number
): string {
  const formattedRate =
    monthlyRate.toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR"
    });

  const formattedReserve =
    remainingReserve.toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR"
    });

  switch (type) {
    case "safe":
      return `Diese Variante priorisiert Stabilität, eine schnellere Tilgung und einen ausreichenden Sicherheitspuffer. Die geschätzte Monatsrate beträgt ${formattedRate}, die verbleibende Reserve ${formattedReserve}.`;

    case "balanced":
      return `Diese Variante verbindet einen angemessenen Eigenkapitaleinsatz mit ausreichender Liquidität. Die geschätzte Monatsrate beträgt ${formattedRate}, die verbleibende Reserve ${formattedReserve}.`;

    case "maximum":
      return `Diese Variante maximiert den möglichen Finanzierungsrahmen und hält mehr Eigenkapital verfügbar. Dafür steigen Monatsrate, Zinskosten und Gesamtrisiko. Geschätzte Monatsrate: ${formattedRate}.`;

    case "alternative":
      return `Diese Variante reduziert das Risiko durch einen moderaten Eigenkapitaleinsatz, eine etwas höhere Tilgung und eine konservativere Finanzierung. Die verbleibende Reserve beträgt ${formattedReserve}.`;
  }
}

export function generateStrategies(
  input: AnalysisInput
): StrategyResult[] {
  return strategyConfigurations.map(
    (configuration) => {
      const recommendedEquity =
        calculateRecommendedEquity(
          input,
          configuration
        );

      const strategyInput =
        createStrategyInput(
          input,
          configuration,
          recommendedEquity
        );

      const purchaseCosts =
        calculatePurchaseCosts(
          strategyInput
        );

      const financingResult =
        calculateFinancing(
          strategyInput,
          purchaseCosts
        );

      const estimatedLoanAmount =
        financingResult.requiredLoanAmount;

      const estimatedMonthlyRate =
        calculateMonthlyLoanRate(
          estimatedLoanAmount,
          strategyInput.financing
            .annualInterestRatePercent,
          strategyInput.financing
            .initialRepaymentPercent
        ) +
        strategyInput.financing
          .additionalMonthlyPayment;

      const estimatedRemainingReserve =
        Math.max(
          0,
          input.user.availableEquity -
            recommendedEquity
        );

      return {
        type: configuration.type,
        title: configuration.title,

        summary: createSummary(
          configuration.type,
          estimatedMonthlyRate,
          estimatedRemainingReserve
        ),

        recommendedEquity:
          roundCurrency(
            recommendedEquity
          ),

        estimatedLoanAmount:
          roundCurrency(
            estimatedLoanAmount
          ),

        estimatedMonthlyRate:
          roundCurrency(
            estimatedMonthlyRate
          ),

        estimatedRemainingReserve:
          roundCurrency(
            estimatedRemainingReserve
          ),

        advantages:
          createAdvantages(
            configuration.type,
            estimatedRemainingReserve,
            estimatedLoanAmount,
            estimatedMonthlyRate
          ),

        disadvantages:
          createDisadvantages(
            configuration.type,
            estimatedRemainingReserve,
            estimatedLoanAmount,
            estimatedMonthlyRate
          ),

        nextSteps:
          createNextSteps(
            configuration.type
          )
      };
    }
  );
}

export function getRecommendedStrategy(
  input: AnalysisInput,
  strategies: StrategyResult[]
): StrategyResult {
  const preferredType =
    input.user.riskPreference ===
      "conservative"
      ? "safe"
      : input.user.riskPreference ===
          "growth"
        ? "maximum"
        : "balanced";

  return (
    strategies.find(
      (strategy) =>
        strategy.type === preferredType
    ) ??
    strategies[0]
  );
}
