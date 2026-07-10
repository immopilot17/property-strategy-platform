import { DashboardSectionPage } from "@/components/dashboard-section-page";

export default function Page() {
  return (
    <DashboardSectionPage
      eyebrow="Risiken"
      title="Risiken früh erkennen"
      description="Hier erkennt die Plattform finanzielle, objektbezogene und strategische Risiken."
      items={["Zu hohe monatliche Belastung", "Zu geringe Rücklage", "Hohe Restschuld", "Unrealistische Miete", "Sanierungs- und Dokumentenrisiken"]}
    />
  );
}
