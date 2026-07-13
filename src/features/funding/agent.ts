import type { AnalysisInput } from "@/features/analysis/domain";
import { normalizedFundingProgramSchema, type NormalizedFundingProgram } from "./domain";

type UserFundingFacts = Record<string, string | number | boolean>;

function facts(input: AnalysisInput): UserFundingFacts {
  return {
    federalState: input.property.address.federalState,
    occupancy: input.user.purchaseGoal,
    children: input.user.numberOfChildren,
    annualIncome: input.user.annualGrossIncome + (input.user.purchaseType === "joint" ? input.user.partner?.annualGrossIncome ?? 0 : 0),
    projectType: input.property.projectType,
    firstPurchase: input.property.firstPurchase,
    renovation: input.property.energeticRenovationPlanned,
    energyClass: input.property.energyClass ?? "unknown"
  };
}

function requirementMatches(actual: string | number | boolean, operator: string, expected: unknown) {
  if (operator === "equals") return actual === expected;
  if (operator === "not_equals") return actual !== expected;
  if (operator === "at_least") return Number(actual) >= Number(expected);
  if (operator === "at_most") return Number(actual) <= Number(expected);
  if (operator === "one_of") return Array.isArray(expected) && expected.includes(String(actual));
  return false;
}

export type FundingMatch = {
  program: NormalizedFundingProgram;
  status: "matching" | "possibly_matching" | "not_matching";
  matchedRequirements: string[];
  openRequirements: string[];
  failedRequirements: string[];
  estimatedFirstYearInterestAdvantage: number | null;
};

export function matchFundingPrograms(input: AnalysisInput, rows: unknown[]) {
  const userFacts = facts(input);
  const matches: FundingMatch[] = rows.map((row) => normalizedFundingProgramSchema.parse(row)).map((program) => {
    const matchedRequirements: string[] = [];
    const openRequirements: string[] = [];
    const failedRequirements: string[] = [];
    if (program.eligibility.length === 0) {
      openRequirements.push("Die persönlichen Fördervoraussetzungen müssen anhand der offiziellen Quelle geprüft werden.");
    }
    for (const requirement of program.eligibility) {
      const actual = userFacts[requirement.field];
      if (actual === "" || actual === "unknown" || actual === undefined) openRequirements.push(requirement.explanation);
      else if (requirementMatches(actual, requirement.operator, requirement.value)) matchedRequirements.push(requirement.explanation);
      else failedRequirements.push(requirement.explanation);
    }
    const fundableAmount = program.maximumFunding.amount === null ? null : Math.min(program.maximumFunding.amount, input.property.purchasePrice);
    const estimatedFirstYearInterestAdvantage = fundableAmount !== null && program.interestRate?.valuePercent !== null && program.interestRate?.valuePercent !== undefined
      ? Math.max(0, fundableAmount * (input.financing.annualInterestRatePercent - program.interestRate.valuePercent) / 100) : null;
    return {
      program,
      status: failedRequirements.length ? "not_matching" : openRequirements.length ? "possibly_matching" : "matching",
      matchedRequirements, openRequirements, failedRequirements,
      estimatedFirstYearInterestAdvantage: estimatedFirstYearInterestAdvantage === null ? null : Math.round(estimatedFirstYearInterestAdvantage * 100) / 100
    };
  });
  const relevant = matches.filter((item) => item.status !== "not_matching");
  const conflicts = relevant.flatMap((item) => item.program.restrictions.filter((restriction) => /nicht.*kombin|ausschluss|entweder|bereits.*förder/i.test(restriction)).map((restriction) => `${item.program.programName}: ${restriction}`));
  return {
    matches: relevant.sort((a, b) => (a.status === "matching" ? -1 : 1) - (b.status === "matching" ? -1 : 1)),
    supervisor: {
      summary: relevant.length ? `${relevant.length} Förderprogramme sind passend oder benötigen weitere Angaben.` : "Aktuell wurde kein passendes Programm anhand der verfügbaren Angaben erkannt.",
      conflicts,
      warning: "Förderkonditionen können sich ändern. Verbindlich sind ausschließlich die verlinkten offiziellen Quellen und die Prüfung durch den Fördergeber."
    }
  };
}
