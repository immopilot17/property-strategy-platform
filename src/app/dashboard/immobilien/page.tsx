import { DashboardSectionPage } from "@/components/dashboard-section-page";

export default function Page() {
  return (
    <DashboardSectionPage
      eyebrow="Immobilien"
      title="Immobilien erfassen und vergleichen"
      description="Hier werden Objekte mit Kaufpreis, Fläche, Lage, Zustand, Miete, Hausgeld und Sanierungsbedarf gespeichert."
      items={["Neue Immobilie anlegen", "Kaufpreis und Quadratmeterpreis", "Miete und Hausgeld", "Sanierungsbedarf", "Objekte vergleichen"]}
    />
  );
}
