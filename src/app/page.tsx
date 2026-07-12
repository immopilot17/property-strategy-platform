"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, FileText, Home, Link2, PenLine, Target, X } from "lucide-react";

type EntryMode = "property" | "strategy";

const propertyOptions = [
  { value: "link", title: "Immobilienlink einfügen", description: "Daten aus einem Online-Angebot übernehmen.", icon: Link2 },
  { value: "expose", title: "Exposé verwenden", description: "Angaben aus deinem Exposé übernehmen.", icon: FileText },
  { value: "manual", title: "Immobilie manuell erfassen", description: "Die wichtigsten Objektdaten selbst eingeben.", icon: PenLine }
];

export default function HomePage() {
  const [mode, setMode] = useState<EntryMode | null>(null);
  const [selection, setSelection] = useState("");
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mode) return;
    dialog.current?.focus();
    const close = (event: KeyboardEvent) => event.key === "Escape" && setMode(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mode]);

  function begin(selectedMode: EntryMode) {
    setMode(selectedMode);
    setSelection(selectedMode === "strategy" ? "plan" : "");
  }

  function continueFlow() {
    window.location.assign(mode === "strategy" ? "/analyse?entry=strategy" : `/analyse?entry=${selection}`);
  }

  return (
    <main className="bg-white">
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl">
            Deine Immobilie verstehen. Deine Strategie sicher planen.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            Wir führen dich Schritt für Schritt durch deine persönliche Situation und zeigen verständlich, was zu dir passt – vom ersten Objekt bis zum langfristigen Vermögensaufbau.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <button type="button" onClick={() => begin("property")} className="group rounded-3xl border border-slate-200 bg-slate-50 p-7 text-left transition hover:border-emerald-500 hover:bg-emerald-50/40 focus:outline-none focus:ring-4 focus:ring-emerald-200 sm:p-9">
            <Home className="text-emerald-700" size={30} aria-hidden="true" />
            <h2 className="mt-6 text-2xl font-bold text-slate-950">Immobilie analysieren</h2>
            <p className="mt-3 leading-7 text-slate-600">Du hast bereits ein Objekt und möchtest wissen, ob es zu deiner finanziellen Situation passt.</p>
            <span className="mt-7 inline-flex items-center gap-2 font-bold text-emerald-700">Analyse beginnen <ArrowRight size={18} className="transition group-hover:translate-x-1" /></span>
          </button>

          <button type="button" onClick={() => begin("strategy")} className="group rounded-3xl border border-slate-200 bg-white p-7 text-left transition hover:border-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 sm:p-9">
            <Target className="text-slate-800" size={30} aria-hidden="true" />
            <h2 className="mt-6 text-2xl font-bold text-slate-950">Persönliche Strategie erstellen</h2>
            <p className="mt-3 leading-7 text-slate-600">Du suchst noch und möchtest deinen möglichen Kaufpreis, deine sinnvolle Rate und die nächsten Schritte kennen.</p>
            <span className="mt-7 inline-flex items-center gap-2 font-bold text-slate-800">Strategie planen <ArrowRight size={18} className="transition group-hover:translate-x-1" /></span>
          </button>
        </div>

        <p className="mt-8 text-sm leading-6 text-slate-500">Keine Vorkenntnisse nötig. Angaben können später ergänzt oder geändert werden.</p>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">Verstehen, bevor du entscheidest</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">Die Plattform ist kein Immobilienportal und kein Kreditvermittler. Sie hilft dir, deine Möglichkeiten, Risiken und nächsten Schritte nachvollziehbar einzuordnen.</p>
          </div>
          <div className="mt-9 grid gap-8 md:grid-cols-3">
            <article>
              <h3 className="text-lg font-bold text-slate-950">Schritt für Schritt</h3>
              <p className="mt-2 leading-7 text-slate-600">Du siehst immer nur die Information, die für deine nächste Entscheidung wichtig ist.</p>
            </article>
            <article>
              <h3 className="text-lg font-bold text-slate-950">Zahlen mit Erklärung</h3>
              <p className="mt-2 leading-7 text-slate-600">Berechnungen basieren auf deinen Eingaben. Annahmen und Schätzungen werden klar gekennzeichnet.</p>
            </article>
            <article>
              <h3 className="text-lg font-bold text-slate-950">Orientierung statt Verkaufsdruck</h3>
              <p className="mt-2 leading-7 text-slate-600">Du erhältst Chancen, Risiken und konkrete nächste Schritte – verständlich und ohne versteckte Empfehlung.</p>
            </article>
          </div>
        </div>
      </section>

      {mode ? (
        <div role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setMode(null)} className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="entry-title" tabIndex={-1} className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl outline-none sm:max-w-2xl sm:rounded-3xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm font-bold text-emerald-700">Schritt 1 von 6</p><h2 id="entry-title" className="mt-2 text-2xl font-bold text-slate-950">{mode === "property" ? "Wie möchtest du deine Immobilie erfassen?" : "Möchtest du deinen persönlichen Strategieplan starten?"}</h2></div>
              <button type="button" onClick={() => setMode(null)} aria-label="Dialog schließen" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"><X /></button>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-1/6 rounded-full bg-emerald-600" /></div>
            <p className="mt-5 leading-7 text-slate-600">{mode === "property" ? "Damit vermeiden wir unnötige Eingaben. Du kannst alle übernommenen Daten später prüfen." : "Wir fragen nur die wichtigsten Angaben ab, um Kaufpreis, Eigenkapital und Monatsrate verständlich einzuordnen."}</p>

            <div className="mt-6 space-y-3">
              {(mode === "property" ? propertyOptions : [{ value: "plan", title: "Strategie Schritt für Schritt erstellen", description: "Dauert nur wenige Minuten und kann jederzeit unterbrochen werden.", icon: Target }]).map((option) => {
                const Icon = option.icon;
                return <button key={option.value} type="button" onClick={() => setSelection(option.value)} className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left focus:outline-none focus:ring-4 focus:ring-emerald-200 ${selection === option.value ? "border-emerald-600 bg-emerald-50" : "border-slate-200 hover:border-slate-400"}`}>
                  <Icon size={22} className="mt-0.5 shrink-0 text-emerald-700" /><span><strong className="block text-slate-950">{option.title}</strong><span className="mt-1 block text-sm leading-6 text-slate-600">{option.description}</span></span>
                </button>;
              })}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setMode(null)} className="rounded-xl px-5 py-3 font-bold text-slate-600 hover:bg-slate-100">Zurück</button>
              <button type="button" onClick={continueFlow} disabled={!selection} className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-40">Weiter</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
