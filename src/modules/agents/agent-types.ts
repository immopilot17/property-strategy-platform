export type AgentName =
  | "financing"
  | "property"
  | "funding"
  | "tax"
  | "location"
  | "risk"
  | "recommendation";

export type AgentResult<T> = {
  agent: AgentName;
  facts: T;
  assumptions: string[];
  warnings: string[];
  confidence: "low" | "medium" | "high";
};
