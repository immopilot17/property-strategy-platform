export function extractOpenAIOutputText(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const response = data as {
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  return null;
}

export function extractOpenAIUsage(data: unknown): { inputTokens: number; outputTokens: number } | null {
  if (!data || typeof data !== "object") return null;
  const usage = (data as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
  if (!usage) return null;
  return {
    inputTokens: Math.max(0, Number(usage.input_tokens ?? 0)),
    outputTokens: Math.max(0, Number(usage.output_tokens ?? 0))
  };
}
