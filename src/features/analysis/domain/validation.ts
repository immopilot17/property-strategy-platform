import type { ZodError } from "zod";

import { analysisInputSchema } from "./schemas";

import type {
  AnalysisInput,
  ValidationError,
  ValidationResult
} from "./types";

function pathToField(path: PropertyKey[]): string {
  return path.map(String).join(".");
}

export function formatValidationErrors(
  error: ZodError
): ValidationError[] {
  return error.issues.map((issue) => ({
    field: pathToField(issue.path),
    message: issue.message
  }));
}

export function validateAnalysisInput(
  input: unknown
): ValidationResult<AnalysisInput> {
  const result = analysisInputSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      data: null,
      errors: formatValidationErrors(result.error)
    };
  }

  return {
    success: true,
    data: result.data,
    errors: []
  };
}

export function assertValidAnalysisInput(
  input: unknown
): AnalysisInput {
  const result = validateAnalysisInput(input);

  if (!result.success) {
    const message = result.errors
      .map(
        (error) =>
          `${error.field || "Eingabe"}: ${error.message}`
      )
      .join("\n");

    throw new Error(
      `Ungültige Analysedaten:\n${message}`
    );
  }

  return result.data;
}
