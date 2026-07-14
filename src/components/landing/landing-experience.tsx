"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BarChart3, Building2, Check, CheckCircle2, SearchCheck, ShieldCheck, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

const goals = [
  { id: "buy", href: "/analyse?goal=buy", icon: Building2, title: "Immobilie kaufen", description: "Finde heraus, welcher Kauf zu deinem Haushalt und Budget passt." },
  { id: "wealth", href: "/analyse?goal=wealth", icon: BarChart3, title: "Vermögen aufbauen", description: "Ordne Rendite, Cashflow und Risiken einer Kapitalanlage ein." },
  { id: "analyse", href: "/analyse?goal=analyse", icon: SearchCheck, title: "Immobilie analysieren", description: "Prüfe ein konkretes Objekt Schritt für Schritt." }
] as const;

export function LandingExperience() {
  const [selected, setSelected] = useState<(typeof goals)[number]["id"]>("buy");
  const [thinking, setThinking] = useState(false);
  const current = goals.find((goal) => goal.id === selected) ?? goals[0];

  function chooseGoal(id: (typeof goals)[number]["id"]) {
    setSelected(id);
    setThinking(true);
    window.setTimeout(() => setThinking(false), 650);
  }

  return (
    <main>
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <h1 className="text-balance text-5xl font-black leading-[0.98] tracking-[-0.055em] text-ink dark:text-white sm:text-6xl lg:text-7xl">Immobilien verstehen. Sicher entscheiden.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">Für Erstkäufer und private Investoren: wenige verständliche Fragen, nachvollziehbare Berechnungen und ein klarer nächster Schritt.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><ButtonLink href="/analyse" size="lg">Jetzt kostenlos starten <ArrowRight size={19} /></ButtonLink><Link href="#so-funktionierts" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-ink transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800">So funktioniert’s <ArrowRight size={17} /></Link></div>
            <p className="mt-5 flex items-center gap-2 text-sm text-slate-500"><ShieldCheck size={17} className="text-teal" />Keine Kreditkarte erforderlich</p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900">
            <div className="grid lg:grid-cols-[180px_minmax(0,1fr)]">
              <div className="border-b border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900 lg:border-b-0 lg:border-r"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Dein Weg</p><ol className="mt-5 grid gap-5 text-sm">{["Ziel definieren", "Immobilie", "Haushalt", "Finanzierung", "Ergebnis"].map((label, index) => <li key={label} className={index === 0 ? "flex items-center gap-3 font-bold text-teal" : "flex items-center gap-3 text-slate-400"}><span className={index === 0 ? "grid h-7 w-7 place-items-center rounded-full bg-teal text-xs text-white" : "grid h-7 w-7 place-items-center rounded-full bg-slate-200 text-xs dark:bg-slate-700"}>{index + 1}</span>{label}</li>)}</ol><div className="mt-8 rounded-2xl border border-teal-100 bg-white p-3 dark:border-teal-900 dark:bg-slate-950"><div className="flex items-center gap-2 text-xs font-bold text-teal"><Sparkles size={14} className={thinking ? "animate-pulse" : ""} />KI-Assistent</div><p className="mt-2 text-xs leading-5 text-slate-500">{thinking ? "Dein Ziel wird eingeordnet …" : "Bereit für deine Auswahl."}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full bg-teal transition-all duration-700 ${thinking ? "w-4/5" : "w-1/4"}`} /></div></div></div>
              <div className="p-5 sm:p-7"><div className="flex items-center justify-between gap-4"><p className="text-sm font-bold text-slate-500">Schritt 1 von 5</p><p className="text-sm font-bold text-teal">20 %</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"><div className="h-full w-1/5 rounded-full bg-teal transition-all" /></div><h2 className="mt-7 text-2xl font-black text-ink dark:text-white">Was möchtest du erreichen?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Warum wichtig: Dein Ziel bestimmt, welche Fragen und Ergebnisse du wirklich brauchst.</p><div className="mt-5 grid gap-3">{goals.map((goal) => { const Icon = goal.icon; const active = goal.id === selected; return <button key={goal.id} type="button" aria-pressed={active} onClick={() => chooseGoal(goal.id)} className={active ? "group flex items-center gap-4 rounded-2xl border-2 border-teal bg-mint/50 p-4 text-left transition hover:-translate-y-0.5 dark:bg-teal-950/50" : "group flex items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-sm dark:border-slate-700"}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-teal shadow-sm dark:bg-slate-900"><Icon size={21} /></span><span className="min-w-0 flex-1"><span className="block font-bold text-ink dark:text-white">{goal.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{goal.description}</span></span><span className={active ? "grid h-6 w-6 place-items-center rounded-full bg-teal text-white" : "h-6 w-6 rounded-full border border-slate-300"}>{active ? <Check size={14} /> : null}</span></button>; })}</div><div className="mt-6 flex items-center justify-between gap-4"><p className="text-sm text-slate-500">Als Nächstes: Objekt und Standort.</p><ButtonLink href={current.href} size="sm">Weiter <ArrowRight size={17} /></ButtonLink></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950 sm:py-20" aria-labelledby="goals-title"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="text-center"><h2 id="goals-title" className="text-3xl font-black tracking-tight text-ink dark:text-white sm:text-4xl">Wähle dein Ziel</h2><p className="mt-3 text-lg text-slate-600 dark:text-slate-300">Die nächsten Fragen passen sich deiner Entscheidung an.</p></div><div className="mt-10 grid gap-4 lg:grid-cols-3">{goals.map((goal) => { const Icon = goal.icon; return <Link key={goal.id} href={goal.href} className="group flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-teal hover:shadow-soft dark:border-slate-700 dark:bg-slate-900"><Icon size={34} className="text-teal" /><h3 className="mt-8 text-xl font-black text-ink dark:text-white">{goal.title}</h3><p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{goal.description}</p><span className="mt-auto pt-6 inline-flex items-center gap-2 text-sm font-bold text-teal">Auswählen <ArrowRight size={17} className="transition group-hover:translate-x-1" /></span></Link>; })}</div></div></section>

      <section id="so-funktionierts" className="scroll-mt-24 border-y border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900 sm:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="text-center"><h2 className="text-3xl font-black tracking-tight text-ink dark:text-white sm:text-4xl">So funktioniert’s</h2><p className="mt-3 text-lg text-slate-600 dark:text-slate-300">Drei klare Schritte bis zur fundierten Entscheidung.</p></div><ol className="mt-12 grid gap-8 lg:grid-cols-3">{[["1", "Ziel und Rahmen verstehen", "Du beantwortest nur die Fragen, die für dein Vorhaben wichtig sind."], ["2", "Optionen und Szenarien prüfen", "Berechnungen und Annahmen werden transparent voneinander getrennt."], ["3", "Entscheiden und sicher handeln", "Du erhältst eine klare Einordnung und konkrete nächste Schritte."]].map(([number, title, text]) => <li key={number} className="relative pt-12"><span className="absolute left-0 top-0 grid h-9 w-9 place-items-center rounded-full bg-mint font-black text-teal dark:bg-teal-950">{number}</span><h3 className="text-lg font-black text-ink dark:text-white">{title}</h3><p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{text}</p></li>)}</ol></div></section>

      <section className="bg-ink py-16 text-white sm:py-20"><div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8"><div><h2 className="text-3xl font-black tracking-tight sm:text-4xl">KI erklärt. Berechnungen bleiben nachvollziehbar.</h2><p className="mt-5 max-w-xl leading-7 text-slate-300">Die KI erklärt, was gerade passiert, warum ein Ergebnis wichtig ist und welcher Schritt als Nächstes sinnvoll ist.</p><ul className="mt-6 grid gap-3">{["Berechnungen bleiben überprüfbar", "Fakten und Annahmen sind getrennt", "Erklärungen sind in klarer Sprache"].map((item) => <li key={item} className="flex items-center gap-3 text-sm text-slate-200"><CheckCircle2 size={18} className="text-teal-200" />{item}</li>)}</ul></div><div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7"><div className="flex items-center justify-between"><p className="flex items-center gap-2 font-bold"><Sparkles size={18} className="text-teal-200" />KI-Erklärung</p><span className="flex items-center gap-2 text-xs text-teal-200"><span className="h-2 w-2 animate-pulse rounded-full bg-teal-300" />Bereit</span></div><div className="mt-5 grid gap-3">{["Kaufpreis wird eingeordnet", "Monatliche Tragbarkeit wird geprüft", "Risiken werden verständlich priorisiert"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl bg-white/5 p-4"><span className={index === 0 ? "grid h-7 w-7 place-items-center rounded-full bg-teal text-xs font-black" : "grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs font-black"}>{index + 1}</span><span className="text-sm text-slate-200">{item}</span></div>)}</div></div></div></section>
    </main>
  );
}

