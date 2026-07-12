export const paymentPackages = [
  { code: "starter", name: "Basis Plus", priceCents: 799, credits: 5, features: ["Analysen speichern", "KI-Erklärung", "Objektvergleich"] },
  { code: "plus", name: "Finanzierung", priceCents: 1499, credits: 10, features: ["Alle Basis-Plus-Funktionen", "Finanzierungsalternativen", "Restschuld- und Zinsszenarien", "Förderprüfung"] },
  { code: "pro", name: "Strategie", priceCents: 1999, credits: 20, features: ["Alle Finanzierungsfunktionen", "Steuerliche Orientierung", "Risiko- und Agentenprüfung", "Persönlicher Maßnahmenplan"] },
  { code: "premium", name: "Premium", priceCents: 2499, credits: 35, features: ["Vollständiges Programm", "Supervisor-Auswertung", "Kompletter PDF-Bericht", "Alle zukünftigen Detailmodule"] }
] as const;

export type PackageCode = (typeof paymentPackages)[number]["code"];

export function getPaymentPackage(code: string) {
  return paymentPackages.find((item) => item.code === code);
}

export type AccessTier = "free" | PackageCode;
const tierOrder: AccessTier[] = ["free", "starter", "plus", "pro", "premium"];
export const hasTier = (current: AccessTier, required: AccessTier) => tierOrder.indexOf(current) >= tierOrder.indexOf(required);
