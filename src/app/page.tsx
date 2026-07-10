import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-3xl">
          <span className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
            Persönliche Immobilienstrategie
          </span>
          <h1 className="mt-8 text-5xl font-bold tracking-tight text-slate-950">
            Finde nicht nur heraus, ob du kaufen kannst – sondern wie du besser kaufst.
          </h1>
          <p className="mt-6 text-xl leading-8 text-slate-600">
            Die Plattform kombiniert Finanzierung, Förderungen, Steuerhinweise,
            Lagebewertung und Risiken zu mehreren konkreten Kaufstrategien.
          </p>
          <div className="mt-10 flex gap-4">
            <Link
              href="/schnellcheck"
              className="rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white"
            >
              Strategie starten
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-300 px-6 py-3 font-semibold"
            >
              Demo-Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            ["Finanzierung", "Bankfähig, tragbar und empfohlen klar getrennt."],
            ["Förderung & Steuer", "Passende Programme und steuerliche Hinweise."],
            ["Lage & Risiko", "Standort, Mietpotenzial und Risiken verständlich erklärt."]
          ].map(([title, text]) => (
            <article key={title} className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
