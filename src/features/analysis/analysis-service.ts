import { calculateAnalysis } from "./calculations";
import type { AnalysisInput, FullAnalysisResult } from "./domain";
import { analyzeRisks } from "./risks";
import { generateStrategies, getRecommendedStrategyType } from "./strategies";

export function runFullAnalysis(input: AnalysisInput): FullAnalysisResult {
  const calculation = calculateAnalysis(input);
  const risk = analyzeRisks(input, calculation);
  const strategies = generateStrategies(input);

  return {
    analysisId: crypto.randomUUID(),
    calculatedAt: new Date().toISOString(),
    ...calculation,
    ...risk,
    strategies,
    recommendedStrategyType: getRecommendedStrategyType(input),
    assumptions: [
      "Zins und Tilgung bleiben bis zum Ende der Zinsbindung konstant.",
      "Miete, Leerstand, Instandhaltung und Sanierung beruhen auf Nutzereingaben.",
      "Steuerwerte sind vereinfachte Orientierungswerte und keine Beratung.",
      "Förderprogramme werden als Prüfansätze angezeigt und müssen aktuell verifiziert werden."
    ]
  };
}
