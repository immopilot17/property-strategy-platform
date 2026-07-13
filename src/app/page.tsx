import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ChartNoAxesCombined,
  CheckCircle2,
  Compass,
  SearchCheck,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

const entryPoints = [
  {
    href: "/analyse?goal=buy",
    icon: Building2,
    title: "Immobilie kaufen",
    description: "Prüfe, was zu deinem Haushalt passt und welche Rate langfristig tragbar ist."
  },
  {
    href: "/analyse?goal=wealth",
    icon: ChartNoAxesCombined,
    title: "Vermögen aufbauen",
    description: "Ordne Rendite, Cashflow, Steuern und Risiken einer Kapitalanlage realistisch ein."
  },
  {
    href: "/analyse?goal=analyse",
    icon: SearchCheck,
    title: "Immobilie analysieren",
    description: "Verstehe Kosten, Finanzierung, Förderungen und Risiken eines konkreten Objekts."
  }
];

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="app-grid absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-mint px-3 py-1.5 text-sm font-bold text-teal dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200">
              <ShieldCheck size={16} aria-hidden="true" /> Orientierung statt Verkaufsdruck
            </p>
            <h1 className="text-balance mt-6 text-4xl font-black leading-[1.05] tracking-[-0.045em] text-ink dark:text-white sm:text-6xl lg:text-7xl">
              Immobilien verstehen. Sicher entscheiden.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">
              Die anfängerfreundliche Entscheidungsplattform erklärt dir Finanzierung, Förderungen, Steuern und Risiken – mit transparenten Berechnungen statt Verkaufsinteressen.
            </p>
            <ButtonLink href="/analyse" size="lg" className="mt-8 w-full sm:w-auto">
              Jetzt kostenlos starten <ArrowRight size={19} aria-hidden="true" />
            </ButtonLink>
            <p className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <CheckCircle2 size={17} className="text-teal" aria-hidden="true" /> Die erste Immobilienanalyse bleibt kostenlos.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-cloud p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <div className="rounded-3xl bg-ink p-6 text-white sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">Deine Entscheidung</span>
                <Compass className="text-teal-200" size={24} aria-hidden="true" />
              </div>
              <p className="mt-8 text-sm text-slate-300">Wir beginnen mit deinem Ziel.</p>
              <p className="mt-2 text-2xl font-bold">Was möchtest du erreichen?</p>
              <div className="mt-6 space-y-3" aria-hidden="true">
                {entryPoints.map((item, index) => (
                  <div key={item.title} className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${index === 0 ? "border-teal-300 bg-teal-400/15" : "border-white/10 bg-white/5"}`}>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-sm font-bold">{index + 1}</span>
                    <span className="font-semibold">{item.title}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm leading-6 text-slate-300">Nur eine Frage pro Schritt. Du kannst jederzeit pausieren und später weitermachen.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cloud py-16 dark:bg-slate-900/70 sm:py-20" aria-labelledby="start-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal dark:text-teal-300">Dein Einstieg</p>
            <h2 id="start-title" className="mt-3 text-3xl font-black tracking-tight text-ink dark:text-white sm:text-4xl">Womit möchtest du beginnen?</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">Wähle ein Ziel. Die nächsten Fragen passen sich daran an.</p>
          </div>
          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            {entryPoints.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-soft focus-visible:outline-none dark:border-slate-700 dark:bg-slate-950 dark:hover:border-teal-700 sm:p-7">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-mint text-teal dark:bg-teal-950 dark:text-teal-200"><Icon size={24} aria-hidden="true" /></span>
                  <h3 className="mt-6 text-xl font-bold text-ink dark:text-white">{item.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-teal dark:text-teal-300">Auswählen <ArrowRight size={17} className="transition group-hover:translate-x-1" aria-hidden="true" /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="so-funktionierts" className="scroll-mt-24 border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal dark:text-teal-300">So funktioniert’s</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-ink dark:text-white sm:text-4xl">Von vielen Fragen zu einem klaren nächsten Schritt.</h2>
              <p className="mt-5 leading-7 text-slate-600 dark:text-slate-300">Wir sind kein Immobilienportal und kein Kreditvermittler. Deine Entscheidung steht im Mittelpunkt.</p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3">
              {[
                ["01", "Angaben erfassen", "Kurze, verständliche Fragen zu Ziel, Immobilie und Haushalt."],
                ["02", "Transparent prüfen", "Berechnungen, offizielle Förderquellen und Annahmen werden getrennt."],
                ["03", "Sicher entscheiden", "Du erhältst eine Einordnung und höchstens drei nächste Schritte."]
              ].map(([number, title, description]) => (
                <li key={number} className="rounded-3xl border border-slate-200 p-6 dark:border-slate-700">
                  <span className="text-sm font-black text-teal dark:text-teal-300">{number}</span>
                  <h3 className="mt-5 font-bold text-ink dark:text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-ink py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-400/15 text-teal-200"><Sparkles size={24} aria-hidden="true" /></span>
            <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">KI erklärt. Zahlen entscheiden.</h2>
            <p className="mt-5 max-w-xl leading-7 text-slate-300">Unsere KI erfindet keine Werte. Sie erklärt geprüfte Berechnungen, trennt Fakten von Annahmen und nennt die Aktualität verwendeter Quellen.</p>
          </div>
          <ul className="grid content-start gap-3">
            {["Deterministische Finanz- und Steuerberechnungen", "Offizielle Quellen für Förderinformationen", "Fakten, Annahmen und KI-Interpretation klar getrennt", "Keine versteckte Verkaufs- oder Kreditvermittlung"].map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3.5 text-sm leading-6 text-slate-200"><CheckCircle2 className="mt-0.5 shrink-0 text-teal-200" size={18} aria-hidden="true" />{item}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
