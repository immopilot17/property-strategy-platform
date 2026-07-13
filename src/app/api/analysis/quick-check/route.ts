import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateAffordability } from "@/features/quick-check/services/calculate-affordability";

const schema = z.object({
  householdNetIncome: z.number().nonnegative(),
  equity: z.number().nonnegative(),
  existingLoanPayments: z.number().nonnegative(),
  monthlyFixedCosts: z.number().nonnegative(),
  purchasePurpose: z.enum(["owner_occupied", "investment"])
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Eingaben", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(calculateAffordability(parsed.data));
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("quick-check.parse-error", error.message);
      return NextResponse.json(
        { error: "Ungültiges JSON-Format." },
        { status: 400 }
      );
    }
    console.error("quick-check.error", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Die Schnellprüfung konnte nicht verarbeitet werden." },
      { status: 500 }
    );
  }
}
