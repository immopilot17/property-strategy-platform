import Link from "next/link";

type DashboardSectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
};

export function DashboardSectionPage({
  eyebrow,
  title,
  description,
  items
}: DashboardSectionPageProps) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        ← Zurück zum Dashboard
      </Link>

      <div className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {eyebrow}
        </p>

        <h1 className="mt-2 text-4xl font-bold">{title}</h1>

        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          {description}
        </p>
      </div>

      <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">In diesem Bereich</h2>

        <ul className="mt-5 space-y-3">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-xl bg-slate-100 px-4 py-3 text-slate-700"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
