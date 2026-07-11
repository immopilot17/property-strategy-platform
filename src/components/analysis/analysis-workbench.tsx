"use client";
import {
  UrlImporter,
  type ImportedProperty
} from "./url-importer";
import { useEffect, useState } from "react";
import type {
  AnalysisInput,
  FullAnalysisResult,
  PropertyProfile
} from "@/features/analysis/domain";
import { defaultAnalysisInput } from "@/features/analysis/domain";
import {
  consumeActiveAnalysis,
  saveLocalAnalysis,
  type SavedAnalysis
} from "@/lib/storage/analyses";
import { ResultPanel } from "./result-panel";

type ApiError = { field?: string; message: string };
type Option = { value: string; label: string };

const employmentOptions: Option[] = [
  { value: "permanent", label: "Unbefristet angestellt" },
  { value: "temporary", label: "Befristet angestellt" },
  { value: "self_employed", label: "Selbstständig" },
  { value: "civil_servant", label: "Verbeamtet" },
  { value: "retired", label: "Rente/Pension" },
  { value: "other", label: "Sonstiges" }
];

const goalOptions: Option[] = [
  { value: "owner_occupation", label: "Eigennutzung" },
  { value: "capital_investment", label: "Kapitalanlage" },
  { value: "mixed_use", label: "Gemischte Nutzung" }
];

const riskOptions: Option[] = [
  { value: "conservative", label: "Sicherheitsorientiert" },
  { value: "balanced", label: "Ausgewogen" },
  { value: "growth", label: "Wachstumsorientiert" }
];

const propertyOptions: Option[] = [
  { value: "apartment", label: "Eigentumswohnung" },
  { value: "single_family_house", label: "Einfamilienhaus" },
  { value: "multi_family_house", label: "Mehrfamilienhaus" },
  { value: "terraced_house", label: "Reihenhaus" },
  { value: "semi_detached_house", label: "Doppelhaushälfte" },
  { value: "commercial", label: "Gewerbe" },
  { value: "land", label: "Grundstück" },
  { value: "other", label: "Sonstiges" }
];

const conditionOptions: Option[] = [
  { value: "new", label: "Neubau" },
  { value: "renovated", label: "Saniert" },
  { value: "good", label: "Guter Zustand" },
  { value: "needs_modernization", label: "Modernisierungsbedürftig" },
  { value: "needs_full_renovation", label: "Umfassend sanierungsbedürftig" }
];

const occupancyOptions: Option[] = [
  { value: "vacant", label: "Leerstehend" },
  { value: "owner_occupied", label: "Eigengenutzt" },
  { value: "fully_rented", label: "Voll vermietet" },
  { value: "partially_rented", label: "Teilvermietet" }
];

function NumberField({
  label, value, onChange, suffix = "€", step = "1", min = "0"
}: {
  label: string; value: number | undefined; onChange: (value: number) => void;
  suffix?: string; step?: string; min?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-slate-950">
        <input
          type="number"
          value={value ?? ""}
          min={min}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 px-4 py-3 outline-none"
        />
        {suffix ? <span className="border-l border-slate-200 bg-slate-50 px-3 py-3 text-slate-500">{suffix}</span> : null}
      </div>
    </label>
  );
}

function TextField({
  label, value, onChange, placeholder = "", type = "text"
}: {
  label: string; value: string | undefined; onChange: (value: string) => void;
  placeholder?: string; type?: "text" | "url";
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-950"
      />
    </label>
  );
}

function SelectField({
  label, value, options, onChange
}: {
  label: string; value: string; options: Option[]; onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-950"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function Section({
  id, eyebrow, title, children
}: {
  id: string; eyebrow: string; title: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold">{title}</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

export function AnalysisWorkbench() {
  const [input, setInput] = useState<AnalysisInput>(defaultAnalysisInput);
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [errors, setErrors] = useState<ApiError[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [cloudStatus, setCloudStatus] = useState("");
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState("");

  useEffect(() => {
    const active = consumeActiveAnalysis();
    if (active) {
      setInput(active.input);
      setResult(active.result);
      setAiSummary(active.aiSummary ?? "");
    }
  }, []);

  const updateUser = <K extends keyof AnalysisInput["user"]>(
    key: K,
    value: AnalysisInput["user"][K]
  ) => setInput((current) => ({ ...current, user: { ...current.user, [key]: value } }));

  const updateProperty = <K extends keyof AnalysisInput["property"]>(
    key: K,
    value: AnalysisInput["property"][K]
  ) => setInput((current) => ({ ...current, property: { ...current.property, [key]: value } }));

  const updateFinancing = <K extends keyof AnalysisInput["financing"]>(
    key: K,
    value: AnalysisInput["financing"][K]
  ) => setInput((current) => ({ ...current, financing: { ...current.financing, [key]: value } }));

  const updateSettings = <K extends keyof AnalysisInput["settings"]>(
    key: K,
    value: AnalysisInput["settings"][K]
  ) => setInput((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));

  const runAnalysis = async () => {
    setLoading(true);
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
      window.setTimeout(() => document.getElementById("ergebnis")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      setErrors([{ message: "Die Analyse konnte nicht gestartet werden." }]);
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
    setCloudStatus("Speicherung läuft…");
    try {
      const response = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.property.title,
          input,
          result,
          aiSummary: aiSummary || undefined
        })
      });
      const data = await response.json() as { ok: boolean; error?: string; message?: string };
      if (response.ok) {
        setCloudStatus("Analyse wurde in Supabase gespeichert.");
      } else if (data.error === "unauthorized") {
        setCloudStatus("Bitte zuerst anmelden. Lokal ist die Analyse bereits gespeichert.");
      } else if (data.error === "not_configured") {
        setCloudStatus("Supabase ist noch nicht konfiguriert. Lokal ist die Analyse gespeichert.");
      } else {
        setCloudStatus(data.message ?? "Cloudspeicherung fehlgeschlagen.");
      }
    } catch {
      setCloudStatus("Cloudspeicherung konnte nicht erreicht werden.");
    }
  };

  const importPropertyText = async () => {
    setImportStatus("Text wird ausgewertet…");
    try {
      const response = await fetch("/api/analysis/import-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: importText })
      });
      const data = await response.json() as {
        ok: boolean;
        property?: Record<string, unknown>;
        message?: string;
      };
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
          energyClass:
            typeof extracted.energyClass === "string" && allowedEnergy.includes(extracted.energyClass)
              ? extracted.energyClass as PropertyProfile["energyClass"]
              : current.property.energyClass,
          address: {
            ...current.property.address,
            city: typeof extracted.city === "string" ? extracted.city : current.property.address.city,
            postalCode: typeof extracted.postalCode === "string" ? extracted.postalCode : current.property.address.postalCode
          }
        };
        return { ...current, property };
      });
      setImportStatus("Erkannte Daten wurden übernommen. Bitte alle Werte kontrollieren.");
    } catch {
      setImportStatus("Import fehlgeschlagen.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-4xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Vollständige Analyse</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Immobilie, Finanzierung und Risiko in einem Ablauf
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Alle Zahlen werden deterministisch berechnet. Die KI wird nur optional für Import und verständliche Erklärung verwendet.
        </p>
      </div>

      <div className="mt-10 space-y-7">
        <UrlImporter
  onImported={(
    imported: ImportedProperty
  ) => {
    setInput((current) => ({
      ...current,
      property: {
        ...current.property,
        ...imported,
        address: {
          ...current.property.address,
          ...(imported.address ?? {})
        }
      }
    }));
  }}
/>
        <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <h2 className="text-xl font-bold">Exposé-Text optional übernehmen</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Text aus einem Immobilienangebot einfügen. Die KI übernimmt nur erkannte Werte; anschließend alles kontrollieren.
          </p>
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            rows={5}
            placeholder="Exposé-Text hier einfügen…"
            className="mt-4 w-full rounded-2xl border border-slate-300 bg-white p-4 outline-none focus:border-slate-950"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={importText.trim().length < 50}
              onClick={importPropertyText}
              className="rounded-xl bg-slate-950 px-4 py-3 font-bold text-white disabled:opacity-40"
            >
              Daten erkennen
            </button>
            {importStatus ? <p className="text-sm text-slate-600">{importStatus}</p> : null}
          </div>
        </section>

        <Section id="finanzen" eyebrow="1 · Haushalt" title="Finanzprofil">
          <NumberField label="Haushaltsnettoeinkommen" value={input.user.householdNetIncome} onChange={(v) => updateUser("householdNetIncome", v)} />
          <NumberField label="Zusätzliche Einnahmen" value={input.user.additionalMonthlyIncome} onChange={(v) => updateUser("additionalMonthlyIncome", v)} />
          <NumberField label="Monatliche Lebenshaltung" value={input.user.monthlyLivingCosts} onChange={(v) => updateUser("monthlyLivingCosts", v)} />
          <NumberField label="Bestehende Kreditraten" value={input.user.existingLoanPayments} onChange={(v) => updateUser("existingLoanPayments", v)} />
          <NumberField label="Verfügbares Eigenkapital" value={input.user.availableEquity} onChange={(v) => updateUser("availableEquity", v)} />
          <NumberField label="Notfallreserve" value={input.user.emergencyReserve} onChange={(v) => updateUser("emergencyReserve", v)} />
          <NumberField label="Gewünschte Restreserve" value={input.user.desiredRemainingReserve} onChange={(v) => updateUser("desiredRemainingReserve", v)} />
          <NumberField label="Maximale Monatsrate" value={input.user.plannedMonthlyMaximumRate} onChange={(v) => updateUser("plannedMonthlyMaximumRate", v)} />
          <NumberField label="Erwachsene" value={input.user.numberOfAdults} onChange={(v) => updateUser("numberOfAdults", v)} suffix="" />
          <NumberField label="Kinder" value={input.user.numberOfChildren} onChange={(v) => updateUser("numberOfChildren", v)} suffix="" />
          <SelectField label="Beschäftigung" value={input.user.employmentStatus} options={employmentOptions} onChange={(v) => updateUser("employmentStatus", v as AnalysisInput["user"]["employmentStatus"])} />
          <SelectField label="Kaufziel" value={input.user.purchaseGoal} options={goalOptions} onChange={(v) => updateUser("purchaseGoal", v as AnalysisInput["user"]["purchaseGoal"])} />
          <SelectField label="Risikoprofil" value={input.user.riskPreference} options={riskOptions} onChange={(v) => updateUser("riskPreference", v as AnalysisInput["user"]["riskPreference"])} />
        </Section>

        <Section id="immobilie" eyebrow="2 · Objekt" title="Immobiliendaten">
          <TextField label="Bezeichnung" value={input.property.title} onChange={(v) => updateProperty("title", v)} />
          <TextField label="Quell-URL" value={input.property.sourceUrl} onChange={(v) => updateProperty("sourceUrl", v || undefined)} type="url" />
          <SelectField label="Immobilientyp" value={input.property.propertyType} options={propertyOptions} onChange={(v) => updateProperty("propertyType", v as AnalysisInput["property"]["propertyType"])} />
          <SelectField label="Zustand" value={input.property.condition} options={conditionOptions} onChange={(v) => updateProperty("condition", v as AnalysisInput["property"]["condition"])} />
          <SelectField label="Nutzung" value={input.property.occupancyType} options={occupancyOptions} onChange={(v) => updateProperty("occupancyType", v as AnalysisInput["property"]["occupancyType"])} />
          <TextField label="Ort" value={input.property.address.city} onChange={(v) => setInput((c) => ({ ...c, property: { ...c.property, address: { ...c.property.address, city: v } } }))} />
          <TextField label="Postleitzahl" value={input.property.address.postalCode} onChange={(v) => setInput((c) => ({ ...c, property: { ...c.property, address: { ...c.property.address, postalCode: v } } }))} />
          <NumberField label="Kaufpreis" value={input.property.purchasePrice} onChange={(v) => updateProperty("purchasePrice", v)} />
          <NumberField label="Wohnfläche" value={input.property.livingArea} onChange={(v) => updateProperty("livingArea", v)} suffix="m²" step="0.1" />
          <NumberField label="Grundstück" value={input.property.landArea} onChange={(v) => updateProperty("landArea", v)} suffix="m²" step="0.1" />
          <NumberField label="Einheiten" value={input.property.numberOfUnits} onChange={(v) => updateProperty("numberOfUnits", v)} suffix="" />
          <NumberField label="Baujahr" value={input.property.yearBuilt} onChange={(v) => updateProperty("yearBuilt", v || undefined)} suffix="" min="1800" />
          <NumberField label="Monatliche Kaltmiete" value={input.property.monthlyColdRent} onChange={(v) => updateProperty("monthlyColdRent", v)} />
          <NumberField label="Hausgeld" value={input.property.monthlyHouseMoney} onChange={(v) => updateProperty("monthlyHouseMoney", v)} />
          <NumberField label="Nicht umlagefähige Kosten" value={input.property.monthlyNonRecoverableCosts} onChange={(v) => updateProperty("monthlyNonRecoverableCosts", v)} />
          <NumberField label="Renovierung" value={input.property.renovationCosts} onChange={(v) => updateProperty("renovationCosts", v)} />
          <NumberField label="Modernisierung" value={input.property.modernizationCosts} onChange={(v) => updateProperty("modernizationCosts", v)} />
          <NumberField label="Ausstattung" value={input.property.furnishingCosts} onChange={(v) => updateProperty("furnishingCosts", v)} />
          <NumberField label="Grunderwerbsteuer" value={input.property.realEstateTransferTaxPercent} onChange={(v) => updateProperty("realEstateTransferTaxPercent", v)} suffix="%" step="0.01" />
          <NumberField label="Notar und Grundbuch" value={input.property.notaryAndLandRegistryPercent} onChange={(v) => updateProperty("notaryAndLandRegistryPercent", v)} suffix="%" step="0.01" />
          <NumberField label="Maklerprovision" value={input.property.brokerCommissionPercent} onChange={(v) => updateProperty("brokerCommissionPercent", v)} suffix="%" step="0.01" />
          <NumberField label="Leerstand" value={input.property.expectedVacancyPercent} onChange={(v) => updateProperty("expectedVacancyPercent", v)} suffix="%" step="0.1" />
          <NumberField label="Instandhaltung jährlich" value={input.property.annualMaintenancePercent} onChange={(v) => updateProperty("annualMaintenancePercent", v)} suffix="%" step="0.1" />
          <SelectField
            label="Energieklasse"
            value={input.property.energyClass ?? ""}
            options={[
              { value: "", label: "Unbekannt" },
              ...["A+", "A", "B", "C", "D", "E", "F", "G", "H"].map((value) => ({ value, label: value }))
            ]}
            onChange={(v) => updateProperty("energyClass", v ? v as PropertyProfile["energyClass"] : undefined)}
          />
        </Section>

        <Section id="finanzierung" eyebrow="3 · Darlehen" title="Finanzierungsannahmen">
          <NumberField label="Eigenkapitaleinsatz gesamt" value={input.financing.equityForPurchase} onChange={(v) => updateFinancing("equityForPurchase", v)} />
          <NumberField label="Sollzins" value={input.financing.annualInterestRatePercent} onChange={(v) => updateFinancing("annualInterestRatePercent", v)} suffix="%" step="0.01" />
          <NumberField label="Anfängliche Tilgung" value={input.financing.initialRepaymentPercent} onChange={(v) => updateFinancing("initialRepaymentPercent", v)} suffix="%" step="0.01" />
          <NumberField label="Zinsbindung" value={input.financing.fixedInterestYears} onChange={(v) => updateFinancing("fixedInterestYears", v)} suffix="Jahre" />
          <NumberField label="Gesamtlaufzeit" value={input.financing.totalTermYears} onChange={(v) => updateFinancing("totalTermYears", v)} suffix="Jahre" />
          <NumberField label="Zusätzliche Monatszahlung" value={input.financing.additionalMonthlyPayment} onChange={(v) => updateFinancing("additionalMonthlyPayment", v)} />
          <NumberField label="Erwarteter Anschlusszins" value={input.financing.expectedInterestAfterFixedPeriodPercent} onChange={(v) => updateFinancing("expectedInterestAfterFixedPeriodPercent", v)} suffix="%" step="0.01" />
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
            <input type="checkbox" checked={input.financing.includePurchaseCostsInLoan} onChange={(e) => updateFinancing("includePurchaseCostsInLoan", e.target.checked)} />
            <span className="font-semibold">Kaufnebenkosten mitfinanzieren</span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
            <input type="checkbox" checked={input.financing.includeRenovationInLoan} onChange={(e) => updateFinancing("includeRenovationInLoan", e.target.checked)} />
            <span className="font-semibold">Projektkosten mitfinanzieren</span>
          </label>
        </Section>

        <Section id="annahmen" eyebrow="4 · Szenario" title="Steuer- und Prognoseannahmen">
          <NumberField label="Gebäudeanteil" value={input.settings.buildingValueSharePercent} onChange={(v) => updateSettings("buildingValueSharePercent", v)} suffix="%" step="0.1" />
          <NumberField label="AfA-Satz" value={input.settings.depreciationRatePercent} onChange={(v) => updateSettings("depreciationRatePercent", v)} suffix="%" step="0.1" />
          <NumberField label="Persönlicher Grenzsteuersatz" value={input.settings.marginalTaxRatePercent} onChange={(v) => updateSettings("marginalTaxRatePercent", v)} suffix="%" step="0.1" />
          <NumberField label="Wertentwicklung jährlich" value={input.settings.annualPropertyValueGrowthPercent} onChange={(v) => updateSettings("annualPropertyValueGrowthPercent", v)} suffix="%" step="0.1" min="-20" />
          <NumberField label="Mietentwicklung jährlich" value={input.settings.annualRentGrowthPercent} onChange={(v) => updateSettings("annualRentGrowthPercent", v)} suffix="%" step="0.1" min="-20" />
          <NumberField label="Kostensteigerung jährlich" value={input.settings.annualCostGrowthPercent} onChange={(v) => updateSettings("annualCostGrowthPercent", v)} suffix="%" step="0.1" min="-20" />
        </Section>

        {errors.length ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
            <h2 className="font-bold">Bitte korrigieren</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {errors.map((error, index) => (
                <li key={`${error.field}-${index}`}>
                  {error.field ? <strong>{error.field}: </strong> : null}{error.message}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="sticky bottom-4 z-20 flex justify-center">
          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className="rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-xl hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Analyse wird berechnet…" : "Vollständige Analyse berechnen"}
          </button>
        </div>

        {result ? (
          <ResultPanel
            result={result}
            aiSummary={aiSummary}
            aiLoading={aiLoading}
            cloudStatus={cloudStatus}
            onExplain={explain}
            onCloudSave={saveCloud}
          />
        ) : null}
      </div>
    </div>
  );
}
