import { DashboardSectionPage } from "@/components/dashboard-section-page";

export default function Page() {
  return (
    <DashboardSectionPage
      eyebrow="Finanzprofil"
      title="Deine finanzielle Ausgangslage"
      description="Hier werden Einkommen, Eigenkapital, bestehende Kredite, Fixkosten und Sicherheitsreserven strukturiert erfasst."
      items={["Haushaltsnettoeinkommen", "Eigenkapital", "Bestehende Kreditverpflichtungen", "Monatliche Fixkosten", "Sicherheitsreserve"]}
    />
  );
}
