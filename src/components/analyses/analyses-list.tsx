"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export function AnalysesList() {
  const router = useRouter();
  const [local, setLocal] = useState<SavedAnalysis[]>([]);
  const [cloud, setCloud] = useState<CloudAnalysis[]>([]);
  const [cloudMessage, setCloudMessage] = useState("");

  useEffect(() => {
    setLocal(readLocalAnalyses());

    fetch("/api/analyses")
      .then(async (response) => {
        const data = await response.json() as {
          ok: boolean;
          analyses?: CloudAnalysis[];
          error?: string;
        };
        if (response.ok && data.analyses) {
          setCloud(data.analyses);
        } else if (data.error === "unauthorized") {
          setCloudMessage("Für Cloud-Analysen anmelden.");
        } else if (data.error === "not_configured") {
          setCloudMessage("Supabase ist noch nicht konfiguriert.");
        }
      })
      .catch(() => setCloudMessage("Cloud-Analysen konnten nicht geladen werden."));
  }, []);

  const open = (analysis: SavedAnalysis) => {
    setActiveAnalysis(analysis);
    router.push("/analyse");
  };

  const remove = (id: string) => {
    deleteLocalAnalysis(id);
    setLocal(readLocalAnalyses());
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Verlauf</p>
      <h1 className="mt-3 text-4xl font-bold">Gespeicherte Analysen</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
        Lokale Analysen funktionieren ohne Konto. Mit Supabase-Anmeldung können Ergebnisse zusätzlich geräteübergreifend gespeichert werden.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Auf diesem Gerät</h2>
        <div className="mt-5 space-y-4">
          {local.length ? local.map((analysis) => (
            <article key={analysis.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-bold">{analysis.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(analysis.createdAt).toLocaleString("de-DE")} · Risiko {analysis.result.overallRiskLevel}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => open(analysis)} className="rounded-xl bg-slate-950 px-4 py-2 font-bold text-white">Öffnen</button>
                <button onClick={() => remove(analysis.id)} className="rounded-xl border border-slate-300 px-4 py-2 font-bold">Löschen</button>
              </div>
            </article>
          )) : (
            <p className="rounded-2xl bg-slate-100 p-5 text-slate-600">Keine lokalen Analysen vorhanden.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Supabase Cloud</h2>
        {cloudMessage ? <p className="mt-3 text-sm text-slate-600">{cloudMessage}</p> : null}
        <div className="mt-5 space-y-4">
          {cloud.map((analysis) => {
            const converted: SavedAnalysis = {
              id: analysis.id,
              title: analysis.title,
              createdAt: analysis.created_at,
              input: analysis.input_snapshot,
              result: analysis.result_snapshot,
              aiSummary: analysis.ai_summary ?? undefined
            };
            return (
              <article key={analysis.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-bold">{analysis.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{new Date(analysis.created_at).toLocaleString("de-DE")}</p>
                </div>
                <button onClick={() => open(converted)} className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white">Öffnen</button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
