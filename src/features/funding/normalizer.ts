import { normalizedFundingProgramSchema, type FundingSourceDocument } from "./domain";

function programId(document: FundingSourceDocument) {
  const url = new URL(document.sourceUrl);
  if (document.providerId === "kfw") {
    const match = decodeURIComponent(url.pathname).match(/\((\d+(?:-\d+)?)\)\/?$/);
    if (match) return match[1];
  }

  const slug = url.pathname.split("/").filter(Boolean).at(-1)?.replace(/\.html$/i, "");
  return slug ? `${document.providerId}-${slug}` : `${document.providerId}-${document.checksum.slice(0, 12)}`;
}

function category(title: string) {
  const value = title.toLocaleLowerCase("de-DE");
  if (/altersgerecht|barriere|umbauen/.test(value)) return "accessibility" as const;
  if (/energie|heizung|klima|effizien/.test(value)) return "energy" as const;
  if (/neubau|neu bauen/.test(value)) return "new_build" as const;
  if (/sanier|modernis|bestand/.test(value)) return "renovation" as const;
  if (/eigentum|kauf|wohnen|familie/.test(value)) return "purchase" as const;
  return "other" as const;
}

export function normalizeFundingDocument(document: FundingSourceDocument) {
  const providerName = document.providerId === "kfw" ? "KfW" : document.providerId === "lbank" ? "L-Bank" : document.providerId;
  const programName = document.title.trim() || `${providerName}-Förderprogramm`;

  return normalizedFundingProgramSchema.parse({
    providerId: document.providerId,
    programId: programId(document),
    programName,
    description: `Offizielles Förderprogramm der ${providerName}. Konditionen und Voraussetzungen werden nicht automatisch geschätzt; verbindlich ist die verlinkte Originalquelle.`,
    category: category(programName),
    eligibility: [],
    maximumFunding: {
      amount: null,
      currency: "EUR",
      description: "Der aktuelle Höchstbetrag ist in der offiziellen Quelle zu prüfen.",
    },
    interestRate: null,
    repaymentGrant: null,
    validFrom: null,
    validUntil: null,
    applicationProcess: "Antrag und Voraussetzungen direkt beim Fördergeber beziehungsweise Finanzierungspartner prüfen.",
    applicationDeadline: "Aktuelle Fristen stehen in der offiziellen Quelle.",
    requiredDocuments: [],
    combinations: [],
    restrictions: ["Förderfähigkeit und Konditionen müssen vor Antragstellung anhand der offiziellen Quelle bestätigt werden."],
    officialSource: document.sourceUrl,
    sourcePublishedAt: null,
    lastUpdated: document.fetchedAt,
    sourceEvidence: [{ field: "programName", quote: programName.slice(0, 500) }],
  });
}
