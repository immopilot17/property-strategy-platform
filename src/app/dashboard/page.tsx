import Link from "next/link";
import type { Route } from "next";

type DashboardCard = {
  title: string;
  text: string;
  href: Route;
};

const cards: DashboardCard[] = [
  {
    title: "Finanzprofil",
    text: "Einkommen, Eigenkapital und Fixkosten",
    href: "/dashboard/finanzen"
  },
  {
    title: "Immobilien",
    text: "Objekte erfassen und vergleichen",
    href: "/dashboard/immobilien"
  },
  {
    title: "Strategien",
    text: "Sicher, ausgewogen, maximal, alternativ",
    href: "/dashboard/strategien"
  },
  {
    title: "Förderungen",
    text: "KfW und weitere Programme",
    href: "/dashboard/foerderungen"
  },
  {
    title: "Steuer",
    text: "Steuerliche Hinweise und Szenarien",
    href: "/dashboard/steuer"
  },
  {
    title: "Risiken",
    text: "Finanzielle und objektspezifische Risiken",
    href: "/dashboard/risiken"
  }
];

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Dashboard
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Deine Immobilienstrategie
          </h1>
        </div>

        <Link
          href="/schnellcheck"
          className="rounded-xl bg-slate-950 px-5 py-3 text-white"
        >
          Neue Analyse
        </Link>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="text-xl font-semibold">{card.title}</h2>

            <p className="mt-2 text-slate-600">{card.text}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}