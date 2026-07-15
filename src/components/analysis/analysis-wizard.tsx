"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { ArrowLeft, ArrowRight, Check, Cloud, Home, Landmark, SearchCheck, Sparkles } from "lucide-react";
import clsx from "clsx";
import { LocationFields } from "@/components/location/LocationFields";
import { validateAnalysisInput, type AnalysisInput, type CalculationResult, type PropertyProfile } from "@/features/analysis/domain";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { UrlImporter, type ImportedProperty } from "./url-importer";

type ApiError = { field?: string; message: string };
type Option = { value: string; label: string };

type AnalysisWizardProps = {
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  input: AnalysisInput;
  liveCalculation: CalculationResult;
  setInput: Dispatch<SetStateAction<AnalysisInput>>;
  errors: ApiError[];
  setErrors: Dispatch<SetStateAction<ApiError[]>>;
  loading: boolean;
  analysisStatus: string;
  initialSourceUrl: string;
  importText: string;
  importStatus: string;
  setImportText: (value: string) => void;
  onImportText: () => void;
  onRun: () => void;
  onUserChange: <K extends keyof AnalysisInput["user"]>(key: K, value: AnalysisInput["user"][K]) => void;
  onPartnerChange: <K extends keyof NonNullable<AnalysisInput["user"]["partner"]>>(key: K, value: NonNullable<AnalysisInput["user"]["partner"]>[K]) => void;
  onPropertyChange: <K extends keyof AnalysisInput["property"]>(key: K, value: AnalysisInput["property"][K]) => void;
  onFinancingChange: <K extends keyof AnalysisInput["financing"]>(key: K, value: AnalysisInput["financing"][K]) => void;
  onSettingsChange: <K extends keyof AnalysisInput["settings"]>(key: K, value: AnalysisInput["settings"][K]) => void;
};

const employmentOptions: Option[] = [
  { value: "permanent", label: "Unbefristet angestellt" },
  { value: "temporary", label: "Befristet angestellt" },
  { value: "self_employed", label: "Selbstständig" },
  { value: "civil_servant", label: "Verbeamtet" },
  { value: "retired", label: "Rente/Pension" },
  { value: "other", label: "Sonstiges" }
];

const maritalOptions: Option[] = [
  { value: "single", label: "Ledig" },
  { value: "married", label: "Verheiratet" },
  { value: "civil_partnership", label: "Eingetragene Partnerschaft" },
  { value: "divorced", label: "Geschieden" },
  { value: "widowed", label: "Verwitwet" }
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

const stepLabels = ["Ziel", "Immobilie", "Haushalt", "Finanzierung", "Prüfen"];
const currency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const stepFieldPrefixes: Record<number, string[]> = {
  1: ["user.purchaseGoal"],
  2: ["property.title", "property.propertyType", "property.projectType", "property.address.federalState", "property.purchasePrice", "property.livingArea"],
  3: ["user.maritalStatus", "user.purchaseType", "user.householdNetIncome", "user.monthlyLivingCosts", "user.availableEquity", "user.numberOfChildren", "user.employmentStatus"],
  4: ["financing.equityForPurchase", "financing.annualInterestRatePercent", "financing.initialRepaymentPercent", "financing.fixedInterestYears", "financing.totalTermYears"],
  5: ["settings", "financing", "property", "user"]
};

function findValidationErrors(step: number, input: AnalysisInput): ApiError[] {
  const validation = validateAnalysisInput(input);
  if (validation.success) return [];

  const prefixes = stepFieldPrefixes[step] ?? [];
  return validation.errors.filter((error) => prefixes.some((prefix) => error.field === prefix || error.field.startsWith(`${prefix}.`)));
}

function NumberField({ label, value, onChange, suffix = "€", step = "1", min = "0", hint, error, fieldKey, allowEmpty = false }: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  suffix?: string;
  step?: string;
  min?: string;
  hint?: string;
  error?: string;
  fieldKey?: string;
  allowEmpty?: boolean;
}) {
  const [draft, setDraft] = useState(value === undefined ? "" : String(value));

  useEffect(() => {
    setDraft(value === undefined ? "" : String(value));
  }, [value]);

  function commit(rawValue: string) {
    const trimmed = rawValue.trim();
    if (trimmed === "") {
      if (allowEmpty) {
        onChange(undefined);
        setDraft("");
      } else {
        setDraft(value === undefined ? "" : String(value));
      }
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      setDraft(value === undefined ? "" : String(value));
      return;
    }

    onChange(parsed);
    setDraft(String(parsed));
  }

  return (
    <label className="block">
      <span className="text-sm font-bold text-ink dark:text-slate-100">{label}</span>
      {hint ? <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</span> : null}
      <span className={clsx("mt-2 flex overflow-hidden rounded-xl border bg-white transition focus-within:ring-4 dark:bg-slate-950", error ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-100 dark:border-red-800 dark:focus-within:border-red-500 dark:focus-within:ring-red-950/60" : "border-slate-300 focus-within:border-teal focus-within:ring-teal-100 dark:border-slate-600 dark:focus-within:ring-teal-950")}>
        <input
          type="number"
          value={draft}
          min={min}
          step={step}
          data-field={fieldKey}
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            const nextValue = event.target.value;
            setDraft(nextValue);
            if (!nextValue.trim()) return;
            const parsed = Number(nextValue);
            if (Number.isFinite(parsed)) onChange(parsed);
          }}
          onBlur={(event) => commit(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-ink outline-none dark:text-white"
        />
        {suffix ? <span className="border-l border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{suffix}</span> : null}
      </span>
      {error ? <span className="mt-2 block text-sm text-red-700 dark:text-red-300">{error}</span> : null}
    </label>
  );
}

function TextField({ label, value, onChange, type = "text", hint, error, fieldKey }: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  type?: "text" | "url";
  hint?: string;
  error?: string;
  fieldKey?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink dark:text-slate-100">{label}</span>
      {hint ? <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</span> : null}
      <input type={type} value={value ?? ""} data-field={fieldKey} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} className={clsx("mt-2 w-full rounded-xl border bg-white px-4 py-3 text-ink outline-none transition focus:ring-4 dark:bg-slate-950 dark:text-white", error ? "border-red-300 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:focus:border-red-500 dark:focus:ring-red-950/60" : "border-slate-300 focus:border-teal focus:ring-teal-100 dark:border-slate-600 dark:focus:ring-teal-950")} />
      {error ? <span className="mt-2 block text-sm text-red-700 dark:text-red-300">{error}</span> : null}
    </label>
  );
}

function SelectField({ label, value, options, onChange, hint, error, fieldKey }: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  fieldKey?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink dark:text-slate-100">{label}</span>
      {hint ? <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</span> : null}
      <select value={value} data-field={fieldKey} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} className={clsx("mt-2 w-full rounded-xl border bg-white px-4 py-3 text-ink outline-none transition focus:ring-4 dark:bg-slate-950 dark:text-white", error ? "border-red-300 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:focus:border-red-500 dark:focus:ring-red-950/60" : "border-slate-300 focus:border-teal focus:ring-teal-100 dark:border-slate-600 dark:focus:ring-teal-950")}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {error ? <span className="mt-2 block text-sm text-red-700 dark:text-red-300">{error}</span> : null}
    </label>
  );
}

function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-teal-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-teal-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 rounded border-slate-300 accent-teal" />
      <span className="font-semibold text-ink dark:text-white">{children}</span>
    </label>
  );
}

function ChoiceGroup({ label, value, options, onChange, error, fieldKey }: { label: string; value: string; options: Option[]; onChange: (value: string) => void; error?: string; fieldKey?: string }) {
  return (
    <fieldset role="radiogroup" aria-invalid={Boolean(error)}>
      <legend className="text-sm font-bold text-ink dark:text-white">{label}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const active = value === option.value;
          return <button key={option.value} type="button" role="radio" aria-checked={active} data-field={fieldKey} onClick={() => onChange(option.value)} className={clsx("flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-bold transition focus-visible:outline-none", active ? "border-teal bg-mint text-teal ring-2 ring-teal/10 dark:bg-teal-950 dark:text-teal-200" : error ? "border-red-300 bg-white text-slate-700 hover:border-red-400 dark:border-red-800 dark:bg-slate-950 dark:text-slate-200" : "border-slate-300 bg-white text-slate-700 hover:border-teal-300 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200")}><span>{option.label}</span>{active ? <Check size={17} aria-hidden="true" /> : null}</button>;
        })}
      </div>
      {error ? <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p> : null}
    </fieldset>
  );
}

function WizardPanel({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-teal dark:text-teal-300">{eyebrow}</p>
      <h2 className="text-balance mt-2 text-2xl font-black tracking-tight text-ink dark:text-white sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">{description}</p>
      <div className="mt-7">{children}</div>
    </section>
  );
}

export function AnalysisWizard(props: AnalysisWizardProps) {
  const {
    step, setStep, input, liveCalculation, setInput, errors, setErrors, loading, analysisStatus, initialSourceUrl,
    importText, importStatus, setImportText, onImportText, onRun, onUserChange,
    onPartnerChange, onPropertyChange, onFinancingChange, onSettingsChange
  } = props;

  const partner = input.user.purchaseType === "joint" ? input.user.partner : undefined;
  const totalIncome = input.user.householdNetIncome + input.user.additionalMonthlyIncome + (partner?.monthlyNetIncome ?? 0) + (partner?.additionalMonthlyIncome ?? 0);
  const totalLoans = input.user.existingLoanPayments + (partner?.existingLoanPayments ?? 0);
  void totalLoans; // preserved for future display
  const totalEquity = input.user.availableEquity + (partner?.availableEquity ?? 0);

  // Derived metrics for visual indicators
  const pricePerSqm = input.property.livingArea > 0 ? Math.round(input.property.purchasePrice / input.property.livingArea) : 0;
  const monthlyRate = liveCalculation.financing.monthlyLoanRate;
  const ratePercent = totalIncome > 0 ? Math.round((monthlyRate / totalIncome) * 100) : 0;
  const equityPercent = input.property.purchasePrice > 0 ? Math.round((totalEquity / input.property.purchasePrice) * 100) : 0;
  const livingCostPercent = totalIncome > 0 ? Math.round((input.user.monthlyLivingCosts / totalIncome) * 100) : 0;
  const monthlyReserve = liveCalculation.affordability.remainingMonthlyLiquidity;
  const stepTimes = ["1 Min.", "3 Min.", "2 Min.", "2 Min.", "1 Min."];
  const score = Math.max(0, Math.min(100, (() => {
    let s = 100;
    if (ratePercent > 40) s -= 25; else if (ratePercent > 35) s -= 10;
    if (equityPercent < 15) s -= 25; else if (equityPercent < 20) s -= 10;
    if (monthlyReserve < 0) s -= 30; else if (monthlyReserve < 150) s -= 15;
    if (liveCalculation.financing.loanToValuePercent > 90) s -= 10;
    return s;
  })()));
  // KI smart alerts based on live metrics
  const kiAlerts: string[] = [];
  if (step === 2 && pricePerSqm > 5000) kiAlerts.push(`Preis von ${currency.format(pricePerSqm)}/m² liegt deutlich über dem Bundesdurchschnitt. Prüfe, ob der Angebotspreis verhandelbar ist.`);
  if (step === 2 && pricePerSqm > 0 && pricePerSqm < 1500) kiAlerts.push(`Preis von ${currency.format(pricePerSqm)}/m² ist auffällig niedrig. Prüfe Zustand und Lage sorgfältig.`);
  if (step === 3 && ratePercent > 40) kiAlerts.push(`Die erwartete Rate entspricht ${ratePercent} % des Einkommens — über der Banken-Empfehlung von 35–40 %. Mehr Eigenkapital oder ein günstigerer Kaufpreis würde helfen.`);
  if (step === 3 && monthlyReserve < 200 && monthlyReserve >= 0) kiAlerts.push(`Monatliche Reserve von ${currency.format(monthlyReserve)} ist sehr knapp. Experten empfehlen mindestens 200–300 € Puffer für unvorhergesehene Kosten.`);
  if (step === 3 && monthlyReserve < 0) kiAlerts.push(`Aktuell ergibt sich eine monatliche Lücke von ${currency.format(Math.abs(monthlyReserve))}. Prüfe Kaufpreis, Eigenkapital oder senke die Lebenshaltungskosten.`);
  if (step === 4 && liveCalculation.financing.remainingDebtAfterFixedPeriod > liveCalculation.financing.requiredLoanAmount * 0.6) kiAlerts.push(`Nach der Zinsbindung bleiben noch ${currency.format(liveCalculation.financing.remainingDebtAfterFixedPeriod)} offen. Plane jetzt schon die Anschlussfinanzierung und sichere dir ggf. ein Forward-Darlehen.`);
  const guide = [
    { now: "Du legst dein Ziel fest.", why: "So zeigt die Analyse nur Kennzahlen, die zu deinem Vorhaben passen.", next: "Danach erfassen wir die Immobilie." },
    { now: "Du erfasst die wichtigsten Objektdaten.", why: "Kaufpreis, Fläche und Standort bilden die Basis aller Berechnungen.", next: "Danach prüfen wir deinen Haushalt." },
    { now: "Du prüfst die finanzielle Ausgangslage.", why: "Einkommen, Ausgaben und Eigenkapital bestimmen die tragbare Belastung.", next: "Danach legst du den Finanzierungsrahmen fest." },
    { now: "Du bestimmst Zins, Tilgung und Eigenkapital.", why: "Diese Werte beeinflussen Monatsrate, Restschuld und Reserve.", next: "Danach kontrollierst du alle Angaben." },
    { now: "Du prüfst die Zusammenfassung.", why: "Nur bestätigte Angaben fließen in Bewertung und KI-Erklärung ein.", next: "Starte anschließend die Analyse." }
  ][step - 1];
  const contextHint = [
    input.user.purchaseGoal === "owner_occupation"
      ? "Ich richte die nächsten Fragen auf tragbare Rate, Reserve und Eigennutzungsförderungen (KfW, Wohn-Riester) aus."
      : input.user.purchaseGoal === "capital_investment"
        ? "Ich richte die nächsten Fragen auf Nettomietrendite, Cashflow, AfA-Steueroptimierung und Risiken aus."
        : "Ich berücksichtige Eigennutzungs- und Kapitalanlage-Kennzahlen gemeinsam.",
    pricePerSqm > 0
      ? `Preis von ${currency.format(pricePerSqm)}/m². Gesamtinvestition inkl. Nebenkosten: ${currency.format(liveCalculation.purchaseCosts.totalInvestmentCosts)}.${pricePerSqm > 5000 ? " Das ist überdurchschnittlich teuer — prüfe Verhandlungsspielraum." : pricePerSqm < 2500 ? " Relativ günstig — prüfe Zustand und Lage sorgfältig." : " Preis liegt im marktüblichen Bereich."}`
      : `Aus den aktuellen Objektdaten ergibt die Calculation Engine eine Gesamtinvestition von ${currency.format(liveCalculation.purchaseCosts.totalInvestmentCosts)}.`,
    monthlyReserve >= 200
      ? `Rate ${ratePercent} % des Einkommens — im akzeptablen Bereich. Reserve: ${currency.format(monthlyReserve)}/Monat. Eigenkapital: ${equityPercent} %.`
      : monthlyReserve >= 0
        ? `Rate ${ratePercent} % des Einkommens. Reserve von ${currency.format(monthlyReserve)}/Monat ist sehr knapp — erwäge mehr Eigenkapital oder einen günstigeren Kaufpreis.`
        : `Aktuell ergibt sich eine monatliche Lücke von ${currency.format(Math.abs(monthlyReserve))}. Prüfe Einkommen, Ausgaben und Kaufpreis — ohne Anpassung ist eine Finanzierung schwierig.`,
    liveCalculation.financing.loanToValuePercent > 100
      ? `Beleihungsauslauf ${liveCalculation.financing.loanToValuePercent.toFixed(1)} % — zu hoch für die meisten Banken. Mehr Eigenkapital oder geringerer Kaufpreis nötig.`
      : liveCalculation.financing.remainingDebtAfterFixedPeriod > liveCalculation.financing.requiredLoanAmount * 0.6
        ? `Rate ${currency.format(monthlyRate)}/Monat. Nach der Zinsbindung bleiben ${currency.format(liveCalculation.financing.remainingDebtAfterFixedPeriod)} offen — Anschlussfinanzierung planen.`
        : `Rate ${currency.format(monthlyRate)}/Monat, Beleihungsauslauf ${liveCalculation.financing.loanToValuePercent.toFixed(1)} %. Finanzierungsstruktur sieht solide aus.`,
    score >= 80
      ? `Gesamtscore ${score}/100 — solide Ausgangslage. Starte jetzt die Analyse für detaillierte KI-Erklärungen.`
      : score >= 60
        ? `Gesamtscore ${score}/100 — Analyse ist sinnvoll, aber beachte die markierten Punkte. Die KI gibt konkrete Optimierungshinweise.`
        : `Gesamtscore ${score}/100 — einige Kennzahlen sind kritisch. Die Analyse startet trotzdem, die KI erklärt genau wo Risiken liegen.`
  ][step - 1];
  const updateAddress = <K extends keyof AnalysisInput["property"]["address"]>(key: K, value: AnalysisInput["property"]["address"][K]) => {
    setInput((current) => ({ ...current, property: { ...current.property, address: { ...current.property.address, [key]: value } } }));
  };
  const fieldError = (...fields: string[]) => errors.find((error) => error.field && fields.includes(error.field))?.message;
  const focusErrorField = (field?: string) => {
    if (!field) return;
    const target = document.querySelector<HTMLElement>(`[data-field="${field}"]`);
    target?.focus();
  };
  const handleImported = (imported: ImportedProperty) => {
    setInput((current) => ({
      ...current,
      property: {
        ...current.property,
        ...imported,
        address: {
          ...current.property.address,
          ...(imported.address ?? {}),
          ...(imported.address ? { latitude: null, longitude: null, locationSource: null, geocodedAt: null } : {})
        }
      }
    }));
    setStep(2);
    window.setTimeout(() => {
      document.getElementById("analyse-fortschritt")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };
  const moveToStep = (nextStep: number) => {
    if (nextStep > step) {
      const stepErrors = findValidationErrors(step, input);
      if (stepErrors.length) {
        setErrors(stepErrors);
        window.requestAnimationFrame(() => focusErrorField(stepErrors[0]?.field));
        return;
      }
    }
    setErrors([]);
    setStep(Math.max(1, Math.min(stepLabels.length, nextStep)));
    window.setTimeout(() => {
      document.getElementById("analyse-fortschritt")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    }, 0);
  };
  const runValidatedAnalysis = () => {
    const validationErrors = findValidationErrors(5, input);
    if (validationErrors.length) {
      setErrors(validationErrors);
      window.requestAnimationFrame(() => focusErrorField(validationErrors[0]?.field));
      return;
    }
    setErrors([]);
    onRun();
  };

  return (
    <div>
      <header className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal dark:text-teal-300">Kostenlose Immobilienanalyse</p>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"><Cloud size={15} aria-hidden="true" /> Automatisch gespeichert</span>
        </div>
        <h1 className="text-balance mt-3 text-3xl font-black tracking-tight text-ink dark:text-white sm:text-5xl">Schritt für Schritt zu einer klaren Entscheidung.</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">Du siehst nur, was jetzt wichtig ist. Details kannst du bei Bedarf öffnen.</p>
      </header>

      <nav id="analyse-fortschritt" aria-label="Analysefortschritt" className="mt-8 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-ink dark:text-white">Schritt {step} von {stepLabels.length} — {stepLabels[step - 1]}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">⏱ {stepTimes[step - 1]} · Automatisch gespeichert</p>
          </div>
          <span className="rounded-full bg-teal/10 px-3 py-1 text-sm font-bold text-teal dark:bg-teal-950 dark:text-teal-300">{step * 20} %</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700" role="progressbar" aria-valuemin={1} aria-valuemax={stepLabels.length} aria-valuenow={step} aria-label={`Schritt ${step} von ${stepLabels.length}`}>
          <div className="h-full rounded-full bg-teal transition-all duration-300" style={{ width: `${step * 20}%` }} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-1">
          {stepLabels.map((label, index) => {
            const num = index + 1;
            const done = num < step;
            const active = num === step;
            return (
              <button key={label} type="button" onClick={() => moveToStep(num)} aria-current={active ? "step" : undefined} className="flex flex-1 flex-col items-center gap-1.5 rounded-xl p-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800">
                <span className={clsx("relative flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-black transition-all", done ? "border-teal bg-teal text-white" : active ? "border-teal bg-transparent text-teal ring-4 ring-teal/15 dark:ring-teal/20" : "border-slate-300 bg-transparent text-slate-400 dark:border-slate-600 dark:text-slate-500")}>
                  {done ? <Check size={13} /> : num}
                  {active ? <span className="absolute -inset-1 animate-ping rounded-full bg-teal/20" /> : null}
                </span>
                <span className={clsx("hidden text-xs font-bold sm:block", active ? "text-teal dark:text-teal-300" : done ? "text-slate-500 dark:text-slate-400" : "text-slate-400 dark:text-slate-500")}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
        {step === 1 ? (
          <WizardPanel eyebrow="1 · Dein Ziel" title="Was möchtest du mit der Immobilie erreichen?" description="Diese Auswahl bestimmt, welche Kennzahlen, Förderungen und Steuerhinweise später wichtig sind.">
            <div id="immobilienlink-start" className="mb-7 scroll-mt-28 rounded-2xl border-2 border-teal/30 bg-mint/60 p-5 dark:border-teal-700 dark:bg-teal-950/40">
              <p className="font-black text-ink dark:text-white">Direkt mit einem Immobilienlink starten</p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Inserat einfügen, Eckdaten automatisch übernehmen und anschließend kontrollieren.</p>
              <div className="mt-4"><UrlImporter initialUrl={initialSourceUrl} onImported={handleImported} /></div>
            </div>
            <div className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /><span>oder manuell starten</span><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /></div>
            <div className="grid gap-3">
              {[
                { value: "owner_occupation", icon: Home, title: "Selbst einziehen", text: "Fokus auf Monatsrate, Eigenkapital, Reserve und Wohnförderung (KfW, Wohn-Riester).", tags: ["Bezahlbarkeit", "KfW-Förderung", "Reserve"] },
                { value: "capital_investment", icon: Landmark, title: "Als Kapitalanlage vermieten", text: "Fokus auf Nettomietrendite, Cashflow, Steueroptimierung (AfA) und Risikobewertung.", tags: ["Rendite", "Cashflow", "Steuer AfA"] },
                { value: "mixed_use", icon: SearchCheck, title: "Teilweise vermieten", text: "Eigennutzung und Kapitalanlage werden gemeinsam betrachtet.", tags: ["Gemischt", "Flexibel", "Kombiniert"] }
              ].map((choice) => {
                const Icon = choice.icon;
                const active = input.user.purchaseGoal === choice.value;
                return (
                  <button key={choice.value} type="button" role="radio" data-field="user.purchaseGoal" aria-checked={active} onClick={() => onUserChange("purchaseGoal", choice.value as AnalysisInput["user"]["purchaseGoal"])} className={clsx("flex items-center gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-none sm:gap-5 sm:p-5", active ? "border-teal bg-mint ring-2 ring-teal/10 dark:bg-teal-950" : fieldError("user.purchaseGoal") ? "border-red-300 hover:border-red-400 dark:border-red-800 dark:hover:border-red-700" : "border-slate-200 hover:border-teal-300 dark:border-slate-700 dark:hover:border-teal-700")}>
                    <span className={clsx("grid h-12 w-12 shrink-0 place-items-center rounded-xl", active ? "bg-teal text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}><Icon size={22} aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1">
                      <span className="block font-bold text-ink dark:text-white">{choice.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-300">{choice.text}</span>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {choice.tags.map((tag) => (
                          <span key={tag} className={clsx("rounded-md px-2 py-0.5 text-xs font-bold", active ? "bg-teal/15 text-teal dark:bg-teal-900 dark:text-teal-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    {active ? <Check size={18} className="shrink-0 text-teal" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
            {fieldError("user.purchaseGoal") ? <p className="mt-3 text-sm text-red-700 dark:text-red-300">{fieldError("user.purchaseGoal")}</p> : null}
            {input.user.purchaseGoal ? (
              <div className="mt-4 rounded-2xl border border-teal-200 bg-mint/50 p-4 dark:border-teal-800 dark:bg-teal-950/40">
                <p className="text-xs font-black text-teal dark:text-teal-300">🎯 Basierend auf deiner Auswahl zeige ich dir:</p>
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                  {input.user.purchaseGoal === "owner_occupation" ? (<>
                    <div className="flex items-center gap-2"><Check size={13} className="shrink-0 text-teal" /><span className="text-slate-700 dark:text-slate-300">KfW & Wohn-Riester Förderungen</span></div>
                    <div className="flex items-center gap-2"><Check size={13} className="shrink-0 text-teal" /><span className="text-slate-700 dark:text-slate-300">Bezahlbarkeitsgrenze</span></div>
                    <div className="flex items-center gap-2"><Check size={13} className="shrink-0 text-teal" /><span className="text-slate-700 dark:text-slate-300">Notfallreserve-Empfehlung</span></div>
                    <div className="flex items-center gap-2 opacity-40"><span className="w-3.5 shrink-0" /><span className="text-slate-500">Mietrendite (nicht relevant)</span></div>
                  </>) : input.user.purchaseGoal === "capital_investment" ? (<>
                    <div className="flex items-center gap-2"><Check size={13} className="shrink-0 text-teal" /><span className="text-slate-700 dark:text-slate-300">Nettomietrendite & Cashflow</span></div>
                    <div className="flex items-center gap-2"><Check size={13} className="shrink-0 text-teal" /><span className="text-slate-700 dark:text-slate-300">AfA-Steueroptimierung</span></div>
                    <div className="flex items-center gap-2"><Check size={13} className="shrink-0 text-teal" /><span className="text-slate-700 dark:text-slate-300">Leerstandsrisiko</span></div>
                    <div className="flex items-center gap-2"><Check size={13} className="shrink-0 text-teal" /><span className="text-slate-700 dark:text-slate-300">Wertentwicklungsprognose</span></div>
                  </>) : (<>
                    <div className="flex items-center gap-2"><Check size={13} className="shrink-0 text-teal" /><span className="text-slate-700 dark:text-slate-300">Teilrendite Vermietung</span></div>
                    <div className="flex items-center gap-2"><Check size={13} className="shrink-0 text-teal" /><span className="text-slate-700 dark:text-slate-300">Eigennutzungsanteil</span></div>
                    <div className="flex items-center gap-2"><Check size={13} className="shrink-0 text-teal" /><span className="text-slate-700 dark:text-slate-300">Kombinierte Förderungen</span></div>
                    <div className="flex items-center gap-2"><Check size={13} className="shrink-0 text-teal" /><span className="text-slate-700 dark:text-slate-300">Gemischte Steuerbetrachtung</span></div>
                  </>)}
                </div>
              </div>
            ) : null}
          </WizardPanel>
        ) : null}

        {step === 2 ? (
          <WizardPanel eyebrow="2 · Immobilie" title="Welche Immobilie möchtest du prüfen?" description="Die wichtigsten Eckdaten reichen für den Start. Fehlende Details kannst du später ergänzen.">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700">
              <Disclosure title="Daten aus einem Link übernehmen" description="Optional: Angebot einlesen und erkannte Werte kontrollieren">
                <UrlImporter onImported={handleImported} />
              </Disclosure>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2"><TextField label="Bezeichnung der Immobilie" value={input.property.title} onChange={(value) => onPropertyChange("title", value)} error={fieldError("property.title")} fieldKey="property.title" /></div>
              <SelectField label="Immobilientyp" value={input.property.propertyType} options={propertyOptions} onChange={(value) => onPropertyChange("propertyType", value as AnalysisInput["property"]["propertyType"])} error={fieldError("property.propertyType")} fieldKey="property.propertyType" />
              <ChoiceGroup label="Vorhaben" value={input.property.projectType} options={[{ value: "new_build", label: "Neubau" }, { value: "existing", label: "Bestand" }]} onChange={(value) => onPropertyChange("projectType", value as AnalysisInput["property"]["projectType"])} error={fieldError("property.projectType")} fieldKey="property.projectType" />
              <TextField label="Bundesland" value={input.property.address.federalState} onChange={(value) => updateAddress("federalState", value)} hint="Wichtig für Kaufnebenkosten und Landesförderungen" error={fieldError("property.address.federalState")} fieldKey="property.address.federalState" />
              <NumberField label="Kaufpreis" value={input.property.purchasePrice} onChange={(value) => onPropertyChange("purchasePrice", value ?? input.property.purchasePrice)} error={fieldError("property.purchasePrice")} fieldKey="property.purchasePrice" />
              <NumberField label="Wohnfläche" value={input.property.livingArea} onChange={(value) => onPropertyChange("livingArea", value ?? input.property.livingArea)} suffix="m²" step="0.1" error={fieldError("property.livingArea")} fieldKey="property.livingArea" />
              {input.user.purchaseGoal !== "owner_occupation" ? <NumberField label="Monatliche Kaltmiete" value={input.property.monthlyColdRent} onChange={(value) => onPropertyChange("monthlyColdRent", value ?? input.property.monthlyColdRent)} /> : null}
              <SelectField label="Nutzung heute" value={input.property.occupancyType} options={occupancyOptions} onChange={(value) => onPropertyChange("occupancyType", value as AnalysisInput["property"]["occupancyType"])} />
            </div>

            {input.property.purchasePrice > 0 && input.property.livingArea > 0 ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Preis / m²</p>
                    <p className="mt-1 text-xl font-black text-ink dark:text-white">{currency.format(pricePerSqm)}</p>
                    <p className={clsx("mt-0.5 text-xs font-bold", pricePerSqm > 5000 ? "text-red-600 dark:text-red-400" : pricePerSqm > 3500 ? "text-amber-600 dark:text-amber-400" : "text-teal dark:text-teal-400")}>
                      {pricePerSqm > 5000 ? "▲ Über Markt" : pricePerSqm > 3500 ? "≈ Marktüblich" : "▼ Unter Markt"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Gesamtinvestition</p>
                    <p className="mt-1 text-xl font-black text-ink dark:text-white">{currency.format(liveCalculation.purchaseCosts.totalInvestmentCosts)}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">inkl. Nebenkosten</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Eigenkapital</p>
                    <p className={clsx("mt-1 text-xl font-black", equityPercent >= 20 ? "text-teal dark:text-teal-400" : "text-amber-600 dark:text-amber-400")}>{equityPercent} %</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{equityPercent >= 20 ? "✓ Ausreichend" : "! Unter 20 %"}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                    <span>Günstig (&lt;3.500 €/m²)</span>
                    <span>Teuer (&gt;5.000 €/m²)</span>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-full" style={{ background: "linear-gradient(90deg, #0D9488 0%, #f59e0b 55%, #ef4444 100%)" }}>
                    <div
                      className="absolute top-0 h-2.5 w-1 -translate-x-1/2 rounded-full bg-white shadow-lg ring-2 ring-slate-700 transition-all duration-500"
                      style={{ left: `${Math.min(97, Math.max(3, ((pricePerSqm - 1000) / (7000 - 1000)) * 100))}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-center text-xs font-bold text-slate-600 dark:text-slate-300">▲ {currency.format(pricePerSqm)}/m²</p>
                </div>
              </div>
            ) : null}

            <div className="mt-7 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Disclosure title="Standort und Karte" description="Adresse automatisch finden oder Koordinaten manuell korrigieren">
                <LocationFields
                  value={input.property.address}
                  onChange={(location) => setInput((current) => ({
                    ...current,
                    property: {
                      ...current.property,
                      address: { ...location, federalState: current.property.address.federalState }
                    }
                  }))}
                />
              </Disclosure>
            </div>

            <div className="mt-7 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Disclosure title="Zustand und KfW-relevante Angaben" description="Sanierung, Energieklasse und Ersterwerb">
                <div className="grid gap-5 sm:grid-cols-2">
                  <SelectField label="Zustand" value={input.property.condition} options={conditionOptions} onChange={(value) => onPropertyChange("condition", value as AnalysisInput["property"]["condition"])} />
                  <SelectField label="Energieklasse" value={input.property.energyClass ?? ""} options={[{ value: "", label: "Unbekannt" }, ...["A+", "A", "B", "C", "D", "E", "F", "G", "H"].map((value) => ({ value, label: value }))]} onChange={(value) => onPropertyChange("energyClass", value ? value as PropertyProfile["energyClass"] : undefined)} />
                  <Toggle checked={input.property.energeticRenovationPlanned} onChange={(checked) => onPropertyChange("energeticRenovationPlanned", checked)}>Energetische Sanierung geplant</Toggle>
                  <Toggle checked={input.property.firstPurchase} onChange={(checked) => onPropertyChange("firstPurchase", checked)}>Ersterwerb von Wohneigentum</Toggle>
                </div>
              </Disclosure>
              <Disclosure title="Weitere Immobiliendetails" description="Kosten, Adresse, Fläche und Mietannahmen">
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField label="Quell-URL" value={input.property.sourceUrl} onChange={(value) => onPropertyChange("sourceUrl", value || undefined)} type="url" />
                  <NumberField label="Grundstück" value={input.property.landArea} onChange={(value) => onPropertyChange("landArea", value ?? input.property.landArea)} suffix="m²" step="0.1" />
                  <NumberField label="Einheiten" value={input.property.numberOfUnits} onChange={(value) => onPropertyChange("numberOfUnits", value ?? input.property.numberOfUnits)} suffix="" />
                  <NumberField label="Baujahr" value={input.property.yearBuilt} onChange={(value) => onPropertyChange("yearBuilt", value)} suffix="" min="1800" allowEmpty />
                  <NumberField label="Hausgeld" value={input.property.monthlyHouseMoney} onChange={(value) => onPropertyChange("monthlyHouseMoney", value ?? input.property.monthlyHouseMoney)} />
                  <NumberField label="Nicht umlagefähige Kosten" value={input.property.monthlyNonRecoverableCosts} onChange={(value) => onPropertyChange("monthlyNonRecoverableCosts", value ?? input.property.monthlyNonRecoverableCosts)} />
                  <NumberField label="Renovierung" value={input.property.renovationCosts} onChange={(value) => onPropertyChange("renovationCosts", value ?? input.property.renovationCosts)} />
                  <NumberField label="Modernisierung" value={input.property.modernizationCosts} onChange={(value) => onPropertyChange("modernizationCosts", value ?? input.property.modernizationCosts)} />
                  <NumberField label="Ausstattung" value={input.property.furnishingCosts} onChange={(value) => onPropertyChange("furnishingCosts", value ?? input.property.furnishingCosts)} />
                  <NumberField label="Grunderwerbsteuer" value={input.property.realEstateTransferTaxPercent} onChange={(value) => onPropertyChange("realEstateTransferTaxPercent", value ?? input.property.realEstateTransferTaxPercent)} suffix="%" step="0.01" />
                  <NumberField label="Notar und Grundbuch" value={input.property.notaryAndLandRegistryPercent} onChange={(value) => onPropertyChange("notaryAndLandRegistryPercent", value ?? input.property.notaryAndLandRegistryPercent)} suffix="%" step="0.01" />
                  <NumberField label="Maklerprovision" value={input.property.brokerCommissionPercent} onChange={(value) => onPropertyChange("brokerCommissionPercent", value ?? input.property.brokerCommissionPercent)} suffix="%" step="0.01" />
                  <NumberField label="Erwarteter Leerstand" value={input.property.expectedVacancyPercent} onChange={(value) => onPropertyChange("expectedVacancyPercent", value ?? input.property.expectedVacancyPercent)} suffix="%" step="0.1" />
                  <NumberField label="Instandhaltung jährlich" value={input.property.annualMaintenancePercent} onChange={(value) => onPropertyChange("annualMaintenancePercent", value ?? input.property.annualMaintenancePercent)} suffix="%" step="0.1" />
                </div>
              </Disclosure>
              <Disclosure title="Exposé-Text auswerten" description="Optional: Daten aus kopiertem Text erkennen">
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Füge den Text eines Angebots ein. Erkannte Werte werden übernommen, müssen aber von dir kontrolliert werden.</p>
                <textarea value={importText} onChange={(event) => setImportText(event.target.value)} rows={5} aria-label="Exposé-Text" className="mt-4 w-full rounded-2xl border border-slate-300 bg-white p-4 text-ink outline-none transition focus:border-teal focus:ring-4 focus:ring-teal-100 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-teal-950" />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button type="button" size="sm" disabled={importText.trim().length < 50} onClick={onImportText}>Daten erkennen</Button>
                  {importStatus ? <p className="text-sm text-slate-600 dark:text-slate-300" aria-live="polite">{importStatus}</p> : null}
                </div>
              </Disclosure>
            </div>
          </WizardPanel>
        ) : null}

        {step === 3 ? (
          <WizardPanel eyebrow="3 · Haushalt" title="Was ist für deinen Haushalt realistisch?" description="Wir berechnen Einkommen, laufende Belastungen und Eigenkapital bei einem gemeinsamen Kauf zusammen.">
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField label="Familienstand" value={input.user.maritalStatus} options={maritalOptions} onChange={(value) => onUserChange("maritalStatus", value as AnalysisInput["user"]["maritalStatus"])} error={fieldError("user.maritalStatus")} fieldKey="user.maritalStatus" />
              <ChoiceGroup label="Kaufart" value={input.user.purchaseType} options={[{ value: "alone", label: "Allein kaufen" }, { value: "joint", label: "Gemeinsam kaufen" }]} onChange={(value) => onUserChange("purchaseType", value as AnalysisInput["user"]["purchaseType"])} error={fieldError("user.purchaseType")} fieldKey="user.purchaseType" />
              <NumberField label="Dein monatliches Nettoeinkommen" value={input.user.householdNetIncome} onChange={(value) => onUserChange("householdNetIncome", value ?? input.user.householdNetIncome)} error={fieldError("user.householdNetIncome")} fieldKey="user.householdNetIncome" />
              <NumberField label="Monatliche Lebenshaltung" value={input.user.monthlyLivingCosts} onChange={(value) => onUserChange("monthlyLivingCosts", value ?? input.user.monthlyLivingCosts)} hint="Ohne neue Immobilienrate" error={fieldError("user.monthlyLivingCosts")} fieldKey="user.monthlyLivingCosts" />
              <NumberField label="Bestehende Kreditraten" value={input.user.existingLoanPayments} onChange={(value) => onUserChange("existingLoanPayments", value ?? input.user.existingLoanPayments)} />
              <NumberField label="Verfügbares Eigenkapital" value={input.user.availableEquity} onChange={(value) => onUserChange("availableEquity", value ?? input.user.availableEquity)} error={fieldError("user.availableEquity")} fieldKey="user.availableEquity" />
              <NumberField label="Kinder im Haushalt" value={input.user.numberOfChildren} onChange={(value) => onUserChange("numberOfChildren", value ?? input.user.numberOfChildren)} suffix="" error={fieldError("user.numberOfChildren")} fieldKey="user.numberOfChildren" />
              <SelectField label="Beschäftigung" value={input.user.employmentStatus} options={employmentOptions} onChange={(value) => onUserChange("employmentStatus", value as AnalysisInput["user"]["employmentStatus"])} error={fieldError("user.employmentStatus")} fieldKey="user.employmentStatus" />
            </div>

            {partner ? (
              <div className="mt-7 rounded-2xl border border-slate-200 dark:border-slate-700">
                <Disclosure title="Partnerdaten ergänzen" description="Optional, verbessert aber die gemeinsame Haushaltsrechnung">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <NumberField label="Nettoeinkommen Partner" value={partner.monthlyNetIncome} onChange={(value) => onPartnerChange("monthlyNetIncome", value ?? partner.monthlyNetIncome)} />
                    <NumberField label="Zusätzliche Einnahmen Partner" value={partner.additionalMonthlyIncome} onChange={(value) => onPartnerChange("additionalMonthlyIncome", value ?? partner.additionalMonthlyIncome)} />
                    <SelectField label="Beschäftigung Partner" value={partner.employmentStatus} options={employmentOptions} onChange={(value) => onPartnerChange("employmentStatus", value as NonNullable<AnalysisInput["user"]["partner"]>["employmentStatus"])} />
                    <NumberField label="Kreditraten Partner" value={partner.existingLoanPayments} onChange={(value) => onPartnerChange("existingLoanPayments", value ?? partner.existingLoanPayments)} />
                    <NumberField label="Eigenkapital Partner" value={partner.availableEquity} onChange={(value) => onPartnerChange("availableEquity", value ?? partner.availableEquity)} />
                    <NumberField label="Jahresbrutto Partner" value={partner.annualGrossIncome} onChange={(value) => onPartnerChange("annualGrossIncome", value ?? partner.annualGrossIncome)} />
                    <NumberField label="Grenzsteuersatz Partner" value={partner.marginalTaxRatePercent} onChange={(value) => onPartnerChange("marginalTaxRatePercent", value ?? partner.marginalTaxRatePercent)} suffix="%" step="0.1" />
                  </div>
                </Disclosure>
              </div>
            ) : null}

            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-bold text-ink dark:text-white">Tragbarkeits-Analyse</p>
                <span className={clsx("rounded-full px-3 py-1 text-xs font-bold", monthlyReserve >= 200 ? "bg-teal/10 text-teal dark:bg-teal-950 dark:text-teal-300" : monthlyReserve >= 0 ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300")}>
                  {monthlyReserve >= 200 ? "✓ Tragbar" : monthlyReserve >= 0 ? "! Knapp" : "✗ Kritisch"}
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Monatliches Netto</span>
                    <span className="font-bold text-ink dark:text-white">{currency.format(totalIncome)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full rounded-full bg-teal" style={{ width: "100%" }} /></div>
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Lebenshaltung</span>
                    <span className="font-bold text-ink dark:text-white">{currency.format(input.user.monthlyLivingCosts)} ({livingCostPercent} %)</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className={clsx("h-full rounded-full transition-all", livingCostPercent > 60 ? "bg-red-500" : livingCostPercent > 45 ? "bg-amber-400" : "bg-slate-400")} style={{ width: `${Math.min(100, livingCostPercent)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Neue Kreditrate</span>
                    <span className="font-bold text-ink dark:text-white">{currency.format(liveCalculation.financing.monthlyLoanRate)} ({ratePercent} %)</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className={clsx("h-full rounded-full transition-all", ratePercent > 40 ? "bg-red-500" : ratePercent > 35 ? "bg-amber-400" : "bg-teal")} style={{ width: `${Math.min(100, ratePercent)}%` }} />
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className={clsx("rounded-xl p-3", ratePercent <= 35 ? "bg-teal/8 dark:bg-teal-950/50" : ratePercent <= 40 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-red-50 dark:bg-red-950/30")}>
                  <p className={clsx("text-xs font-bold", ratePercent <= 35 ? "text-teal" : ratePercent <= 40 ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400")}>{ratePercent <= 35 ? "✓" : ratePercent <= 40 ? "!" : "✗"} Rate / Einkommen</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{ratePercent} % {ratePercent <= 35 ? "(< 35 %)" : ratePercent <= 40 ? "(Grenzbereich)" : "(Zu hoch)"}</p>
                </div>
                <div className={clsx("rounded-xl p-3", equityPercent >= 20 ? "bg-teal/8 dark:bg-teal-950/50" : equityPercent >= 15 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-red-50 dark:bg-red-950/30")}>
                  <p className={clsx("text-xs font-bold", equityPercent >= 20 ? "text-teal" : equityPercent >= 15 ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400")}>{equityPercent >= 20 ? "✓" : equityPercent >= 15 ? "!" : "✗"} Eigenkapital</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{equityPercent} % vom Kaufpreis</p>
                </div>
                <div className={clsx("rounded-xl p-3", monthlyReserve >= 200 ? "bg-teal/8 dark:bg-teal-950/50" : monthlyReserve >= 0 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-red-50 dark:bg-red-950/30")}>
                  <p className={clsx("text-xs font-bold", monthlyReserve >= 200 ? "text-teal" : monthlyReserve >= 0 ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400")}>{monthlyReserve >= 200 ? "✓" : monthlyReserve >= 0 ? "!" : "✗"} Reserve / Monat</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{currency.format(Math.abs(monthlyReserve))}{monthlyReserve < 0 ? " Lücke" : " verbleiben"}</p>
                </div>
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Disclosure title="Weitere Haushalts- und Steuerdaten" description="Reserve, Bruttoeinkommen und persönliches Risikoprofil">
                <div className="grid gap-5 sm:grid-cols-2">
                  <NumberField label="Zusätzliche Einnahmen" value={input.user.additionalMonthlyIncome} onChange={(value) => onUserChange("additionalMonthlyIncome", value ?? input.user.additionalMonthlyIncome)} />
                  <NumberField label="Notfallreserve" value={input.user.emergencyReserve} onChange={(value) => onUserChange("emergencyReserve", value ?? input.user.emergencyReserve)} />
                  <NumberField label="Gewünschte Restreserve" value={input.user.desiredRemainingReserve} onChange={(value) => onUserChange("desiredRemainingReserve", value ?? input.user.desiredRemainingReserve)} />
                  <NumberField label="Maximale Monatsrate" value={input.user.plannedMonthlyMaximumRate} onChange={(value) => onUserChange("plannedMonthlyMaximumRate", value ?? input.user.plannedMonthlyMaximumRate)} />
                  <NumberField label="Erwachsene" value={input.user.numberOfAdults} onChange={(value) => onUserChange("numberOfAdults", value ?? input.user.numberOfAdults)} suffix="" />
                  <NumberField label="Jahresbrutto" value={input.user.annualGrossIncome} onChange={(value) => onUserChange("annualGrossIncome", value ?? input.user.annualGrossIncome)} />
                  <NumberField label="Grenzsteuersatz" value={input.user.marginalTaxRatePercent} onChange={(value) => onUserChange("marginalTaxRatePercent", value ?? input.user.marginalTaxRatePercent)} suffix="%" step="0.1" hint="Nur für die unverbindliche Steuerschätzung" />
                  <SelectField label="Risikoprofil" value={input.user.riskPreference} options={[{ value: "conservative", label: "Sicherheitsorientiert" }, { value: "balanced", label: "Ausgewogen" }, { value: "growth", label: "Wachstumsorientiert" }]} onChange={(value) => onUserChange("riskPreference", value as AnalysisInput["user"]["riskPreference"])} />
                </div>
              </Disclosure>
            </div>
          </WizardPanel>
        ) : null}

        {step === 4 ? (
          <WizardPanel eyebrow="4 · Finanzierung" title="Wie soll der Kauf finanziert werden?" description="Wenn du noch kein Angebot hast, nutze realistische Annahmen. Du kannst sie später jederzeit ändern.">
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField label="Eigenkapital für diesen Kauf" value={input.financing.equityForPurchase} onChange={(value) => onFinancingChange("equityForPurchase", value ?? input.financing.equityForPurchase)} error={fieldError("financing.equityForPurchase")} fieldKey="financing.equityForPurchase" />
              <NumberField label="Sollzins pro Jahr" value={input.financing.annualInterestRatePercent} onChange={(value) => onFinancingChange("annualInterestRatePercent", value ?? input.financing.annualInterestRatePercent)} suffix="%" step="0.01" error={fieldError("financing.annualInterestRatePercent")} fieldKey="financing.annualInterestRatePercent" />
              <NumberField label="Anfängliche Tilgung pro Jahr" value={input.financing.initialRepaymentPercent} onChange={(value) => onFinancingChange("initialRepaymentPercent", value ?? input.financing.initialRepaymentPercent)} suffix="%" step="0.01" error={fieldError("financing.initialRepaymentPercent")} fieldKey="financing.initialRepaymentPercent" />
              <NumberField label="Zinsbindung" value={input.financing.fixedInterestYears} onChange={(value) => onFinancingChange("fixedInterestYears", value ?? input.financing.fixedInterestYears)} suffix="Jahre" error={fieldError("financing.fixedInterestYears")} fieldKey="financing.fixedInterestYears" />
            </div>
            {input.financing.annualInterestRatePercent > 0 && input.financing.initialRepaymentPercent > 0 ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Kreditbetrag</p>
                    <p className="mt-1 text-lg font-black text-ink dark:text-white">{currency.format(liveCalculation.financing.requiredLoanAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Monatsrate</p>
                    <p className="mt-1 text-lg font-black text-teal dark:text-teal-400">{currency.format(monthlyRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Restschuld nach {input.financing.fixedInterestYears} J.</p>
                    <p className={clsx("mt-1 text-lg font-black", liveCalculation.financing.remainingDebtAfterFixedPeriod > liveCalculation.financing.requiredLoanAmount * 0.6 ? "text-amber-600 dark:text-amber-400" : "text-ink dark:text-white")}>{currency.format(liveCalculation.financing.remainingDebtAfterFixedPeriod)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Beleihungsauslauf</p>
                    <p className={clsx("mt-1 text-lg font-black", liveCalculation.financing.loanToValuePercent > 90 ? "text-red-600 dark:text-red-400" : liveCalculation.financing.loanToValuePercent > 80 ? "text-amber-600 dark:text-amber-400" : "text-teal dark:text-teal-400")}>{liveCalculation.financing.loanToValuePercent.toFixed(0)} %</p>
                  </div>
                </div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tilgungsverlauf</p>
                <div className="space-y-2.5">
                  {[
                    { label: "Start", debt: liveCalculation.financing.requiredLoanAmount, warn: false },
                    { label: `${input.financing.fixedInterestYears} J.`, debt: liveCalculation.financing.remainingDebtAfterFixedPeriod, warn: liveCalculation.financing.remainingDebtAfterFixedPeriod > liveCalculation.financing.requiredLoanAmount * 0.5 },
                  ].map((row) => {
                    const base = liveCalculation.financing.requiredLoanAmount;
                    const pct = base > 0 ? Math.max(2, Math.min(100, (row.debt / base) * 100)) : 100;
                    return (
                      <div key={row.label} className="flex items-center gap-3">
                        <span className="w-10 shrink-0 text-xs text-slate-500 dark:text-slate-400">{row.label}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div className={clsx("h-full rounded-full transition-all duration-500", row.warn ? "bg-amber-400" : "bg-teal")} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={clsx("w-24 shrink-0 text-right text-xs font-bold", row.warn ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-300")}>{currency.format(row.debt)}</span>
                      </div>
                    );
                  })}
                </div>
                {liveCalculation.financing.remainingDebtAfterFixedPeriod > liveCalculation.financing.requiredLoanAmount * 0.5 ? (
                  <p className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-400">⚠ Nach der Zinsbindung sind noch {currency.format(liveCalculation.financing.remainingDebtAfterFixedPeriod)} offen — Anschlussfinanzierung rechtzeitig planen.</p>
                ) : null}
              </div>
            ) : null}
            <div className="mt-7 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Disclosure title="Finanzierung verfeinern" description="Laufzeit, Sondertilgung und Anschlusszins">
                <div className="grid gap-5 sm:grid-cols-2">
                  <NumberField label="Gesamtlaufzeit" value={input.financing.totalTermYears} onChange={(value) => onFinancingChange("totalTermYears", value ?? input.financing.totalTermYears)} suffix="Jahre" error={fieldError("financing.totalTermYears")} fieldKey="financing.totalTermYears" />
                  <NumberField label="Zusätzliche Monatszahlung" value={input.financing.additionalMonthlyPayment} onChange={(value) => onFinancingChange("additionalMonthlyPayment", value ?? input.financing.additionalMonthlyPayment)} />
                  <NumberField label="Jährliche Sondertilgung" value={input.financing.annualSpecialRepaymentPercent} onChange={(value) => onFinancingChange("annualSpecialRepaymentPercent", value ?? input.financing.annualSpecialRepaymentPercent)} suffix="%" step="0.01" />
                  <NumberField label="Erwarteter Anschlusszins" value={input.financing.expectedInterestAfterFixedPeriodPercent} onChange={(value) => onFinancingChange("expectedInterestAfterFixedPeriodPercent", value)} suffix="%" step="0.01" allowEmpty />
                  <NumberField label="Maximaler Beleihungsauslauf" value={input.financing.desiredMaximumLoanToValuePercent} onChange={(value) => onFinancingChange("desiredMaximumLoanToValuePercent", value ?? input.financing.desiredMaximumLoanToValuePercent)} suffix="%" step="0.1" />
                  <Toggle checked={input.financing.includePurchaseCostsInLoan} onChange={(checked) => onFinancingChange("includePurchaseCostsInLoan", checked)}>Kaufnebenkosten mitfinanzieren</Toggle>
                  <Toggle checked={input.financing.includeRenovationInLoan} onChange={(checked) => onFinancingChange("includeRenovationInLoan", checked)}>Projektkosten mitfinanzieren</Toggle>
                </div>
              </Disclosure>
            </div>
          </WizardPanel>
        ) : null}

        {step === 5 ? (
          <WizardPanel eyebrow="5 · Prüfen" title="Alles bereit für die Analyse?" description="Jede Zeile zeigt eine Schlüsselkennzahl. Mit ›ändern‹ springst du direkt zurück zum richtigen Schritt.">
            <div className="mb-6 flex items-start justify-between gap-4">
              <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">Die KI-Erklärungen passen sich deinen Angaben an. Nach dem Start erhältst du zuerst das Gesamtbild.</p>
              <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Score</p>
                <p className={clsx("mt-1 text-3xl font-black leading-none", score >= 80 ? "text-teal" : score >= 60 ? "text-amber-500" : "text-red-500")}>{score}</p>
                <p className={clsx("mt-0.5 text-xs font-bold", score >= 80 ? "text-teal" : score >= 60 ? "text-amber-500" : "text-red-500")}>{score >= 80 ? "Gut" : score >= 60 ? "Okay" : "Kritisch"}</p>
              </div>
            </div>
            <div className="grid gap-2">
              {[
                { ok: equityPercent >= 20, warn: equityPercent >= 15, label: `Eigenkapital ${equityPercent} %`, detail: `${currency.format(totalEquity)} von ${currency.format(input.property.purchasePrice)} — Empfehlung min. 20 %`, targetStep: 3 },
                { ok: ratePercent <= 35, warn: ratePercent <= 40, label: `Rate ${ratePercent} % des Einkommens`, detail: `${currency.format(monthlyRate)} von ${currency.format(totalIncome)} — Banken empfehlen < 35 %`, targetStep: 4 },
                { ok: monthlyReserve >= 200, warn: monthlyReserve >= 0, label: `Monatliche Reserve ${currency.format(monthlyReserve)}`, detail: monthlyReserve >= 200 ? "Positiv — ausreichender Puffer vorhanden" : monthlyReserve >= 0 ? "Knapp — min. 200–300 € empfohlen" : "Lücke — Kaufpreis oder Eigenkapital anpassen", targetStep: 3 },
                { ok: liveCalculation.financing.loanToValuePercent <= 80, warn: liveCalculation.financing.loanToValuePercent <= 90, label: `Beleihungsauslauf ${liveCalculation.financing.loanToValuePercent.toFixed(0)} %`, detail: liveCalculation.financing.loanToValuePercent <= 80 ? "✓ Unter 80 % — gute Konditionen möglich" : liveCalculation.financing.loanToValuePercent <= 90 ? "! 80–90 % — leicht erhöhter Zinszuschlag" : "✗ Über 90 % — viele Banken verlangen Zuschläge", targetStep: 4 },
              ].map((item) => (
                <div key={item.label} className={clsx("flex items-start gap-3 rounded-xl p-3", item.ok ? "bg-teal/5 dark:bg-teal-950/30" : item.warn ? "bg-amber-50 dark:bg-amber-950/20" : "bg-red-50 dark:bg-red-950/20")}>
                  <span className="mt-0.5 shrink-0 text-base">{item.ok ? "✅" : item.warn ? "⚠️" : "❌"}</span>
                  <div className="min-w-0 flex-1">
                    <p className={clsx("text-sm font-bold", item.ok ? "text-teal dark:text-teal-300" : item.warn ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400")}>{item.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>
                  </div>
                  <button type="button" onClick={() => moveToStep(item.targetStep)} className="shrink-0 text-xs font-bold text-slate-400 underline hover:text-teal dark:hover:text-teal-400">ändern</button>
                </div>
              ))}
            </div>
            <div className="mt-7 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Disclosure title="Steuer- und Prognoseannahmen prüfen" description="Alle Ergebnisse sind Schätzungen und ersetzen keine Beratung">
                <div className="grid gap-5 sm:grid-cols-2">
                  <NumberField label="Gebäudeanteil" value={input.settings.buildingValueSharePercent} onChange={(value) => onSettingsChange("buildingValueSharePercent", value ?? input.settings.buildingValueSharePercent)} suffix="%" step="0.1" />
                  <NumberField label="AfA-Satz" value={input.settings.depreciationRatePercent} onChange={(value) => onSettingsChange("depreciationRatePercent", value ?? input.settings.depreciationRatePercent)} suffix="%" step="0.1" />
                  <NumberField label="Grenzsteuersatz" value={input.settings.marginalTaxRatePercent} onChange={(value) => onSettingsChange("marginalTaxRatePercent", value ?? input.settings.marginalTaxRatePercent)} suffix="%" step="0.1" />
                  <NumberField label="Wertentwicklung jährlich" value={input.settings.annualPropertyValueGrowthPercent} onChange={(value) => onSettingsChange("annualPropertyValueGrowthPercent", value ?? input.settings.annualPropertyValueGrowthPercent)} suffix="%" step="0.1" min="-20" />
                  <NumberField label="Mietentwicklung jährlich" value={input.settings.annualRentGrowthPercent} onChange={(value) => onSettingsChange("annualRentGrowthPercent", value ?? input.settings.annualRentGrowthPercent)} suffix="%" step="0.1" min="-20" />
                  <NumberField label="Kostensteigerung jährlich" value={input.settings.annualCostGrowthPercent} onChange={(value) => onSettingsChange("annualCostGrowthPercent", value ?? input.settings.annualCostGrowthPercent)} suffix="%" step="0.1" min="-20" />
                  <NumberField label="Sicherheitsabschlag Einkommen" value={input.settings.incomeSafetyReductionPercent} onChange={(value) => onSettingsChange("incomeSafetyReductionPercent", value ?? input.settings.incomeSafetyReductionPercent)} suffix="%" step="0.1" />
                  <NumberField label="Prognosezeitraum" value={input.settings.projectionYears} onChange={(value) => onSettingsChange("projectionYears", value ?? input.settings.projectionYears)} suffix="Jahre" />
                  <Toggle checked={input.settings.calculateTaxScenario} onChange={(checked) => onSettingsChange("calculateTaxScenario", checked)}>Steuerliche Orientierung berechnen</Toggle>
                  <Toggle checked={input.settings.calculateSubsidyScenario} onChange={(checked) => onSettingsChange("calculateSubsidyScenario", checked)}>Fördermöglichkeiten prüfen</Toggle>
                </div>
              </Disclosure>
            </div>
          </WizardPanel>
        ) : null}

        {errors.length ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100" role="alert">
            <h2 className="font-bold">Bitte prüfe diese Angaben</h2>
            <ul className="mt-3 space-y-2 text-sm">{errors.map((error, index) => <li key={`${error.field}-${index}`}>{error.message}</li>)}</ul>
          </section>
        ) : null}

        {analysisStatus ? <p aria-live="polite" className="rounded-2xl border border-teal-200 bg-mint px-5 py-4 text-sm font-semibold text-teal dark:border-teal-800 dark:bg-teal-950 dark:text-teal-100">{analysisStatus}</p> : null}

        <div className="sticky bottom-3 z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex items-center gap-1.5 px-4 pb-1 pt-2.5">
            {stepLabels.map((_, i) => (
              <div key={i} className={clsx("h-1 flex-1 rounded-full transition-all duration-300", i + 1 < step ? "bg-teal" : i + 1 === step ? "bg-teal/50" : "bg-slate-200 dark:bg-slate-700")} />
            ))}
            <span className="ml-2 shrink-0 text-xs font-bold text-slate-400 dark:text-slate-500">{step}/{stepLabels.length}</span>
          </div>
          <div className="flex items-center justify-between gap-3 p-3 pt-1">
            <Button variant="ghost" onClick={() => moveToStep(step - 1)} disabled={step === 1} className="shrink-0"><ArrowLeft size={16} aria-hidden="true" /></Button>
            <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{stepLabels[step - 1]}</p>
            {step < stepLabels.length ? (
              <Button onClick={() => moveToStep(step + 1)} className="shrink-0">Weiter <ArrowRight size={16} aria-hidden="true" /></Button>
            ) : (
              <Button onClick={runValidatedAnalysis} disabled={loading} size="lg" className="shrink-0">{loading ? "Wird berechnet …" : "🚀 Analyse starten"}</Button>
            )}
          </div>
        </div>
        </div>
        <aside className="rounded-3xl border border-teal-100 bg-white p-5 shadow-sm dark:border-teal-900 dark:bg-slate-900 xl:sticky xl:top-24" aria-label="KI-Begleitung">
          <div className="flex items-center gap-2 text-sm font-black text-teal"><span className="relative grid h-9 w-9 place-items-center rounded-xl bg-mint dark:bg-teal-950"><Sparkles size={18} /><span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-teal ring-2 ring-white dark:ring-slate-900" /></span>KI-Begleitung</div>
          {kiAlerts.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {kiAlerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                  <span className="shrink-0 text-sm">⚠️</span>
                  <p className="text-xs leading-5 text-amber-800 dark:text-amber-300">{alert}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-5 grid gap-3">
            <section className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><h2 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Was passiert gerade?</h2><p className="mt-2 text-sm leading-6 text-ink dark:text-white">{guide.now}</p></section>
            <section className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><h2 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Warum ist das wichtig?</h2><p className="mt-2 text-sm leading-6 text-ink dark:text-white">{guide.why}</p></section>
            <section className="rounded-2xl bg-mint p-4 dark:bg-teal-950"><h2 className="text-xs font-black uppercase tracking-[0.14em] text-teal">Als Nächstes</h2><p className="mt-2 text-sm leading-6 text-teal dark:text-teal-100">{guide.next}</p></section>
          </div>
          <section className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700" aria-live="polite">
            <div className="flex items-center justify-between gap-3"><h2 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Live-Berechnung</h2><span className="h-2 w-2 rounded-full bg-teal" /></div>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-3"><dt className="text-slate-500">Gesamtinvestition</dt><dd className="font-bold text-ink dark:text-white">{currency.format(liveCalculation.purchaseCosts.totalInvestmentCosts)}</dd></div>
              <div className="flex items-center justify-between gap-3"><dt className="text-slate-500">Monatsrate</dt><dd className={clsx("font-bold", ratePercent > 40 ? "text-red-600 dark:text-red-400" : ratePercent > 35 ? "text-amber-600 dark:text-amber-400" : "text-ink dark:text-white")}>{currency.format(monthlyRate)}</dd></div>
              <div className="flex items-center justify-between gap-3"><dt className="text-slate-500">Liquidität / Monat</dt><dd className={clsx("font-bold", monthlyReserve < 0 ? "text-red-600 dark:text-red-400" : monthlyReserve < 200 ? "text-amber-600 dark:text-amber-400" : "text-teal dark:text-teal-400")}>{currency.format(monthlyReserve)}</dd></div>
              {pricePerSqm > 0 ? <div className="flex items-center justify-between gap-3"><dt className="text-slate-500">Preis / m²</dt><dd className={clsx("font-bold", pricePerSqm > 5000 ? "text-amber-600 dark:text-amber-400" : "text-ink dark:text-white")}>{currency.format(pricePerSqm)}</dd></div> : null}
            </dl>
            <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500 dark:border-slate-700">Direkt aus der Calculation Engine. Die KI verändert diese Werte nicht.</p>
          </section>
          {step >= 3 ? (
            <section className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <h2 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Analyse-Score</h2>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div className={clsx("h-full rounded-full transition-all duration-500", score >= 80 ? "bg-teal" : score >= 60 ? "bg-amber-400" : "bg-red-500")} style={{ width: `${score}%` }} />
                  </div>
                </div>
                <span className={clsx("text-lg font-black", score >= 80 ? "text-teal" : score >= 60 ? "text-amber-500" : "text-red-500")}>{score}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{score >= 80 ? "Solide Ausgangslage" : score >= 60 ? "Akzeptabel mit Optimierungspotenzial" : "Kritische Punkte vorhanden"}</p>
            </section>
          ) : null}
          <section className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-teal"><Sparkles size={14} />KI-Kontext</h2><p className="mt-2 text-sm leading-6 text-ink dark:text-white">{contextHint}</p></section>
          {loading || analysisStatus ? <div className="mt-4 rounded-2xl border border-teal-100 p-4 dark:border-teal-900"><p className="flex items-center gap-2 text-sm font-bold text-teal"><Sparkles size={16} className="animate-pulse" />KI arbeitet</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"><div className="h-full w-3/4 animate-pulse rounded-full bg-teal" /></div><p className="mt-2 text-xs leading-5 text-slate-500">{analysisStatus || "Deine Angaben werden geprüft und berechnet."}</p></div> : null}
        </aside>
      </div>
    </div>
  );
}
