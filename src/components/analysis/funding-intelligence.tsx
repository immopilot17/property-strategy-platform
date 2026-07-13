"use client";

import { useEffect, useState } from "react";
import type { AnalysisInput } from "@/features/analysis/domain";
import type { FundingMatch } from "@/features/funding/agent";

export type FundingResponse = {
  matches: FundingMatch[];
  supervisor: { summary: string; conflicts: string[]; warning: string };
};

const eur = (value: number) => value.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function FundingIntelligence({ input, onLoaded }: { input: AnalysisInput; onLoaded?: (data: FundingResponse) => void }) {
  const [data, setData] = useState<FundingResponse | null>(null);
  const [message, setMessage] = useState("Offizielle Förderdaten werden geprüft …");

  useEffect(() => {
    let active = true;
    fetch("/api/funding/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) })
      .then(async (response) => {
        const body = await response.json() as FundingResponse & { message?: string };
        if (!response.ok) throw new Error(body.message ?? "Förderprüfung nicht verfügbar.");
        if (active) { setData(body); setMessage(""); onLoaded?.(body); }
      })
      .catch((error) => active && setMessage(error instanceof Error ? error.message : "Förderprüfung nicht verfügbar."));
    return () => { active = false; };
  }, [input, onLoaded]);

  return <article id="foerderungen" className="rounded-3xl border border-slate-200 bg-white p-6">
    <h2 className="text-xl font-bold">Aktuelle Förderprüfung</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">KfW- und Landesprogramme aus versionierten offiziellen Quellen.</p>
    {message ? <p className="mt-5 rounded-xl bg-slate-100 p-4 text-sm text-slate-600">{message}</p> : null}
    {data ? <>
      <p className="mt-5 font-medium text-slate-800">{data.supervisor.summary}</p>
      <div className="mt-4 space-y-4">{data.matches.map(({ program, status, openRequirements, estimatedFirstYearInterestAdvantage }) => (
        <section key={`${program.providerId}-${program.programId}`} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{program.providerId} · Programm {program.programId}</p><h3 className="mt-1 font-bold">{program.programName}</h3></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${status === "matching" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{status === "matching" ? "Passend" : "Angaben prüfen"}</span></div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{program.description}</p>
          {program.maximumFunding.amount !== null ? <p className="mt-3 text-sm">Maximale Förderung laut Quelle: <strong>{eur(program.maximumFunding.amount)}</strong></p> : null}
          {estimatedFirstYearInterestAdvantage !== null ? <p className="mt-2 text-sm">Geschätzter Zinsvorteil im ersten Jahr: <strong>{eur(estimatedFirstYearInterestAdvantage)}</strong></p> : null}
          <details className="mt-4 text-sm"><summary className="cursor-pointer font-bold">Voraussetzungen, Antrag und Dokumente</summary><div className="mt-3 space-y-2 leading-6 text-slate-600"><p>{program.applicationProcess}</p><p><strong>Frist:</strong> {program.applicationDeadline}</p>{openRequirements.map((item) => <p key={item}><strong>Offen:</strong> {item}</p>)}{program.requiredDocuments.map((item) => <p key={item}>• {item}</p>)}</div></details>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500"><span>Quelle aktualisiert: {new Date(program.lastUpdated).toLocaleDateString("de-DE")}</span><a href={program.officialSource} target="_blank" rel="noreferrer" className="font-bold text-emerald-700 underline">Offizielle Quelle</a></div>
        </section>
      ))}</div>
      {data.supervisor.conflicts.map((conflict) => <p key={conflict} className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><strong>Möglicher Konflikt:</strong> {conflict}</p>)}
      <p className="mt-5 text-xs leading-5 text-slate-500">{data.supervisor.warning} Finanzielle Auswirkungen sind Schätzungen auf Basis deiner Finanzierungseingaben.</p>
    </> : null}
  </article>;
}
