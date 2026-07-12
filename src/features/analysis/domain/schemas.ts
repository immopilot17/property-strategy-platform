import { z } from "zod";
import {
  employmentStatuses,
  maritalStatuses,
  occupancyTypes,
  propertyConditions,
  propertyTypes,
  purchaseGoals,
  riskPreferences,
  purchaseTypes,
  projectTypes
} from "./enums";

const money = z.coerce.number().finite().min(0);
const positiveMoney = z.coerce.number().finite().positive();
const percentage = z.coerce.number().finite().min(0).max(100);
const optionalText = z.string().trim().max(2000).optional().or(z.literal(""))
  .transform((value) => value || undefined);
const optionalUrl = z.string().trim().optional().or(z.literal(""))
  .refine((value) => !value || z.string().url().safeParse(value).success, "Ungültige URL.")
  .transform((value) => value || undefined);

export const userProfileSchema = z.object({
  maritalStatus: z.enum(maritalStatuses),
  purchaseType: z.enum(purchaseTypes),
  householdNetIncome: positiveMoney,
  additionalMonthlyIncome: money.default(0),
  monthlyLivingCosts: money,
  existingLoanPayments: money.default(0),
  availableEquity: money,
  emergencyReserve: money,
  numberOfAdults: z.coerce.number().int().min(1).max(10),
  numberOfChildren: z.coerce.number().int().min(0).max(20).default(0),
  employmentStatus: z.enum(employmentStatuses),
  annualGrossIncome: money.default(0),
  marginalTaxRatePercent: percentage.default(35),
  partner: z.object({
    monthlyNetIncome: money.default(0),
    additionalMonthlyIncome: money.default(0),
    employmentStatus: z.enum(employmentStatuses),
    existingLoanPayments: money.default(0),
    availableEquity: money.default(0),
    annualGrossIncome: money.default(0),
    marginalTaxRatePercent: percentage.default(35)
  }).optional(),
  purchaseGoal: z.enum(purchaseGoals),
  riskPreference: z.enum(riskPreferences),
  plannedMonthlyMaximumRate: money,
  desiredRemainingReserve: money,
  notes: optionalText
}).superRefine((profile, context) => {
  const partnerIncome = profile.purchaseType === "joint" && profile.partner
    ? profile.partner.monthlyNetIncome + profile.partner.additionalMonthlyIncome : 0;
  const partnerLoans = profile.purchaseType === "joint" ? profile.partner?.existingLoanPayments ?? 0 : 0;
  const income = profile.householdNetIncome + profile.additionalMonthlyIncome + partnerIncome;
  if (profile.monthlyLivingCosts + profile.existingLoanPayments + partnerLoans >= income) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["monthlyLivingCosts"],
      message: "Laufende Kosten und Kreditraten erreichen oder überschreiten das Einkommen."
    });
  }
  if (profile.desiredRemainingReserve > profile.availableEquity) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["desiredRemainingReserve"],
      message: "Die gewünschte Reserve ist höher als das verfügbare Eigenkapital."
    });
  }
});

export const propertyAddressSchema = z.object({
  street: z.string().trim().max(150).default(""),
  houseNumber: z.string().trim().max(30).default(""),
  postalCode: z.string().trim().regex(/^$|^\d{5}$/, "Postleitzahl muss fünfstellig sein.").default(""),
  city: z.string().trim().max(100).default(""),
  federalState: z.string().trim().max(100).default("")
});

export const propertyProfileSchema = z.object({
  title: z.string().trim().min(2).max(150),
  sourceUrl: optionalUrl,
  propertyType: z.enum(propertyTypes),
  condition: z.enum(propertyConditions),
  occupancyType: z.enum(occupancyTypes),
  projectType: z.enum(projectTypes),
  energeticRenovationPlanned: z.boolean().default(false),
  firstPurchase: z.boolean().default(false),
  address: propertyAddressSchema,
  purchasePrice: positiveMoney,
  livingArea: z.coerce.number().finite().positive().max(100000),
  landArea: z.coerce.number().finite().min(0).max(1000000).default(0),
  numberOfUnits: z.coerce.number().int().min(1).max(1000).default(1),
  yearBuilt: z.coerce.number().int().min(1800).max(new Date().getFullYear() + 5).optional(),
  monthlyColdRent: money.default(0),
  monthlyNonRecoverableCosts: money.default(0),
  monthlyHouseMoney: money.default(0),
  renovationCosts: money.default(0),
  modernizationCosts: money.default(0),
  furnishingCosts: money.default(0),
  brokerCommissionPercent: percentage.default(0),
  realEstateTransferTaxPercent: percentage,
  notaryAndLandRegistryPercent: percentage.default(2),
  expectedVacancyPercent: percentage.default(2),
  annualMaintenancePercent: percentage.default(1),
  energyClass: z.enum(["A+", "A", "B", "C", "D", "E", "F", "G", "H"]).optional(),
  notes: optionalText
}).superRefine((property, context) => {
  if (property.occupancyType === "fully_rented" && property.monthlyColdRent <= 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["monthlyColdRent"],
      message: "Bei vollständiger Vermietung muss eine Kaltmiete angegeben werden."
    });
  }
  if (property.propertyType === "multi_family_house" && property.numberOfUnits < 2) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["numberOfUnits"],
      message: "Ein Mehrfamilienhaus benötigt mindestens zwei Einheiten."
    });
  }
});

export const financingProfileSchema = z.object({
  equityForPurchase: money,
  annualInterestRatePercent: percentage.refine((value) => value <= 20),
  initialRepaymentPercent: percentage.refine((value) => value > 0 && value <= 20),
  fixedInterestYears: z.coerce.number().int().min(1).max(40),
  totalTermYears: z.coerce.number().int().min(1).max(50),
  additionalMonthlyPayment: money.default(0),
  annualSpecialRepaymentPercent: percentage.refine((value) => value <= 20).default(0),
  includePurchaseCostsInLoan: z.boolean().default(false),
  includeRenovationInLoan: z.boolean().default(false),
  expectedInterestAfterFixedPeriodPercent: percentage.optional(),
  desiredMaximumLoanToValuePercent: percentage.default(100)
}).superRefine((financing, context) => {
  if (financing.fixedInterestYears > financing.totalTermYears) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fixedInterestYears"],
      message: "Die Zinsbindung darf nicht länger als die Gesamtlaufzeit sein."
    });
  }
});

export const analysisSettingsSchema = z.object({
  projectionYears: z.coerce.number().int().min(1).max(50).default(10),
  annualPropertyValueGrowthPercent: z.coerce.number().finite().min(-20).max(20).default(1),
  annualRentGrowthPercent: z.coerce.number().finite().min(-20).max(20).default(1.5),
  annualCostGrowthPercent: z.coerce.number().finite().min(-20).max(30).default(2),
  incomeSafetyReductionPercent: percentage.default(10),
  buildingValueSharePercent: percentage.default(80),
  depreciationRatePercent: percentage.refine((value) => value <= 10).default(2),
  marginalTaxRatePercent: percentage.default(35),
  calculateTaxScenario: z.boolean().default(true),
  calculateSubsidyScenario: z.boolean().default(true)
});

export const analysisInputSchema = z.object({
  user: userProfileSchema,
  property: propertyProfileSchema,
  financing: financingProfileSchema,
  settings: analysisSettingsSchema
}).superRefine((input, context) => {
  const availableEquity = input.user.availableEquity +
    (input.user.purchaseType === "joint" ? input.user.partner?.availableEquity ?? 0 : 0);
  if (input.financing.equityForPurchase > availableEquity) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["financing", "equityForPurchase"],
      message: "Der Eigenkapitaleinsatz ist höher als das verfügbare Eigenkapital."
    });
  }
});
