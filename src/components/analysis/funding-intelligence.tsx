"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Landmark, RefreshCw } from "lucide-react";
import type { AnalysisInput } from "@/features/analysis/domain";
import type { FundingMatch } from "@/features/funding/agent";
import { FeedbackState } from "@/components/ui/feedback-state";
import { StatusBadge } from "@/components/ui/status-badge";

export type FundingResponse = {
  matches: FundingMatch[];
  supervisor: { summary: string; conflicts: string[]; warning: string };
};

const eur = (value: number) => value.toLocaleString("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

export function FundingIntelligence({ input, onLoaded }: { input: AnalysisInput; onLoaded?: (data: FundingResponse) => void }) {
  const [data, setData] = useState<FundingResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage("");
    fetch("/api/funding/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
      .then(async (response) => {
        const body = await response.json() as FundingResponse & { message?: string };
        if (!response.ok) throw new Error(body.message ?? "Förderprüfung nicht verfügbar.");
        if (active) {
          setData(body);
          onLoaded?.(body);
        }
      })
      .catch((error) => {
        if (active) setMessage(error instanceof Error ? error.message : "Förderprüfung nicht verfügbar.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [input, onLoaded]);

  return (
    <article id="offizielle-foerderungen" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint text-teal dark:bg-teal-950 dark:text-teal-200"><Landmark size={21} aria-hidden="true" /></span>
        <div><h3 className="font-bold text-ink dark:text-white">Aktuelle offizielle Förderprüfung</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">KfW- und Landesprogramme aus versionierten offiziellen Quellen.</p></div>
      </div>

      {loading ? <div className="mt-5"><FeedbackState kind="loading" title="Offizielle Förderdaten werden geprüft" description="Programme werden mit deinen Angaben abgeglichen." /></div> : null}
      {!loading && message ? <div className="mt-5"><FeedbackState kind="error" title="Förderprüfung nicht verfügbar" description={message} /></div> : null}

      {!loading && data ? (
        <>
          <p className="mt-5 rounded-2xl bg-cloud p-4 text-sm font-semibold leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{data.supervisor.summary}</p>
          {data.matches.length ? (
            <div className="mt-4 space-y-4">
              {data.matches.map(({ program, status, openRequirements, estimatedFirstYearInterestAdvantage }) => (
                <section key={`${program.providerId}-${program.programId}`} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="text-xs font-black uppercase tracking-[0.14em] text-teal dark:text-teal-300">{program.providerId} · Programm {program.programId}</p><h4 className="mt-1 font-bold text-ink dark:text-white">{program.programName}</h4></div>
                    <StatusBadge tone={status === "matching" ? "positive" : "caution"}>{status === "matching" ? "Passend" : "Angaben prüfen"}</StatusBadge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{program.description}</p>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {program.maximumFunding.amount !== null ? <div className="rounded-xl bg-cloud p-3 dark:bg-slate-800"><dt className="text-xs text-slate-500 dark:text-slate-400">Maximale Förderung laut Quelle</dt><dd className="mt-1 font-bold text-ink dark:text-white">{eur(program.maximumFunding.amount)}</dd></div> : null}
                    {estimatedFirstYearInterestAdvantage !== null ? <div className="rounded-xl bg-cloud p-3 dark:bg-slate-800"><dt className="text-xs text-slate-500 dark:text-slate-400">Geschätzter Zinsvorteil im ersten Jahr</dt><dd className="mt-1 font-bold text-ink dark:text-white">{eur(estimatedFirstYearInterestAdvantage)}</dd></div> : null}
                  </dl>
                  <details className="group mt-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-ink dark:text-white"><span>Voraussetzungen, Antrag und Dokumente</span><span className="text-teal group-open:hidden">Öffnen</span><span className="hidden text-teal group-open:inline">Schließen</span></summary>
                    <div className="border-t border-slate-200 px-4 py-4 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:text-slate-300"><p>{program.applicationProcess}</p><p className="mt-2"><strong>Frist:</strong> {program.applicationDeadline}</p>{openRequirements.map((item) => <p key={item} className="mt-2"><strong>Noch offen:</strong> {item}</p>)}{program.requiredDocuments.length ? <div className="mt-3"><strong>Unterlagen:</strong><ul className="mt-1 space-y-1">{program.requiredDocuments.map((item) => <li key={item}>• {item}</li>)}</ul></div> : null}</div>
                  </details>
                  <div className="mt-4 flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>Quelle aktualisiert: {new Date(program.lastUpdated).toLocaleDateString("de-DE")}</span><a href={program.officialSource} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-bold text-teal hover:underline dark:text-teal-300">Offizielle Quelle <ExternalLink size={14} aria-hidden="true" /></a></div>
                </section>
              ))}
            </div>
          ) : <div className="mt-5"><FeedbackState kind="empty" title="Kein passendes Programm gefunden" description="Ergänze Bundesland, Nutzung, Kinder, Einkommen und Sanierungsangaben für einen vollständigeren Abgleich." /></div>}
          {data.supervisor.conflicts.map((conflict) => <p key={conflict} className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100"><strong>Möglicher Konflikt:</strong> {conflict}</p>)}
          <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400"><RefreshCw className="mt-0.5 shrink-0" size={14} aria-hidden="true" />{data.supervisor.warning} Finanzielle Auswirkungen sind Schätzungen auf Basis deiner Eingaben.</p>
        </>
      ) : null}
    </article>
  );
}
