import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto grid min-h-[75vh] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
            Immobilien klar entscheiden
          </p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight sm:text-6xl">
            Nicht nur finanzierbar. Strategisch sinnvoll.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Erfasse Haushalt, Immobilie und Finanzierung. Die Plattform berechnet Kaufkosten,
            Rate, Restschuld, Rendite, Cashflow, Risiken, Steuerorientierung und mehrere Kaufstrategien.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/analyse" className="rounded-2xl bg-emerald-600 px-6 py-4 font-bold text-white">
              Analyse starten
            </Link>
            <Link href="/dashboard" className="rounded-2xl border border-slate-300 px-6 py-4 font-bold">
              Dashboard öffnen
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-500">
            Grundberechnung ohne KI und ohne Konto nutzbar.
          </p>
        </div>

        <div className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Enthalten</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Finanzierung", "Rate, Darlehen, Restschuld und Beleihung"],
              ["Wirtschaftlichkeit", "Rendite, Cashflow und laufende Kosten"],
              ["Risiken", "Liquidität, Reserve, Sanierung und Zinsbindung"],
              ["Strategien", "Sicher, ausgewogen, maximal und alternativ"],
              ["Steuer", "Vereinfachte AfA- und Zinsorientierung"],
              ["KI optional", "Exposé-Import und verständliche Erklärung"]
            ].map(([title, text]) => (
              <article key={title} className="rounded-2xl bg-white/10 p-5">
                <h2 className="font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
