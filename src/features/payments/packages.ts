export const paymentPackages = [
  {
    code: "starter",
    name: "Analyse",
    priceCents: 799,
    credits: 5,
    tokenAllowance: 25_000,
    audience: "Du willst ein Objekt besser einordnen.",
    outcome: "Gespeicherte Analysen mit verständlicher KI-Erklärung.",
    bestFor: "Wenn du einzelne Objekte prüfen und vergleichen möchtest.",
    features: ["Deterministische Immobilienanalyse", "KI-Erklärungen", "Exposé-Texterkennung", "Objektvergleich"]
  },
  {
    code: "plus",
    name: "Finanzierung",
    priceCents: 1499,
    credits: 10,
    tokenAllowance: 60_000,
    audience: "Du planst den Kauf konkret.",
    outcome: "Vergleichbare Raten, Restschuld, Szenarien und Förderhinweise.",
    bestFor: "Wenn die Finanzierung entscheidungsreif werden soll.",
    features: ["Alle Analyse-Funktionen", "Finanzierungsalternativen", "Restschuld- und Zinsszenarien", "KfW- und Landesförderprüfung"]
  },
  {
    code: "pro",
    name: "Strategie",
    priceCents: 1999,
    credits: 20,
    tokenAllowance: 120_000,
    audience: "Du willst Auswirkungen langfristig verstehen.",
    outcome: "Steuer-, Risiko-, Agenten- und Handlungsempfehlungen.",
    bestFor: "Wenn du Eigennutzung und Kapitalanlage fundiert abwägst.",
    features: ["Alle Finanzierungsfunktionen", "Steuerliche Orientierung", "Agenten- und Supervisor-Prüfung", "Persönlicher Maßnahmenplan"]
  },
  {
    code: "premium",
    name: "Premium",
    priceCents: 2499,
    credits: 35,
    tokenAllowance: 250_000,
    audience: "Du möchtest die vollständige Kaufentscheidung dokumentieren.",
    outcome: "Komplette Analyse von Finanzierung bis KfW-Förderung inklusive PDF-Bericht.",
    bestFor: "Wenn du alle Recherchen, Empfehlungen und Berechnungen teilen möchtest.",
    features: ["Alle Plattform-Funktionen", "Vollständige KfW- und Förderanalyse", "Finanzierungs- und Steueroptimierung", "Downloadbarer Gesamtbericht als PDF"]
  }
] as const;

export type PackageCode = (typeof paymentPackages)[number]["code"];
export function getPaymentPackage(code: string) { return paymentPackages.find((item) => item.code === code); }
export type AccessTier = "free" | PackageCode;
const tierOrder: AccessTier[] = ["free", "starter", "plus", "pro", "premium"];
export const hasTier = (current: AccessTier, required: AccessTier) => tierOrder.indexOf(current) >= tierOrder.indexOf(required);
