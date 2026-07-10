import Link from "next/link";

const cards = [
  ["Finanzprofil", "Einkommen, Eigenkapital und Fixkosten", "/dashboard/finanzen"],
  ["Immobilien", "Objekte erfassen und vergleichen", "/dashboard/immobilien"],
  ["Strategien", "Sicher, ausgewogen, maximal, alternativ", "/dashboard/strategien"],
  ["Förderungen", "KfW und weitere Programme", "/dashboard/foerderungen"],
  ["Steuer", "Steuerliche Hinweise und Szenarien", "/dashboard/steuer"],
  ["Risiken", "Finanzielle und objektspezifische Risiken", "/dashboard/risiken"]
];

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Dashboard
          </p>
          <h1 className="mt-2 text-4xl font-bold">Deine Immobilienstrategie</h1>
        </div>
        <Link href="/schnellcheck" className="rounded-xl bg-slate-950 px-5 py-3 text-white">
          Neue Analyse
        </Link>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map(([title, text, href]) => (
          <Link key={title} href={href} className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-slate-600">{text}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
