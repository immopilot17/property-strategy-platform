"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Cloud, HardDrive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackState } from "@/components/ui/feedback-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  deleteLocalAnalysis,
  readLocalAnalyses,
  setActiveAnalysis,
  type SavedAnalysis
} from "@/lib/storage/analyses";

type CloudAnalysis = {
  id: string;
  title: string;
  created_at: string;
  input_snapshot: SavedAnalysis["input"];
  result_snapshot: SavedAnalysis["result"];
  ai_summary?: string | null;
};

const riskStatus = {
  low: { label: "Empfehlenswert", tone: "positive" as const },
  medium: { label: "Mit Vorsicht", tone: "caution" as const },
  high: { label: "Nicht empfehlenswert", tone: "negative" as const },
  critical: { label: "Nicht empfehlenswert", tone: "negative" as const }
};

function AnalysisCard({ analysis, cloud, onOpen, onRemove }: { analysis: SavedAnalysis; cloud?: boolean; onOpen: () => void; onRemove?: () => void }) {
  const status = riskStatus[analysis.result.overallRiskLevel];
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-lg font-bold text-ink dark:text-white">{analysis.title}</h3><StatusBadge tone={status.tone}>{status.label}</StatusBadge></div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{new Date(analysis.createdAt).toLocaleString("de-DE")} · {cloud ? "Im Konto gespeichert" : "Auf diesem Gerät"}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-300"><span><strong>{analysis.result.purchaseCosts.totalInvestmentCosts.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}</strong> Gesamtinvestition</span><span><strong>{analysis.result.financing.monthlyLoanRate.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}</strong> Rate</span></div>
        </div>
        <div className="flex shrink-0 gap-2">
          {onRemove ? <Button variant="ghost" size="sm" onClick={onRemove} aria-label={`${analysis.title} löschen`}><Trash2 size={16} aria-hidden="true" /></Button> : null}
          <Button size="sm" onClick={onOpen}>Öffnen <ArrowRight size={16} aria-hidden="true" /></Button>
        </div>
      </div>
    </article>
  );
}

export function AnalysesList() {
  const router = useRouter();
  const [local, setLocal] = useState<SavedAnalysis[]>([]);
  const [cloud, setCloud] = useState<CloudAnalysis[]>([]);
  const [localReady, setLocalReady] = useState(false);
  const [cloudLoading, setCloudLoading] = useState(true);
  const [cloudMessage, setCloudMessage] = useState("");

  useEffect(() => {
    setLocal(readLocalAnalyses());
    setLocalReady(true);
    fetch("/api/analyses")
      .then(async (response) => {
        const data = await response.json() as { ok: boolean; analyses?: CloudAnalysis[]; error?: string };
        if (response.ok && data.analyses) setCloud(data.analyses);
        else if (data.error === "unauthorized") setCloudMessage("Melde dich an, um geräteübergreifend gespeicherte Analysen zu sehen.");
        else if (data.error === "not_configured") setCloudMessage("Die Kontospeicherung ist noch nicht eingerichtet.");
      })
      .catch(() => setCloudMessage("Gespeicherte Konto-Analysen konnten nicht geladen werden."))
      .finally(() => setCloudLoading(false));
  }, []);

  const open = (analysis: SavedAnalysis) => {
    setActiveAnalysis(analysis);
    router.push("/analyse");
  };

  const remove = (id: string) => {
    if (!window.confirm("Diese lokale Analyse wirklich löschen?")) return;
    deleteLocalAnalysis(id);
    setLocal(readLocalAnalyses());
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal dark:text-teal-300">Deine Entscheidungen</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-ink dark:text-white sm:text-5xl">Gespeicherte Analysen</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">Öffne ein Ergebnis erneut oder setze deine Entscheidung mit den gespeicherten Angaben fort.</p>
      </header>

      <section className="mt-10" aria-labelledby="local-title">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-teal dark:bg-teal-950 dark:text-teal-200"><HardDrive size={19} aria-hidden="true" /></span><div><h2 id="local-title" className="text-xl font-bold text-ink dark:text-white">Auf diesem Gerät</h2><p className="text-sm text-slate-500 dark:text-slate-400">Ohne Anmeldung verfügbar</p></div></div>
        <div className="mt-5 space-y-3">
          {!localReady ? <FeedbackState kind="loading" title="Lokale Analysen werden geladen" /> : local.length ? local.map((analysis) => <AnalysisCard key={analysis.id} analysis={analysis} onOpen={() => open(analysis)} onRemove={() => remove(analysis.id)} />) : <FeedbackState kind="empty" title="Noch keine Analyse gespeichert" description="Nach deiner ersten kostenlosen Analyse erscheint das Ergebnis hier." />}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="cloud-title">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-teal dark:bg-teal-950 dark:text-teal-200"><Cloud size={19} aria-hidden="true" /></span><div><h2 id="cloud-title" className="text-xl font-bold text-ink dark:text-white">In deinem Konto</h2><p className="text-sm text-slate-500 dark:text-slate-400">Geräteübergreifend gespeichert</p></div></div>
        <div className="mt-5 space-y-3">
          {cloudLoading ? <FeedbackState kind="loading" title="Konto-Analysen werden geladen" /> : cloudMessage ? <FeedbackState kind="empty" title="Keine Konto-Analysen verfügbar" description={cloudMessage} /> : cloud.length ? cloud.map((analysis) => {
            const converted: SavedAnalysis = { id: analysis.id, title: analysis.title, createdAt: analysis.created_at, input: analysis.input_snapshot, result: analysis.result_snapshot, aiSummary: analysis.ai_summary ?? undefined };
            return <AnalysisCard key={analysis.id} analysis={converted} cloud onOpen={() => open(converted)} />;
          }) : <FeedbackState kind="empty" title="Noch nichts im Konto gespeichert" description="Speichere ein Ergebnis aus der Analyseansicht, damit es hier erscheint." />}
        </div>
      </section>
    </main>
  );
}
