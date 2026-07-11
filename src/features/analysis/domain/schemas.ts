import { z } from "zod";

import {
  employmentStatuses,
  occupancyTypes,
  propertyConditions,
  propertyTypes,
  purchaseGoals,
  riskPreferences
} from "./enums";

const moneySchema = z.coerce
  .number()
  .finite("Der Betrag muss eine gültige Zahl sein.")
  .min(0, "Der Betrag darf nicht negativ sein.");

const positiveMoneySchema = z.coerce
  .number()
  .finite("Der Betrag muss eine gültige Zahl sein.")
  .positive("Der Betrag muss größer als 0 sein.");

const percentageSchema = z.coerce
  .number()
  .finite("Der Prozentsatz muss eine gültige Zahl sein.")
  .min(0, "Der Prozentsatz darf nicht negativ sein.")
  .max(100, "Der Prozentsatz darf höchstens 100 betragen.");

const optionalTextSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined);

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => !value || z.string().url().safeParse(value).success,
    "Bitte eine gültige URL eingeben."
  )
  .transform((value) => value || undefined);

export const userProfileSchema = z
  .object({
    householdNetIncome: positiveMoneySchema,
    additionalMonthlyIncome: moneySchema.default(0),
    monthlyLivingCosts: moneySchema,
    existingLoanPayments: moneySchema.default(0),

    availableEquity: moneySchema,
    emergencyReserve: moneySchema,

    numberOfAdults: z.coerce
      .number()
      .int()
      .min(1, "Mindestens eine erwachsene Person ist erforderlich.")
      .max(10),

    numberOfChildren: z.coerce
      .number()
      .int()
      .min(0)
      .max(20)
      .default(0),

    employmentStatus: z.enum(employmentStatuses),
    purchaseGoal: z.enum(purchaseGoals),
    riskPreference: z.enum(riskPreferences),

    plannedMonthlyMaximumRate: moneySchema,
    desiredRemainingReserve: moneySchema,

    notes: optionalTextSchema
  })
  .superRefine((profile, context) => {
    const totalIncome =
      profile.householdNetIncome + profile.additionalMonthlyIncome;

    const currentCommitments =
      profile.monthlyLivingCosts + profile.existingLoanPayments;

    if (currentCommitments >= totalIncome) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["monthlyLivingCosts"],
        message:
          "Die laufenden Kosten und Kreditraten erreichen oder überschreiten das Einkommen."
      });
    }

    if (profile.emergencyReserve > profile.availableEquity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emergencyReserve"],
        message:
          "Die Sicherheitsreserve kann nicht höher als das verfügbare Eigenkapital sein."
      });
    }

    if (
      profile.desiredRemainingReserve > profile.availableEquity
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["desiredRemainingReserve"],
        message:
          "Die gewünschte Restreserve kann nicht höher als das verfügbare Eigenkapital sein."
      });
    }
  });

export const propertyAddressSchema = z.object({
  street: z.string().trim().max(150).optional().default(""),
  houseNumber: z.string().trim().max(30).optional().default(""),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Die Postleitzahl muss aus fünf Ziffern bestehen.")
    .optional()
    .or(z.literal(""))
    .default(""),
  city: z.string().trim().max(100).optional().default(""),
  federalState: z.string().trim().max(100).optional().default("")
});

export const propertyProfileSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Bitte eine Bezeichnung für die Immobilie eingeben.")
      .max(150),

    sourceUrl: optionalUrlSchema,

    propertyType: z.enum(propertyTypes),
    condition: z.enum(propertyConditions),
    occupancyType: z.enum(occupancyTypes),

    address: propertyAddressSchema,

    purchasePrice: positiveMoneySchema,
    livingArea: z.coerce
      .number()
      .finite()
      .positive("Die Wohnfläche muss größer als 0 sein.")
      .max(100000),

    landArea: z.coerce
      .number()
      .finite()
      .min(0)
      .max(1000000)
      .default(0),

    numberOfUnits: z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .default(1),

    yearBuilt: z.coerce
      .number()
      .int()
      .min(1800)
      .max(new Date().getFullYear() + 5)
      .optional(),

    monthlyColdRent: moneySchema.default(0),
    monthlyNonRecoverableCosts: moneySchema.default(0),
    monthlyHouseMoney: moneySchema.default(0),

    renovationCosts: moneySchema.default(0),
    modernizationCosts: moneySchema.default(0),
    furnishingCosts: moneySchema.default(0),

    brokerCommissionPercent: percentageSchema.default(0),
    realEstateTransferTaxPercent: percentageSchema,
    notaryAndLandRegistryPercent: percentageSchema.default(2),

    expectedVacancyPercent: percentageSchema.default(2),
    annualMaintenancePercent: percentageSchema.default(1),

    energyClass: z
      .enum(["A+", "A", "B", "C", "D", "E", "F", "G", "H"])
      .optional(),

    notes: optionalTextSchema
  })
  .superRefine((property, context) => {
    if (
      property.occupancyType === "fully_rented" &&
      property.monthlyColdRent <= 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["monthlyColdRent"],
        message:
          "Bei einer vollständig vermieteten Immobilie muss eine Kaltmiete angegeben werden."
      });
    }

    if (
      property.propertyType === "multi_family_house" &&
      property.numberOfUnits < 2
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["numberOfUnits"],
        message:
          "Ein Mehrfamilienhaus muss mindestens zwei Einheiten haben."
      });
    }
  });

export const financingProfileSchema = z
  .object({
    equityForPurchase: moneySchema,

    annualInterestRatePercent: percentageSchema.refine(
      (value) => value <= 20,
      "Der Sollzins erscheint unrealistisch hoch."
    ),

    initialRepaymentPercent: percentageSchema.refine(
      (value) => value > 0 && value <= 20,
      "Die anfängliche Tilgung muss größer als 0 und höchstens 20 Prozent sein."
    ),

    fixedInterestYears: z.coerce
      .number()
      .int()
      .min(1)
      .max(40),

    totalTermYears: z.coerce
      .number()
      .int()
      .min(1)
      .max(50),

    additionalMonthlyPayment: moneySchema.default(0),

    annualSpecialRepaymentPercent: percentageSchema
      .refine(
        (value) => value <= 20,
        "Die jährliche Sondertilgung darf höchstens 20 Prozent betragen."
      )
      .default(0),

    includePurchaseCostsInLoan: z.boolean().default(false),
    includeRenovationInLoan: z.boolean().default(false),

    expectedInterestAfterFixedPeriodPercent:
      percentageSchema.optional(),

    desiredMaximumLoanToValuePercent: percentageSchema.default(100)
  })
  .superRefine((financing, context) => {
    if (financing.fixedInterestYears > financing.totalTermYears) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fixedInterestYears"],
        message:
          "Die Zinsbindung kann nicht länger als die Gesamtlaufzeit sein."
      });
    }
  });

export const analysisSettingsSchema = z.object({
  projectionYears: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10),

  annualPropertyValueGrowthPercent: z.coerce
    .number()
    .finite()
    .min(-20)
    .max(20)
    .default(1),

  annualRentGrowthPercent: z.coerce
    .number()
    .finite()
    .min(-20)
    .max(20)
    .default(1.5),

  annualCostGrowthPercent: z.coerce
    .number()
    .finite()
    .min(-20)
    .max(30)
    .default(2),

  incomeSafetyReductionPercent: percentageSchema.default(10),

  calculateTaxScenario: z.boolean().default(true),
  calculateSubsidyScenario: z.boolean().default(true)
});

export const analysisInputSchema = z
  .object({
    user: userProfileSchema,
    property: propertyProfileSchema,
    financing: financingProfileSchema,
    settings: analysisSettingsSchema
  })
  .superRefine((input, context) => {
    if (
      input.financing.equityForPurchase >
      input.user.availableEquity
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["financing", "equityForPurchase"],
        message:
          "Das eingesetzte Eigenkapital ist höher als das verfügbare Eigenkapital."
      });
    }

    const remainingEquity =
      input.user.availableEquity -
      input.financing.equityForPurchase;

    if (
      remainingEquity <
      input.user.desiredRemainingReserve
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["financing", "equityForPurchase"],
        message:
          "Nach dem Kauf bleibt weniger als die gewünschte Sicherheitsreserve übrig."
      });
    }
  });
