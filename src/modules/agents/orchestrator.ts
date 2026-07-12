import type { AnalysisInput, CalculationResult, RiskIndicator } from "@/features/analysis/domain";
import type { AnalysisAgentFinding, AgentName, SupervisorResult } from "./agent-types";

const finding = (agent: AgentName, title: string, summary: string, score: number, recommendations: string[], warnings: string[] = []): AnalysisAgentFinding => ({
  agent, facts: { title, summary, score: Math.max(0, Math.min(100, Math.round(score))), recommendations },
  assumptions: ["Bewertung basiert ausschließlich auf den eingegebenen und berechneten Werten."], warnings,
  confidence: warnings.length ? "medium" : "high"
});

export function orchestrateAnalysis(input: AnalysisInput, result: CalculationResult, risks: RiskIndicator[]) {
  const affordabilityScore = 100 - Math.max(0, result.affordability.debtServiceRatioPercent - 25) * 2;
  const equityScore = 100 - Math.max(0, result.financing.loanToValuePercent - 70) * 1.5;
  const financing = finding("financing", "Finanzierungs-Agent", `Die gemeinsame monatliche Restliquidität beträgt ${Math.round(result.affordability.remainingMonthlyLiquidity)} €.`, (affordabilityScore + equityScore) / 2, [
    "Mindestens drei Finanzierungsangebote mit identischen Annahmen vergleichen.",
    "Restschuld und Anschlusszins vor Abschluss als Stressszenario prüfen."
  ], result.affordability.remainingMonthlyLiquidity < 500 ? ["Der monatliche Liquiditätspuffer ist knapp."] : []);

  const propertyScore = Math.min(100, Math.max(0, result.profitability.netRentalYieldPercent * 12 + (input.property.condition === "new" ? 20 : 10)));
  const property = finding("property", "Objekt-Agent", `Kaufpreis je m²: ${Math.round(result.profitability.pricePerSquareMeter)} €, Nettomietrendite: ${result.profitability.netRentalYieldPercent.toFixed(1)} %.`, propertyScore, [
    "Kaufpreis mit lokalen Vergleichsobjekten und Unterlagen abgleichen.",
    "Sanierungs- und Instandhaltungsbudget fachlich verifizieren."
  ]);

  const funding = finding("funding", "Förder-Agent", `${result.fundingSuggestions.length} Förderansätze wurden anhand von Nutzung, Kindern, Einkommen, Bundesland und Vorhaben erkannt.`, result.fundingSuggestions.length ? 75 : 35, [
    "Programme und Einkommensgrenzen vor Vertragsabschluss aktuell prüfen.",
    "Förderanträge grundsätzlich vor Vorhabensbeginn klären."
  ], input.property.address.federalState ? [] : ["Bundesland fehlt; regionale Förderungen sind unvollständig."]);

  const tax = finding("tax", "Steuer-Agent", result.tax.enabled ? `Geschätzter jährlicher Steuereffekt: ${Math.round(result.tax.estimatedAnnualTaxEffect)} €.` : "Bei Eigennutzung entsteht keine Vermietungs-Steuerschätzung.", result.tax.enabled ? 70 : 60, [
    "AfA-Bemessungsgrundlage und Werbungskosten steuerlich prüfen lassen.",
    "Die Berechnung nur als unverbindliche Schätzung verwenden."
  ]);

  const risk = finding("risk", "Risiko-Agent", `${risks.length} Risikohinweise wurden gewichtet.`, 100 - risks.reduce((sum, item) => sum + ({ low: 3, medium: 8, high: 15, critical: 25 }[item.level]), 0), [
    "Kritische und hohe Risiken vor einer Kaufentscheidung schließen.",
    "Liquiditätsreserve nicht für planbare Kaufnebenkosten aufbrauchen."
  ], risks.filter((item) => item.level === "critical" || item.level === "high").map((item) => item.title));

  const agents = [financing, property, funding, tax, risk];
  const sorted = [...agents].sort((a, b) => a.facts.score - b.facts.score);
  const supervisor: SupervisorResult = {
    verdict: sorted[0].facts.score >= 70 ? "Die Analyse ist insgesamt tragfähig; Detailprüfungen bleiben erforderlich." : "Vor einer Entscheidung sollten die schwächsten Bereiche verbessert oder fachlich geklärt werden.",
    priorityActions: sorted.slice(0, 3).flatMap((item) => item.facts.recommendations.slice(0, 1)),
    conflicts: result.profitability.monthlyCashflowBeforeTax > 0 && result.affordability.remainingMonthlyLiquidity < 500 ? ["Positiver Objekt-Cashflow trifft auf knappe Haushaltsliquidität."] : [],
    confidence: agents.some((item) => item.confidence === "medium") ? "medium" : "high"
  };
  return { agents, supervisor };
}
