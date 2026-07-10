import { DashboardSectionPage } from "@/components/dashboard-section-page";

export default function Page() {
  return (
    <DashboardSectionPage
      eyebrow="Strategien"
      title="Mehrere Kaufwege statt nur einer Zahl"
      description="Die Plattform entwickelt sichere, ausgewogene, maximale und alternative Kaufstrategien."
      items={["Sichere Strategie", "Ausgewogene Strategie", "Maximale Strategie", "Alternative Immobilienstrategie"]}
    />
  );
}
