import type { ZodError } from "zod";
import { analysisInputSchema } from "./schemas";
import type { AnalysisInput, ValidationError, ValidationResult } from "./types";

export function formatValidationErrors(error: ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join("."),
    message: issue.message
  }));
}

export function validateAnalysisInput(input: unknown): ValidationResult<AnalysisInput> {
  const result = analysisInputSchema.safeParse(input);
  if (!result.success) {
    return { success: false, data: null, errors: formatValidationErrors(result.error) };
  }
  return { success: true, data: result.data, errors: [] };
}
