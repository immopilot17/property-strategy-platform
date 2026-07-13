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
