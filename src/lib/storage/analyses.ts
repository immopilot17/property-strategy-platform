import type { AnalysisInput, FullAnalysisResult } from "@/features/analysis/domain";

export type SavedAnalysis = {
  id: string;
  title: string;
  createdAt: string;
  input: AnalysisInput;
  result: FullAnalysisResult;
  aiSummary?: string;
};

const STORAGE_KEY = "property-strategy-platform:analyses";
const ACTIVE_KEY = "property-strategy-platform:active-analysis";

export function readLocalAnalyses(): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as SavedAnalysis[] : [];
  } catch {
    return [];
  }
}

export function saveLocalAnalysis(analysis: SavedAnalysis): void {
  const current = readLocalAnalyses().filter((item) => item.id !== analysis.id);
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([analysis, ...current].slice(0, 50))
  );
}

export function deleteLocalAnalysis(id: string): void {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(readLocalAnalyses().filter((item) => item.id !== id))
  );
}

export function setActiveAnalysis(analysis: SavedAnalysis): void {
  window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(analysis));
}

export function consumeActiveAnalysis(): SavedAnalysis | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(ACTIVE_KEY);
    if (!value) return null;
    window.localStorage.removeItem(ACTIVE_KEY);
    return JSON.parse(value) as SavedAnalysis;
  } catch {
    return null;
  }
}
