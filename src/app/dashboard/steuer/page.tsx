import { DashboardSectionPage } from "@/components/dashboard-section-page";

export default function Page() {
  return (
    <DashboardSectionPage
      eyebrow="Steuer"
      title="Steuerliche Hinweise für Immobilienkäufer"
      description="Hier werden steuerliche Auswirkungen getrennt nach Eigennutzung und Kapitalanlage dargestellt."
      items={["Abschreibung", "Schuldzinsen", "Werbungskosten", "Kaufpreisaufteilung", "Sanierungskosten"]}
    />
  );
}
