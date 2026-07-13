"use client";

import { useState } from "react";
import { ArrowRight, FileText, Image, Link2, PenLine, ShieldCheck } from "lucide-react";

export default function HomePage() {
  const [sourceUrl, setSourceUrl] = useState("");

  function startAnalysis() {
    const params = new URLSearchParams({ entry: "link" });
    if (sourceUrl.trim()) params.set("sourceUrl", sourceUrl.trim());
    window.location.assign(`/analyse?${params.toString()}`);
  }

  return (
    <main className="bg-white">
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl">Verstehe eine Immobilie, bevor du dich entscheidest.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">Füge einen Exposé-Link ein oder lade Unterlagen hoch. Wir erkennen die wichtigsten Angaben und zeigen dir Kosten, Finanzierung, Fördermöglichkeiten und Risiken verständlich.</p>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); startAnalysis(); }} className="mt-10 max-w-3xl rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-7">
          <label htmlFor="source-url" className="text-sm font-bold text-slate-800">Exposé-Link einfügen</label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-slate-300 bg-white px-4 focus-within:border-emerald-700 focus-within:ring-4 focus-within:ring-emerald-100">
              <Link2 className="mr-3 shrink-0 text-slate-400" size={20} aria-hidden="true" />
              <input id="source-url" type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://..." className="w-full py-4 outline-none" />
            </div>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200">Analyse starten <ArrowRight size={18} /></button>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
            <a href="/analyse?entry=expose" className="inline-flex items-center gap-2 text-slate-700 hover:text-emerald-700"><FileText size={17} /> PDF hochladen</a>
            <a href="/analyse?entry=image" className="inline-flex items-center gap-2 text-slate-700 hover:text-emerald-700"><Image size={17} /> Foto hochladen</a>
            <a href="/analyse?entry=manual" className="inline-flex items-center gap-2 text-slate-700 hover:text-emerald-700"><PenLine size={17} /> Ohne Unterlagen starten</a>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-500"><ShieldCheck size={17} className="text-emerald-700" /> Kostenlos starten. Du kannst Angaben jederzeit ändern.</p>
        </form>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl"><h2 className="text-3xl font-bold tracking-tight text-slate-950">Verstehen, bevor du entscheidest</h2><p className="mt-4 text-lg leading-8 text-slate-600">Die Plattform ist kein Immobilienportal und kein Kreditvermittler. Sie hilft dir, deine Möglichkeiten, Risiken und nächsten Schritte nachvollziehbar einzuordnen.</p></div>
          <div className="mt-9 grid gap-8 md:grid-cols-3">
            <article><h3 className="text-lg font-bold text-slate-950">Schritt für Schritt</h3><p className="mt-2 leading-7 text-slate-600">Du siehst immer nur die Information, die für deine nächste Entscheidung wichtig ist.</p></article>
            <article><h3 className="text-lg font-bold text-slate-950">Zahlen mit Erklärung</h3><p className="mt-2 leading-7 text-slate-600">Berechnungen basieren auf deinen Eingaben. Annahmen und Schätzungen werden klar gekennzeichnet.</p></article>
            <article><h3 className="text-lg font-bold text-slate-950">Orientierung statt Verkaufsdruck</h3><p className="mt-2 leading-7 text-slate-600">Du erhältst Chancen, Risiken und konkrete nächste Schritte – verständlich und ohne versteckte Empfehlung.</p></article>
          </div>
        </div>
      </section>
    </main>
  );
}
