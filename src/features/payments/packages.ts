export const paymentPackages = [
  { code: "starter", name: "Analyse", priceCents: 799, credits: 5, audience: "Du willst ein Objekt besser einordnen.", outcome: "Eine gespeicherte Analyse mit klarer KI-Erklärung.", bestFor: "Wenn du mehrere Objekte vergleichst.", features: ["Analysen speichern", "KI-Erklärung", "Objektvergleich"] },
  { code: "plus", name: "Finanzierung", priceCents: 1499, credits: 10, audience: "Du planst den Kauf konkret.", outcome: "Vergleichbare Raten, Restschuld und Förderhinweise.", bestFor: "Wenn die Finanzierung entscheidungsreif werden soll.", features: ["Alle Analyse-Funktionen", "Finanzierungsalternativen", "Restschuld- und Zinsszenarien", "Förderprüfung"] },
  { code: "pro", name: "Strategie", priceCents: 1999, credits: 20, audience: "Du willst Auswirkungen langfristig verstehen.", outcome: "Steuer-, Risiko- und nächste-Schritte-Orientierung.", bestFor: "Wenn du zwischen Eigennutzung und Kapitalanlage abwägst.", features: ["Alle Finanzierungsfunktionen", "Steuerliche Orientierung", "Risiko- und Agentenprüfung", "Persönlicher Maßnahmenplan"] },
  { code: "premium", name: "Premium", priceCents: 2499, credits: 35, audience: "Du möchtest alles an einem Ort dokumentieren.", outcome: "Vollständige Auswertung als teilbarer PDF-Bericht.", bestFor: "Wenn du die Entscheidung gemeinsam besprechen willst.", features: ["Vollständiges Programm", "Supervisor-Auswertung", "Kompletter PDF-Bericht", "Alle Detailmodule"] }
] as const;

export type PackageCode = (typeof paymentPackages)[number]["code"];
export function getPaymentPackage(code: string) { return paymentPackages.find((item) => item.code === code); }
export type AccessTier = "free" | PackageCode;
const tierOrder: AccessTier[] = ["free", "starter", "plus", "pro", "premium"];
export const hasTier = (current: AccessTier, required: AccessTier) => tierOrder.indexOf(current) >= tierOrder.indexOf(required);
