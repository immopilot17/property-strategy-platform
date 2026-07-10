import type { AgentName } from "./agent-types";

export type AnalysisRequest = {
  userId: string;
  propertyId?: string;
  requestedAgents: AgentName[];
};

export async function orchestrateAnalysis(request: AnalysisRequest) {
  return {
    analysisId: crypto.randomUUID(),
    requestedAgents: request.requestedAgents,
    status: "queued"
  };
}
