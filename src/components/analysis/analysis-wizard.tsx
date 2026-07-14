"use client";

import type { Dispatch, SetStateAction } from "react";
import { ArrowLeft, ArrowRight, Check, Cloud, Home, Landmark, SearchCheck } from "lucide-react";
import clsx from "clsx";
import { LocationFields } from "@/components/location/LocationFields";
import type { AnalysisInput, PropertyProfile } from "@/features/analysis/domain";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { UrlImporter, type ImportedProperty } from "./url-importer";

type ApiError = { field?: string; message: string };
type Option = { value: string; label: string };

type AnalysisWizardProps = {
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  input: AnalysisInput;
  setInput: Dispatch<SetStateAction<AnalysisInput>>;
  errors: ApiError[];
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

function NumberField({ label, value, onChange, suffix = "€", step = "1", min = "0", hint }: {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  suffix?: string;
  step?: string;
  min?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink dark:text-slate-100">{label}</span>
      {hint ? <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</span> : null}
      <span className="mt-2 flex overflow-hidden rounded-xl border border-slate-300 bg-white transition focus-within:border-teal focus-within:ring-4 focus-within:ring-teal-100 dark:border-slate-600 dark:bg-slate-950 dark:focus-within:ring-teal-950">
        <input type="number" value={value ?? ""} min={min} step={step} onChange={(event) => onChange(Number(event.target.value))} className="min-w-0 flex-1 bg-transparent px-4 py-3 text-ink outline-none dark:text-white" />
        {suffix ? <span className="border-l border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{suffix}</span> : null}
      </span>
    </label>
  );
}

function TextField({ label, value, onChange, type = "text", hint }: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  type?: "text" | "url";
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink dark:text-slate-100">{label}</span>
      {hint ? <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</span> : null}
      <input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-ink outline-none transition focus:border-teal focus:ring-4 focus:ring-teal-100 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-teal-950" />
    </label>
  );
}

function SelectField({ label, value, options, onChange, hint }: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink dark:text-slate-100">{label}</span>
      {hint ? <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</span> : null}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-ink outline-none transition focus:border-teal focus:ring-4 focus:ring-teal-100 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-teal-950">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
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

function ChoiceGroup({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-bold text-ink dark:text-white">{label}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const active = value === option.value;
          return <button key={option.value} type="button" aria-pressed={active} onClick={() => onChange(option.value)} className={clsx("flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-bold transition focus-visible:outline-none", active ? "border-teal bg-mint text-teal ring-2 ring-teal/10 dark:bg-teal-950 dark:text-teal-200" : "border-slate-300 bg-white text-slate-700 hover:border-teal-300 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200")}><span>{option.label}</span>{active ? <Check size={17} aria-hidden="true" /> : null}</button>;
        })}
      </div>
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
    step, setStep, input, setInput, errors, loading, analysisStatus, initialSourceUrl,
    importText, importStatus, setImportText, onImportText, onRun, onUserChange,
    onPartnerChange, onPropertyChange, onFinancingChange, onSettingsChange
  } = props;

  const partner = input.user.purchaseType === "joint" ? input.user.partner : undefined;
  const totalIncome = input.user.householdNetIncome + input.user.additionalMonthlyIncome + (partner?.monthlyNetIncome ?? 0) + (partner?.additionalMonthlyIncome ?? 0);
  const totalLoans = input.user.existingLoanPayments + (partner?.existingLoanPayments ?? 0);
  const totalEquity = input.user.availableEquity + (partner?.availableEquity ?? 0);
  const updateAddress = <K extends keyof AnalysisInput["property"]["address"]>(key: K, value: AnalysisInput["property"]["address"][K]) => {
    setInput((current) => ({ ...current, property: { ...current.property, address: { ...current.property.address, [key]: value } } }));
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
    setStep(Math.max(1, Math.min(stepLabels.length, nextStep)));
    window.setTimeout(() => {
      document.getElementById("analyse-fortschritt")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    }, 0);
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
          <p className="font-bold text-ink dark:text-white">Schritt {step} von {stepLabels.length}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{stepLabels[step - 1]}</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700" role="progressbar" aria-valuemin={1} aria-valuemax={stepLabels.length} aria-valuenow={step} aria-label={`Schritt ${step} von ${stepLabels.length}`}>
          <div className="h-full rounded-full bg-teal transition-all duration-300" style={{ width: `${step * 20}%` }} />
        </div>
        <div className="mt-4 hidden grid-cols-5 gap-2 sm:grid">
          {stepLabels.map((label, index) => (
            <button key={label} type="button" onClick={() => moveToStep(index + 1)} aria-current={step === index + 1 ? "step" : undefined} className={clsx("rounded-lg px-2 py-2 text-xs font-bold transition", step === index + 1 ? "bg-mint text-teal dark:bg-teal-950 dark:text-teal-200" : "text-slate-500 hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white")}>{index + 1}. {label}</button>
          ))}
        </div>
      </nav>

      <div className="mt-6 space-y-5">
        {step === 1 ? (
          <WizardPanel eyebrow="1 · Dein Ziel" title="Was möchtest du mit der Immobilie erreichen?" description="Diese Auswahl bestimmt, welche Kennzahlen, Förderungen und Steuerhinweise später wichtig sind.">
            <div className="mb-7 rounded-2xl border-2 border-teal/30 bg-mint/60 p-5 dark:border-teal-700 dark:bg-teal-950/40">
              <p className="font-black text-ink dark:text-white">Direkt mit einem Immobilienlink starten</p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Inserat einfügen, Eckdaten automatisch übernehmen und anschließend kontrollieren.</p>
              <div className="mt-4"><UrlImporter initialUrl={initialSourceUrl} onImported={handleImported} /></div>
            </div>
            <div className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /><span>oder manuell starten</span><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /></div>
            <div className="grid gap-3 lg:grid-cols-3">
              {[
                { value: "owner_occupation", icon: Home, title: "Selbst einziehen", text: "Bezahlbarkeit, Reserve und Förderungen stehen im Mittelpunkt." },
                { value: "capital_investment", icon: Landmark, title: "Vermieten", text: "Rendite, Cashflow, Steuern und Risiken werden vertieft." },
                { value: "mixed_use", icon: SearchCheck, title: "Teilweise vermieten", text: "Eigennutzung und Kapitalanlage werden gemeinsam betrachtet." }
              ].map((choice) => {
                const Icon = choice.icon;
                const active = input.user.purchaseGoal === choice.value;
                return (
                  <button key={choice.value} type="button" aria-pressed={active} onClick={() => onUserChange("purchaseGoal", choice.value as AnalysisInput["user"]["purchaseGoal"])} className={clsx("rounded-2xl border p-5 text-left transition focus-visible:outline-none", active ? "border-teal bg-mint ring-2 ring-teal/10 dark:bg-teal-950" : "border-slate-200 hover:border-teal-300 dark:border-slate-700 dark:hover:border-teal-700")}>
                    <span className={clsx("grid h-11 w-11 place-items-center rounded-xl", active ? "bg-teal text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}><Icon size={22} aria-hidden="true" /></span>
                    <span className="mt-5 block font-bold text-ink dark:text-white">{choice.title}</span>
                    <span className="mt-2 block text-sm leading-6 text-slate-600 dark:text-slate-300">{choice.text}</span>
                  </button>
                );
              })}
            </div>
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
              <div className="sm:col-span-2"><TextField label="Bezeichnung der Immobilie" value={input.property.title} onChange={(value) => onPropertyChange("title", value)} /></div>
              <SelectField label="Immobilientyp" value={input.property.propertyType} options={propertyOptions} onChange={(value) => onPropertyChange("propertyType", value as AnalysisInput["property"]["propertyType"])} />
              <ChoiceGroup label="Vorhaben" value={input.property.projectType} options={[{ value: "new_build", label: "Neubau" }, { value: "existing", label: "Bestand" }]} onChange={(value) => onPropertyChange("projectType", value as AnalysisInput["property"]["projectType"])} />
              <TextField label="Bundesland" value={input.property.address.federalState} onChange={(value) => updateAddress("federalState", value)} hint="Wichtig für Kaufnebenkosten und Landesförderungen" />
              <NumberField label="Kaufpreis" value={input.property.purchasePrice} onChange={(value) => onPropertyChange("purchasePrice", value)} />
              <NumberField label="Wohnfläche" value={input.property.livingArea} onChange={(value) => onPropertyChange("livingArea", value)} suffix="m²" step="0.1" />
              {input.user.purchaseGoal !== "owner_occupation" ? <NumberField label="Monatliche Kaltmiete" value={input.property.monthlyColdRent} onChange={(value) => onPropertyChange("monthlyColdRent", value)} /> : null}
              <SelectField label="Nutzung heute" value={input.property.occupancyType} options={occupancyOptions} onChange={(value) => onPropertyChange("occupancyType", value as AnalysisInput["property"]["occupancyType"])} />
            </div>

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
                  <NumberField label="Grundstück" value={input.property.landArea} onChange={(value) => onPropertyChange("landArea", value)} suffix="m²" step="0.1" />
                  <NumberField label="Einheiten" value={input.property.numberOfUnits} onChange={(value) => onPropertyChange("numberOfUnits", value)} suffix="" />
                  <NumberField label="Baujahr" value={input.property.yearBuilt} onChange={(value) => onPropertyChange("yearBuilt", value || undefined)} suffix="" min="1800" />
                  <NumberField label="Hausgeld" value={input.property.monthlyHouseMoney} onChange={(value) => onPropertyChange("monthlyHouseMoney", value)} />
                  <NumberField label="Nicht umlagefähige Kosten" value={input.property.monthlyNonRecoverableCosts} onChange={(value) => onPropertyChange("monthlyNonRecoverableCosts", value)} />
                  <NumberField label="Renovierung" value={input.property.renovationCosts} onChange={(value) => onPropertyChange("renovationCosts", value)} />
                  <NumberField label="Modernisierung" value={input.property.modernizationCosts} onChange={(value) => onPropertyChange("modernizationCosts", value)} />
                  <NumberField label="Ausstattung" value={input.property.furnishingCosts} onChange={(value) => onPropertyChange("furnishingCosts", value)} />
                  <NumberField label="Grunderwerbsteuer" value={input.property.realEstateTransferTaxPercent} onChange={(value) => onPropertyChange("realEstateTransferTaxPercent", value)} suffix="%" step="0.01" />
                  <NumberField label="Notar und Grundbuch" value={input.property.notaryAndLandRegistryPercent} onChange={(value) => onPropertyChange("notaryAndLandRegistryPercent", value)} suffix="%" step="0.01" />
                  <NumberField label="Maklerprovision" value={input.property.brokerCommissionPercent} onChange={(value) => onPropertyChange("brokerCommissionPercent", value)} suffix="%" step="0.01" />
                  <NumberField label="Erwarteter Leerstand" value={input.property.expectedVacancyPercent} onChange={(value) => onPropertyChange("expectedVacancyPercent", value)} suffix="%" step="0.1" />
                  <NumberField label="Instandhaltung jährlich" value={input.property.annualMaintenancePercent} onChange={(value) => onPropertyChange("annualMaintenancePercent", value)} suffix="%" step="0.1" />
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
              <SelectField label="Familienstand" value={input.user.maritalStatus} options={maritalOptions} onChange={(value) => onUserChange("maritalStatus", value as AnalysisInput["user"]["maritalStatus"])} />
              <ChoiceGroup label="Kaufart" value={input.user.purchaseType} options={[{ value: "alone", label: "Allein kaufen" }, { value: "joint", label: "Gemeinsam kaufen" }]} onChange={(value) => onUserChange("purchaseType", value as AnalysisInput["user"]["purchaseType"])} />
              <NumberField label="Dein monatliches Nettoeinkommen" value={input.user.householdNetIncome} onChange={(value) => onUserChange("householdNetIncome", value)} />
              <NumberField label="Monatliche Lebenshaltung" value={input.user.monthlyLivingCosts} onChange={(value) => onUserChange("monthlyLivingCosts", value)} hint="Ohne neue Immobilienrate" />
              <NumberField label="Bestehende Kreditraten" value={input.user.existingLoanPayments} onChange={(value) => onUserChange("existingLoanPayments", value)} />
              <NumberField label="Verfügbares Eigenkapital" value={input.user.availableEquity} onChange={(value) => onUserChange("availableEquity", value)} />
              <NumberField label="Kinder im Haushalt" value={input.user.numberOfChildren} onChange={(value) => onUserChange("numberOfChildren", value)} suffix="" />
              <SelectField label="Beschäftigung" value={input.user.employmentStatus} options={employmentOptions} onChange={(value) => onUserChange("employmentStatus", value as AnalysisInput["user"]["employmentStatus"])} />
            </div>

            {partner ? (
              <div className="mt-7 rounded-2xl border border-slate-200 dark:border-slate-700">
                <Disclosure title="Partnerdaten ergänzen" description="Optional, verbessert aber die gemeinsame Haushaltsrechnung">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <NumberField label="Nettoeinkommen Partner" value={partner.monthlyNetIncome} onChange={(value) => onPartnerChange("monthlyNetIncome", value)} />
                    <NumberField label="Zusätzliche Einnahmen Partner" value={partner.additionalMonthlyIncome} onChange={(value) => onPartnerChange("additionalMonthlyIncome", value)} />
                    <SelectField label="Beschäftigung Partner" value={partner.employmentStatus} options={employmentOptions} onChange={(value) => onPartnerChange("employmentStatus", value as NonNullable<AnalysisInput["user"]["partner"]>["employmentStatus"])} />
                    <NumberField label="Kreditraten Partner" value={partner.existingLoanPayments} onChange={(value) => onPartnerChange("existingLoanPayments", value)} />
                    <NumberField label="Eigenkapital Partner" value={partner.availableEquity} onChange={(value) => onPartnerChange("availableEquity", value)} />
                    <NumberField label="Jahresbrutto Partner" value={partner.annualGrossIncome} onChange={(value) => onPartnerChange("annualGrossIncome", value)} />
                    <NumberField label="Grenzsteuersatz Partner" value={partner.marginalTaxRatePercent} onChange={(value) => onPartnerChange("marginalTaxRatePercent", value)} suffix="%" step="0.1" />
                  </div>
                </Disclosure>
              </div>
            ) : null}

            <dl className="mt-7 grid gap-3 rounded-2xl bg-cloud p-4 dark:bg-slate-800 sm:grid-cols-3">
              <div><dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Haushaltseinkommen</dt><dd className="mt-1 font-bold text-ink dark:text-white">{currency.format(totalIncome)} / Monat</dd></div>
              <div><dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bestehende Kreditraten</dt><dd className="mt-1 font-bold text-ink dark:text-white">{currency.format(totalLoans)} / Monat</dd></div>
              <div><dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Eigenkapital gesamt</dt><dd className="mt-1 font-bold text-ink dark:text-white">{currency.format(totalEquity)}</dd></div>
            </dl>

            <div className="mt-7 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Disclosure title="Weitere Haushalts- und Steuerdaten" description="Reserve, Bruttoeinkommen und persönliches Risikoprofil">
                <div className="grid gap-5 sm:grid-cols-2">
                  <NumberField label="Zusätzliche Einnahmen" value={input.user.additionalMonthlyIncome} onChange={(value) => onUserChange("additionalMonthlyIncome", value)} />
                  <NumberField label="Notfallreserve" value={input.user.emergencyReserve} onChange={(value) => onUserChange("emergencyReserve", value)} />
                  <NumberField label="Gewünschte Restreserve" value={input.user.desiredRemainingReserve} onChange={(value) => onUserChange("desiredRemainingReserve", value)} />
                  <NumberField label="Maximale Monatsrate" value={input.user.plannedMonthlyMaximumRate} onChange={(value) => onUserChange("plannedMonthlyMaximumRate", value)} />
                  <NumberField label="Erwachsene" value={input.user.numberOfAdults} onChange={(value) => onUserChange("numberOfAdults", value)} suffix="" />
                  <NumberField label="Jahresbrutto" value={input.user.annualGrossIncome} onChange={(value) => onUserChange("annualGrossIncome", value)} />
                  <NumberField label="Grenzsteuersatz" value={input.user.marginalTaxRatePercent} onChange={(value) => onUserChange("marginalTaxRatePercent", value)} suffix="%" step="0.1" hint="Nur für die unverbindliche Steuerschätzung" />
                  <SelectField label="Risikoprofil" value={input.user.riskPreference} options={[{ value: "conservative", label: "Sicherheitsorientiert" }, { value: "balanced", label: "Ausgewogen" }, { value: "growth", label: "Wachstumsorientiert" }]} onChange={(value) => onUserChange("riskPreference", value as AnalysisInput["user"]["riskPreference"])} />
                </div>
              </Disclosure>
            </div>
          </WizardPanel>
        ) : null}

        {step === 4 ? (
          <WizardPanel eyebrow="4 · Finanzierung" title="Wie soll der Kauf finanziert werden?" description="Wenn du noch kein Angebot hast, nutze realistische Annahmen. Du kannst sie später jederzeit ändern.">
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField label="Eigenkapital für diesen Kauf" value={input.financing.equityForPurchase} onChange={(value) => onFinancingChange("equityForPurchase", value)} />
              <NumberField label="Sollzins pro Jahr" value={input.financing.annualInterestRatePercent} onChange={(value) => onFinancingChange("annualInterestRatePercent", value)} suffix="%" step="0.01" />
              <NumberField label="Anfängliche Tilgung pro Jahr" value={input.financing.initialRepaymentPercent} onChange={(value) => onFinancingChange("initialRepaymentPercent", value)} suffix="%" step="0.01" />
              <NumberField label="Zinsbindung" value={input.financing.fixedInterestYears} onChange={(value) => onFinancingChange("fixedInterestYears", value)} suffix="Jahre" />
            </div>
            <div className="mt-7 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Disclosure title="Finanzierung verfeinern" description="Laufzeit, Sondertilgung und Anschlusszins">
                <div className="grid gap-5 sm:grid-cols-2">
                  <NumberField label="Gesamtlaufzeit" value={input.financing.totalTermYears} onChange={(value) => onFinancingChange("totalTermYears", value)} suffix="Jahre" />
                  <NumberField label="Zusätzliche Monatszahlung" value={input.financing.additionalMonthlyPayment} onChange={(value) => onFinancingChange("additionalMonthlyPayment", value)} />
                  <NumberField label="Jährliche Sondertilgung" value={input.financing.annualSpecialRepaymentPercent} onChange={(value) => onFinancingChange("annualSpecialRepaymentPercent", value)} suffix="%" step="0.01" />
                  <NumberField label="Erwarteter Anschlusszins" value={input.financing.expectedInterestAfterFixedPeriodPercent} onChange={(value) => onFinancingChange("expectedInterestAfterFixedPeriodPercent", value)} suffix="%" step="0.01" />
                  <NumberField label="Maximaler Beleihungsauslauf" value={input.financing.desiredMaximumLoanToValuePercent} onChange={(value) => onFinancingChange("desiredMaximumLoanToValuePercent", value)} suffix="%" step="0.1" />
                  <Toggle checked={input.financing.includePurchaseCostsInLoan} onChange={(checked) => onFinancingChange("includePurchaseCostsInLoan", checked)}>Kaufnebenkosten mitfinanzieren</Toggle>
                  <Toggle checked={input.financing.includeRenovationInLoan} onChange={(checked) => onFinancingChange("includeRenovationInLoan", checked)}>Projektkosten mitfinanzieren</Toggle>
                </div>
              </Disclosure>
            </div>
          </WizardPanel>
        ) : null}

        {step === 5 ? (
          <WizardPanel eyebrow="5 · Prüfen" title="Sind die wichtigsten Angaben richtig?" description="Nach dem Start erhältst du zuerst eine klare Gesamtbewertung und danach optional die Details.">
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-cloud p-4 dark:bg-slate-800"><dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Immobilie</dt><dd className="mt-1 font-bold text-ink dark:text-white">{currency.format(input.property.purchasePrice)}</dd><dd className="mt-1 text-sm text-slate-600 dark:text-slate-300">{input.property.address.city || "Ort noch offen"} · {input.property.livingArea} m²</dd></div>
              <div className="rounded-2xl bg-cloud p-4 dark:bg-slate-800"><dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Haushalt</dt><dd className="mt-1 font-bold text-ink dark:text-white">{currency.format(totalIncome)} / Monat</dd><dd className="mt-1 text-sm text-slate-600 dark:text-slate-300">{input.user.purchaseType === "joint" ? "Gemeinsamer Kauf" : "Kauf allein"}</dd></div>
              <div className="rounded-2xl bg-cloud p-4 dark:bg-slate-800"><dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Finanzierung</dt><dd className="mt-1 font-bold text-ink dark:text-white">{input.financing.annualInterestRatePercent.toFixed(2)} % Sollzins</dd><dd className="mt-1 text-sm text-slate-600 dark:text-slate-300">{currency.format(input.financing.equityForPurchase)} Eigenkapital</dd></div>
            </dl>
            <div className="mt-7 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Disclosure title="Steuer- und Prognoseannahmen prüfen" description="Alle Ergebnisse sind Schätzungen und ersetzen keine Beratung">
                <div className="grid gap-5 sm:grid-cols-2">
                  <NumberField label="Gebäudeanteil" value={input.settings.buildingValueSharePercent} onChange={(value) => onSettingsChange("buildingValueSharePercent", value)} suffix="%" step="0.1" />
                  <NumberField label="AfA-Satz" value={input.settings.depreciationRatePercent} onChange={(value) => onSettingsChange("depreciationRatePercent", value)} suffix="%" step="0.1" />
                  <NumberField label="Grenzsteuersatz" value={input.settings.marginalTaxRatePercent} onChange={(value) => onSettingsChange("marginalTaxRatePercent", value)} suffix="%" step="0.1" />
                  <NumberField label="Wertentwicklung jährlich" value={input.settings.annualPropertyValueGrowthPercent} onChange={(value) => onSettingsChange("annualPropertyValueGrowthPercent", value)} suffix="%" step="0.1" min="-20" />
                  <NumberField label="Mietentwicklung jährlich" value={input.settings.annualRentGrowthPercent} onChange={(value) => onSettingsChange("annualRentGrowthPercent", value)} suffix="%" step="0.1" min="-20" />
                  <NumberField label="Kostensteigerung jährlich" value={input.settings.annualCostGrowthPercent} onChange={(value) => onSettingsChange("annualCostGrowthPercent", value)} suffix="%" step="0.1" min="-20" />
                  <NumberField label="Sicherheitsabschlag Einkommen" value={input.settings.incomeSafetyReductionPercent} onChange={(value) => onSettingsChange("incomeSafetyReductionPercent", value)} suffix="%" step="0.1" />
                  <NumberField label="Prognosezeitraum" value={input.settings.projectionYears} onChange={(value) => onSettingsChange("projectionYears", value)} suffix="Jahre" />
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

        <div className="sticky bottom-3 z-20 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <Button variant="ghost" onClick={() => moveToStep(step - 1)} disabled={step === 1}><ArrowLeft size={18} aria-hidden="true" /> <span className="hidden sm:inline">Zurück</span></Button>
          {step < stepLabels.length ? (
            <Button onClick={() => moveToStep(step + 1)}>Weiter <ArrowRight size={18} aria-hidden="true" /></Button>
          ) : (
            <Button onClick={onRun} disabled={loading} size="lg">{loading ? "Analyse wird berechnet …" : "Kostenlose Analyse starten"}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
