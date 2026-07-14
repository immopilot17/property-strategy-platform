"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  Gauge,
  LayoutDashboard,
  Save,
  SearchCheck,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

const goals = [
  {
    id: "buy",
    icon: Building2,
    title: "Immobilie kaufen",
    description: "Finde heraus, welcher Kauf zu deinem Haushalt und Budget passt.",
    question: "Wie weit bist du bei deiner Suche?",
    options: [
      { id: "property", title: "Ich habe ein konkretes Objekt", description: "Objektdaten, Kaufpreis und Lage zuerst erfassen.", href: "/analyse?goal=buy&start=property" },
      { id: "budget", title: "Ich suche noch", description: "Zuerst deinen finanziellen Rahmen einordnen.", href: "/analyse?goal=buy&start=budget" }
    ]
  },
  {
    id: "wealth",
    icon: BarChart3,
    title: "Vermögen aufbauen",
    description: "Ordne Rendite, Cashflow und Risiken einer Kapitalanlage ein.",
    question: "Was möchtest du zuerst prüfen?",
    options: [
      { id: "property", title: "Rendite eines Objekts", description: "Mit Kaufpreis, Miete und Objektangaben starten.", href: "/analyse?goal=wealth&start=property" },
      { id: "budget", title: "Mein Investitionsbudget", description: "Mit Haushalt, Eigenkapital und tragbarer Rate starten.", href: "/analyse?goal=wealth&start=budget" }
    ]
  },
  {
    id: "analyse",
    icon: SearchCheck,
    title: "Immobilie analysieren",
    description: "Prüfe ein konkretes Objekt Schritt für Schritt.",
    question: "Wie möchtest du die Immobilie erfassen?",
    options: [
      { id: "link", title: "Inseratslink übernehmen", description: "Vorhandene Objektdaten automatisch erkennen und kontrollieren.", href: "/analyse?goal=analyse&start=link" },
      { id: "manual", title: "Daten manuell eingeben", description: "Die wichtigsten Angaben selbst Schritt für Schritt erfassen.", href: "/analyse?goal=analyse&start=manual" }
    ]
  }
] as const;

type GoalId = (typeof goals)[number]["id"];

export function LandingExperience() {
  const [selected, setSelected] = useState<GoalId | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const timerRef = useRef<number | null>(null);
  const current = goals.find((goal) => goal.id === selected) ?? null;
  const currentAnswer = current?.options.find((option) => option.id === answer) ?? null;
  const progress = currentAnswer ? 100 : current ? 55 : 15;

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  function showActivity() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setThinking(true);
    timerRef.current = window.setTimeout(() => setThinking(false), 550);
  }

  function chooseGoal(id: GoalId, moveToGuide = false) {
    setSelected(id);
    setAnswer(null);
    showActivity();
    if (moveToGuide) {
      window.requestAnimationFrame(() => document.getElementById("start")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" }));
    }
  }

  function chooseAnswer(id: string) {
    setAnswer(id);
    showActivity();
  }

  return (
    <main>
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <h1 className="text-balance text-5xl font-black leading-[0.98] tracking-[-0.055em] text-ink dark:text-white sm:text-6xl lg:text-7xl">Immobilien verstehen. Sicher entscheiden.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">Für Erstkäufer und private Investoren: wenige verständliche Fragen, nachvollziehbare Berechnungen und ein klarer nächster Schritt.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#start" size="lg">Analyse starten <ArrowRight size={19} /></ButtonLink>
              <Link href="#so-funktionierts" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-ink transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800">So funktioniert’s <ArrowRight size={17} /></Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-slate-500"><ShieldCheck size={17} className="text-teal" />Keine Kreditkarte erforderlich</p>
          </div>

          <div id="start" className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900">
            <div className="grid lg:grid-cols-[180px_minmax(0,1fr)]">
              <div className="border-b border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900 lg:border-b-0 lg:border-r">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Dein Start</p>
                <ol className="mt-5 grid gap-5 text-sm">
                  {["Ziel wählen", "Startpunkt klären", "Analyse beginnen"].map((label, index) => {
                    const complete = index === 0 ? Boolean(current) : index === 1 ? Boolean(currentAnswer) : false;
                    const active = index === 0 ? !current : index === 1 ? Boolean(current) && !currentAnswer : Boolean(currentAnswer);
                    return <li key={label} className={active || complete ? "flex items-center gap-3 font-bold text-teal" : "flex items-center gap-3 text-slate-400"}><span className={complete ? "grid h-7 w-7 place-items-center rounded-full bg-teal text-xs text-white" : active ? "grid h-7 w-7 place-items-center rounded-full border-2 border-teal bg-white text-xs text-teal dark:bg-slate-950" : "grid h-7 w-7 place-items-center rounded-full bg-slate-200 text-xs dark:bg-slate-700"}>{complete ? <Check size={14} /> : index + 1}</span>{label}</li>;
                  })}
                </ol>
                <div className="mt-8 rounded-2xl border border-teal-100 bg-white p-3 dark:border-teal-900 dark:bg-slate-950">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal"><Sparkles size={14} className={thinking ? "animate-pulse" : ""} />KI-Begleitung</div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{thinking ? "Deine Auswahl wird eingeordnet …" : currentAnswer ? "Dein passender Einstieg ist bereit." : current ? "Die nächste Frage ist für dich angepasst." : "Wähle zuerst dein Ziel."}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-teal transition-all duration-500" style={{ width: `${progress}%` }} /></div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="flex items-center justify-between gap-4"><p className="text-sm font-bold text-slate-500">{current ? "Schritt 2 von 3" : "Schritt 1 von 3"}</p><p className="text-sm font-bold text-teal">{progress} %</p></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"><div className="h-full rounded-full bg-teal transition-all duration-500" style={{ width: `${progress}%` }} /></div>
                <h2 className="mt-7 text-2xl font-black text-ink dark:text-white">Was möchtest du erreichen?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Dein Ziel bestimmt, welche Fragen und Ergebnisse du wirklich brauchst.</p>
                <div className="mt-5 grid gap-3">
                  {goals.map((goal) => {
                    const Icon = goal.icon;
                    const active = goal.id === selected;
                    return <button key={goal.id} type="button" aria-pressed={active} onClick={() => chooseGoal(goal.id)} className={active ? "group flex items-center gap-4 rounded-2xl border-2 border-teal bg-mint/50 p-4 text-left transition hover:-translate-y-0.5 dark:bg-teal-950/50" : "group flex items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-sm dark:border-slate-700"}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-teal shadow-sm dark:bg-slate-900"><Icon size={21} /></span><span className="min-w-0 flex-1"><span className="block font-bold text-ink dark:text-white">{goal.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{goal.description}</span></span><span className={active ? "grid h-6 w-6 place-items-center rounded-full bg-teal text-white" : "h-6 w-6 rounded-full border border-slate-300"}>{active ? <Check size={14} /> : null}</span></button>;
                  })}
                </div>

                {current ? (
                  <div key={current.id} className="mt-5 rounded-2xl border border-teal-100 bg-slate-50 p-4 dark:border-teal-900 dark:bg-slate-800/70" aria-live="polite">
                    <h3 className="font-black text-ink dark:text-white">{current.question}</h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {current.options.map((option) => {
                        const active = answer === option.id;
                        return <button key={option.id} type="button" aria-pressed={active} onClick={() => chooseAnswer(option.id)} className={active ? "rounded-xl border-2 border-teal bg-white p-3 text-left shadow-sm dark:bg-slate-900" : "rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-teal-300 dark:border-slate-700 dark:bg-slate-900"}><span className="block text-sm font-bold text-ink dark:text-white">{option.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span></button>;
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 flex min-h-10 items-center justify-between gap-4">
                  <p className="text-sm text-slate-500">{currentAnswer ? "Als Nächstes: Deine Angaben werden automatisch gespeichert." : current ? "Wähle jetzt deinen passenden Startpunkt." : "Wähle eine der drei Startoptionen."}</p>
                  {currentAnswer ? <ButtonLink href={currentAnswer.href} size="sm">Weiter <ArrowRight size={17} /></ButtonLink> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950 sm:py-20" aria-labelledby="goals-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center"><h2 id="goals-title" className="text-3xl font-black tracking-tight text-ink dark:text-white sm:text-4xl">Wähle deinen Einstieg</h2><p className="mt-3 text-lg text-slate-600 dark:text-slate-300">Nach deiner Auswahl erscheint automatisch die nächste passende Frage.</p></div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {goals.map((goal) => {
              const Icon = goal.icon;
              return <button key={goal.id} type="button" onClick={() => chooseGoal(goal.id, true)} className="group flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-7 text-left transition duration-300 hover:-translate-y-1 hover:border-teal hover:shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-visible:ring-teal-950"><Icon size={34} className="text-teal" /><span className="mt-8 text-xl font-black text-ink dark:text-white">{goal.title}</span><span className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{goal.description}</span><span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-teal">Auswählen <ArrowRight size={17} className="transition group-hover:translate-x-1" /></span></button>;
            })}
          </div>
        </div>
      </section>

      <section id="so-funktionierts" className="scroll-mt-24 border-y border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center"><h2 className="text-3xl font-black tracking-tight text-ink dark:text-white sm:text-4xl">So funktioniert’s</h2><p className="mt-3 text-lg text-slate-600 dark:text-slate-300">Drei klare Schritte bis zur fundierten Entscheidung.</p></div>
          <ol className="mt-12 grid gap-8 lg:grid-cols-3">{[["1", "Ziel und Rahmen verstehen", "Du beantwortest nur die Fragen, die für dein Vorhaben wichtig sind."], ["2", "Live berechnen und einordnen", "Die Calculation Engine aktualisiert Rate, Gesamtkosten und Liquidität mit deinen Eingaben."], ["3", "Entscheiden und sicher handeln", "Der Ergebnisbericht priorisiert Risiken und zeigt konkrete nächste Schritte."]].map(([number, title, text]) => <li key={number} className="relative pt-12"><span className="absolute left-0 top-0 grid h-9 w-9 place-items-center rounded-full bg-mint font-black text-teal dark:bg-teal-950">{number}</span><h3 className="text-lg font-black text-ink dark:text-white">{title}</h3><p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{text}</p></li>)}</ol>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div><h2 className="text-3xl font-black tracking-tight text-ink dark:text-white sm:text-4xl">Deine Entscheidung bleibt an einem Ort.</h2><p className="mt-5 max-w-xl leading-7 text-slate-600 dark:text-slate-300">Entwürfe werden automatisch gespeichert. Im persönlichen Dashboard setzt du Analysen fort, verwaltest Immobilien und öffnest Ergebnisse erneut.</p><div className="mt-7 flex flex-wrap gap-3"><ButtonLink href="/dashboard">Persönliches Dashboard <ArrowRight size={17} /></ButtonLink><ButtonLink href="/dashboard/properties" variant="secondary">Meine Immobilien</ButtonLink></div></div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-7">
            <div className="grid gap-3">
              {[{ icon: Gauge, title: "Live-Berechnungen", text: "Alle Zahlen stammen aus der vorhandenen Calculation Engine." }, { icon: Save, title: "Automatisch gespeichert", text: "Deine Eingaben bleiben als Entwurf auf diesem Gerät erhalten." }, { icon: LayoutDashboard, title: "Interaktiver Ergebnisbericht", text: "Details lassen sich schrittweise öffnen, vergleichen und erneut bearbeiten." }].map((item) => { const Icon = item.icon; return <div key={item.title} className="flex items-start gap-4 rounded-2xl bg-white p-4 dark:bg-slate-950"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mint text-teal dark:bg-teal-950"><Icon size={20} /></span><div><h3 className="font-bold text-ink dark:text-white">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p></div></div>; })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
          <div><h2 className="text-3xl font-black tracking-tight sm:text-4xl">KI erklärt. Die Calculation Engine rechnet.</h2><p className="mt-5 max-w-xl leading-7 text-slate-300">Die KI verändert keine Finanzwerte. Sie erklärt den berechneten Zwischenstand, priorisiert Hinweise und empfiehlt den nächsten sinnvollen Schritt.</p><ul className="mt-6 grid gap-3">{["Zahlen bleiben überprüfbar", "Fakten und Erklärungen sind getrennt", "Hinweise passen zum aktuellen Schritt"].map((item) => <li key={item} className="flex items-center gap-3 text-sm text-slate-200"><CheckCircle2 size={18} className="text-teal-200" />{item}</li>)}</ul></div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7"><div className="flex items-center justify-between"><p className="flex items-center gap-2 font-bold"><Sparkles size={18} className="text-teal-200" />Kontextbezogene KI-Hinweise</p><span className="flex items-center gap-2 text-xs text-teal-200"><span className="h-2 w-2 animate-pulse rounded-full bg-teal-300" />Bereit</span></div><div className="mt-5 grid gap-3">{["Was passiert gerade?", "Warum ist dieser Schritt wichtig?", "Was solltest du als Nächstes tun?"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl bg-white/5 p-4"><span className={index === 0 ? "grid h-7 w-7 place-items-center rounded-full bg-teal text-xs font-black" : "grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs font-black"}>{index + 1}</span><span className="text-sm text-slate-200">{item}</span></div>)}</div></div>
        </div>
      </section>
    </main>
  );
}
