import { DashboardSectionPage } from "@/components/dashboard-section-page";

export default function Page() {
  return (
    <DashboardSectionPage
      eyebrow="Förderungen"
      title="Passende Fördermöglichkeiten"
      description="Hier werden KfW-Programme und weitere Fördermöglichkeiten passend zum Nutzerprofil und Objekt eingeordnet."
      items={["Eigennutzung", "Energetische Sanierung", "Neubau und Bestand", "Voraussetzungen", "Antragsreihenfolge"]}
    />
  );
}
