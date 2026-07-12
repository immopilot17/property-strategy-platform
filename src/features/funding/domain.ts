import { z } from "zod";

export const fundingRequirementSchema = z.object({
  field: z.enum(["federalState", "occupancy", "children", "annualIncome", "projectType", "firstPurchase", "renovation", "energyClass"]),
  operator: z.enum(["equals", "not_equals", "at_least", "at_most", "one_of"]),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  explanation: z.string()
});

export const normalizedFundingProgramSchema = z.object({
  providerId: z.string(),
  programId: z.string(),
  programName: z.string(),
  description: z.string(),
  category: z.enum(["purchase", "new_build", "renovation", "energy", "accessibility", "other"]),
  eligibility: z.array(fundingRequirementSchema),
  maximumFunding: z.object({ amount: z.number().nullable(), currency: z.literal("EUR"), description: z.string() }),
  interestRate: z.object({ valuePercent: z.number().nullable(), description: z.string(), variable: z.boolean() }).nullable(),
  repaymentGrant: z.object({ amount: z.number().nullable(), percent: z.number().nullable(), description: z.string() }).nullable(),
  validFrom: z.string().nullable(),
  validUntil: z.string().nullable(),
  applicationProcess: z.string(),
  applicationDeadline: z.string(),
  requiredDocuments: z.array(z.string()),
  combinations: z.array(z.string()),
  restrictions: z.array(z.string()),
  officialSource: z.string().url(),
  sourcePublishedAt: z.string().nullable(),
  lastUpdated: z.string(),
  sourceEvidence: z.array(z.object({ field: z.string(), quote: z.string().max(500) }))
});

export type NormalizedFundingProgram = z.infer<typeof normalizedFundingProgramSchema>;

export type FundingSourceDocument = {
  providerId: string;
  sourceUrl: string;
  fetchedAt: string;
  title: string;
  text: string;
  checksum: string;
};

export interface FundingProvider {
  id: string;
  name: string;
  discover(): Promise<string[]>;
  collect(url: string): Promise<FundingSourceDocument>;
}
