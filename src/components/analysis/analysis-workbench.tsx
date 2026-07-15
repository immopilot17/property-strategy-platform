"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalysisInput, FullAnalysisResult, PropertyProfile } from "@/features/analysis/domain";
import { defaultAnalysisInput } from "@/features/analysis/domain";
import { calculateAnalysis } from "@/features/analysis/calculations";
import {
  consumeActiveAnalysis,
  clearAnalysisDraft,
  readAnalysisDraft,
  readLocalAnalyses,
  saveAnalysisDraft,
  saveLocalAnalysis,
  type SavedAnalysis
} from "@/lib/storage/analyses";
import { AnalysisWizard } from "./analysis-wizard";
import { ResultPanel } from "./result-panel";

type ApiError = { field?: string; message: string };

export function AnalysisWorkbench() {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<AnalysisInput>(defaultAnalysisInput);
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [errors, setErrors] = useState<ApiError[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [cloudStatus, setCloudStatus] = useState("");
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [initialSourceUrl, setInitialSourceUrl] = useState("");
  const [analysisStatus, setAnalysisStatus] = useState("");
  const liveCalculation = useMemo(() => calculateAnalysis(input), [input]);

  useEffect(() => {
    const active = consumeActiveAnalysis();
    if (active) {
      setInput(active.input);
      setResult(active.result);
      setAiSummary(active.aiSummary ?? "");
      return;
    }
    const draft = readAnalysisDraft();
    if (draft) setInput(draft);
  }, []);

  useEffect(() => {
    saveAnalysisDraft(input);
  }, [input]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sourceUrl = params.get("sourceUrl");
    const selectedGoal = params.get("goal");
    const selectedStart = params.get("start");
    const requestedSection = window.location.hash.slice(1);
    const sectionStep: Record<string, number> = { immobilie: 2, finanzen: 3, finanzierung: 4 };
    const resultSections = new Set(["ergebnis", "risiken", "foerderungen", "strategien", "steuer"]);
    if (sectionStep[requestedSection]) setStep(sectionStep[requestedSection]);
    if (resultSections.has(requestedSection)) {
      const latest = readLocalAnalyses()[0];
      if (latest) {
        setInput(latest.input);
        setResult(latest.result);
        setAiSummary(latest.aiSummary ?? "");
        window.setTimeout(() => document.getElementById(requestedSection)?.scrollIntoView({ block: "start" }), 100);
      }
    }
    if (sourceUrl) {
      setInitialSourceUrl(sourceUrl);
      setInput((current) => ({ ...current, property: { ...current.property, sourceUrl } }));
      if (!sectionStep[requestedSection]) setStep(2);
    }
    if (selectedGoal === "buy" || selectedGoal === "wealth") {
      setInput((current) => ({
        ...current,
        user: {
          ...current.user,
          purchaseGoal: selectedGoal === "buy" ? "owner_occupation" : "capital_investment"
        }
      }));
    }
    if (!sourceUrl) {
      if (selectedStart === "budget") setStep(3);
      if (selectedStart === "property" || selectedStart === "manual") setStep(2);
      if (selectedStart === "link") {
        setStep(1);
        window.setTimeout(() => document.getElementById("immobilienlink-start")?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      }
    }
  }, []);

  const updateUser = <K extends keyof AnalysisInput["user"]>(key: K, value: AnalysisInput["user"][K]) => {
    setInput((current) => ({ ...current, user: { ...current.user, [key]: value } }));
  };

  const updateProperty = <K extends keyof AnalysisInput["property"]>(key: K, value: AnalysisInput["property"][K]) => {
    setInput((current) => ({ ...current, property: { ...current.property, [key]: value } }));
  };

  const updateFinancing = <K extends keyof AnalysisInput["financing"]>(key: K, value: AnalysisInput["financing"][K]) => {
    setInput((current) => ({ ...current, financing: { ...current.financing, [key]: value } }));
  };

  const updateSettings = <K extends keyof AnalysisInput["settings"]>(key: K, value: AnalysisInput["settings"][K]) => {
    setInput((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  };

  const updatePartner = <K extends keyof NonNullable<AnalysisInput["user"]["partner"]>>(
    key: K,
    value: NonNullable<AnalysisInput["user"]["partner"]>[K]
  ) => {
    setInput((current) => ({
      ...current,
      user: { ...current.user, partner: { ...current.user.partner!, [key]: value } }
    }));
  };

  const runAnalysis = async () => {
    setLoading(true);
    setAnalysisStatus("Deine Angaben werden geprüft und die Finanzierung wird berechnet.");
    setErrors([]);
    setCloudStatus("");
    try {
      const response = await fetch("/api/analysis/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      const data = await response.json() as {
        ok: boolean;
        result?: FullAnalysisResult;
        errors?: ApiError[];
        message?: string;
      };

      if (!response.ok || !data.result) {
        setErrors(data.errors ?? [{ message: data.message ?? "Analyse fehlgeschlagen." }]);
        setAnalysisStatus("Bitte prüfe die markierten Angaben.");
        return;
      }

      setResult(data.result);
      setAiSummary("");
      const saved: SavedAnalysis = {
        id: data.result.analysisId,
        title: input.property.title,
        createdAt: data.result.calculatedAt,
        input,
        result: data.result
      };
      saveLocalAnalysis(saved);
      clearAnalysisDraft();
      setAnalysisStatus("Analyse fertig. Dein Ergebnis ist auf diesem Gerät gespeichert.");
      window.setTimeout(() => document.getElementById("ergebnis")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      setErrors([{ message: "Die Analyse konnte nicht gestartet werden." }]);
      setAnalysisStatus("Die Analyse konnte nicht abgeschlossen werden.");
    } finally {
      setLoading(false);
    }
  };

  const explain = async () => {
    if (!result) return;
    setAiLoading(true);
    try {
      const response = await fetch("/api/analysis/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, result })
      });
      const data = await response.json() as { ok: boolean; explanation?: string; message?: string };
      if (!response.ok || !data.explanation) {
        setAiSummary(data.message ?? "KI-Erklärung nicht verfügbar.");
        return;
      }
      setAiSummary(data.explanation);
      saveLocalAnalysis({
        id: result.analysisId,
        title: input.property.title,
        createdAt: result.calculatedAt,
        input,
        result,
        aiSummary: data.explanation
      });
    } catch {
      setAiSummary("KI-Erklärung konnte nicht geladen werden.");
    } finally {
      setAiLoading(false);
    }
  };

  const saveCloud = async () => {
    if (!result) return;
    setCloudStatus("Speicherung läuft …");
    try {
      const response = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input.property.title, input, result, aiSummary: aiSummary || undefined })
      });
      const data = await response.json() as { ok: boolean; error?: string; message?: string };
      if (response.ok) {
        setCloudStatus("Analyse wurde sicher im Konto gespeichert.");
      } else if (data.error === "unauthorized") {
        setCloudStatus("Bitte zuerst anmelden. Lokal ist die Analyse bereits gespeichert.");
      } else if (data.error === "not_configured") {
        setCloudStatus("Cloudspeicherung ist noch nicht eingerichtet. Lokal ist die Analyse gespeichert.");
      } else {
        setCloudStatus(data.message ?? "Cloudspeicherung fehlgeschlagen.");
      }
    } catch {
      setCloudStatus("Cloudspeicherung konnte nicht erreicht werden.");
    }
  };

  const importPropertyText = async () => {
    setImportStatus("Text wird ausgewertet …");
    try {
      const response = await fetch("/api/analysis/import-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: importText })
      });
      const data = await response.json() as { ok: boolean; property?: Record<string, unknown>; message?: string };
      if (!response.ok || !data.property) {
        setImportStatus(data.message ?? "Import nicht möglich.");
        return;
      }

      const extracted = data.property;
      const allowedEnergy = ["A+", "A", "B", "C", "D", "E", "F", "G", "H"];
      setInput((current) => {
        const property: PropertyProfile = {
          ...current.property,
          title: typeof extracted.title === "string" && extracted.title ? extracted.title : current.property.title,
          purchasePrice: typeof extracted.purchasePrice === "number" ? extracted.purchasePrice : current.property.purchasePrice,
          livingArea: typeof extracted.livingArea === "number" ? extracted.livingArea : current.property.livingArea,
          landArea: typeof extracted.landArea === "number" ? extracted.landArea : current.property.landArea,
          numberOfUnits: typeof extracted.numberOfUnits === "number" ? extracted.numberOfUnits : current.property.numberOfUnits,
          yearBuilt: typeof extracted.yearBuilt === "number" ? extracted.yearBuilt : current.property.yearBuilt,
          monthlyColdRent: typeof extracted.monthlyColdRent === "number" ? extracted.monthlyColdRent : current.property.monthlyColdRent,
          monthlyHouseMoney: typeof extracted.monthlyHouseMoney === "number" ? extracted.monthlyHouseMoney : current.property.monthlyHouseMoney,
          renovationCosts: typeof extracted.renovationCosts === "number" ? extracted.renovationCosts : current.property.renovationCosts,
          energyClass: typeof extracted.energyClass === "string" && allowedEnergy.includes(extracted.energyClass)
            ? extracted.energyClass as PropertyProfile["energyClass"]
            : current.property.energyClass,
          address: {
            ...current.property.address,
            city: typeof extracted.city === "string" ? extracted.city : current.property.address.city,
            postalCode: typeof extracted.postalCode === "string" ? extracted.postalCode : current.property.address.postalCode,
            latitude: null,
            longitude: null,
            locationSource: null,
            geocodedAt: null
          }
        };
        return { ...current, property };
      });
      setImportStatus("Erkannte Daten wurden übernommen. Bitte kontrolliere die Werte.");
    } catch {
      setImportStatus("Import fehlgeschlagen.");
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <AnalysisWizard
        step={step}
        setStep={setStep}
        input={input}
        liveCalculation={liveCalculation}
        setInput={setInput}
        errors={errors}
        setErrors={setErrors}
        loading={loading}
        analysisStatus={analysisStatus}
        initialSourceUrl={initialSourceUrl}
        importText={importText}
        importStatus={importStatus}
        setImportText={setImportText}
        onImportText={importPropertyText}
        onRun={runAnalysis}
        onUserChange={updateUser}
        onPartnerChange={updatePartner}
        onPropertyChange={updateProperty}
        onFinancingChange={updateFinancing}
        onSettingsChange={updateSettings}
      />

      {result ? (
        <ResultPanel
          input={input}
          result={result}
          aiSummary={aiSummary}
          aiLoading={aiLoading}
          cloudStatus={cloudStatus}
          onExplain={explain}
          onCloudSave={saveCloud}
        />
      ) : null}
    </main>
  );
}
