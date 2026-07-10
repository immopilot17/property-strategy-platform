export type StrategyType = "safe" | "balanced" | "maximum" | "alternative";

export type PurchaseStrategy = {
  type: StrategyType;
  title: string;
  purchasePrice: number;
  monthlyRate: number;
  reserve: number;
  riskLevel: "low" | "medium" | "high";
  rationale: string[];
};
