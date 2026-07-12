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

export type AnalysisAgentFinding = AgentResult<{
  title: string;
  summary: string;
  score: number;
  recommendations: string[];
}>;

export type SupervisorResult = {
  verdict: string;
  priorityActions: string[];
  conflicts: string[];
  confidence: "low" | "medium" | "high";
};
