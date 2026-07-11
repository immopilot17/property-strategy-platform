import Link from "next/link";

const modules = [
  {
    title: "Nutzerprofil",
    description:
      "Einkommen, Kosten, Eigenkapital, Beschäftigung, Kaufziel und Risikoprofil.",
    status: "Bereit"
  },
  {
    title: "Immobiliendaten",
    description:
      "Kaufpreis, Fläche, Zustand, Nutzung, Miete, Hausgeld und Sanierungskosten.",
    status: "Bereit"
  },
  {
    title: "Finanzierungsdaten",
    description:
      "Eigenkapital, Sollzins, Tilgung, Zinsbindung, Laufzeit und Sondertilgung.",
    status: "Bereit"
  },
  {
    title: "Validierung",
    description:
      "Fachliche Prüfungen für Einkommen, Reserven, Objekt und Finanzierung.",
    status: "Bereit"
  },
  {
    title: "Ergebnisstruktur",
    description:
      "Finanzierung, Rendite, Tragbarkeit, Risiken und vier Strategien.",
    status: "Bereit"
  }
];

export default function SystemstatusPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        ← Zurück zum Dashboard
      </Link>

      <div className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Phase 1 · Schritt 1
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Datenmodelle und Validierung
        </h1>

        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Die fachliche Grundlage der Analyseplattform ist eingerichtet.
          Alle weiteren Berechnungs-, Risiko- und Strategiekomponenten
          verwenden diese zentralen Datenmodelle.
        </p>
      </div>

      <section className="mt-10 grid gap-5 md:grid-cols-2">
        {modules.map((module) => (
          <article
            key={module.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold">
                {module.title}
              </h2>

              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                {module.status}
              </span>
            </div>

            <p className="mt-3 leading-7 text-slate-600">
              {module.description}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-2xl bg-slate-950 p-7 text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Nächster Entwicklungsschritt
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Schritt 2: Berechnungs-Engine
        </h2>

        <p className="mt-3 max-w-3xl leading-7 text-slate-300">
          Als Nächstes folgen Kaufnebenkosten, Darlehenssumme,
          Monatsrate, Restschuld, Rendite, Cashflow,
          Belastungsquote und Eigenkapitalreserve.
        </p>
      </section>
    </main>
  );
}
