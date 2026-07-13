import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, RefreshCw } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizedFundingProgramSchema,
  type NormalizedFundingProgram
} from "@/features/funding/domain";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Förderprogramme",
  description: "Aktuelle KfW- und L-Bank-Förderprogramme aus versionierten offiziellen Quellen."
};

const providers = [
  {
    id: "kfw",
    name: "KfW",
    description: "Bundesweite Programme für Kauf, Neubau, Sanierung, Energieeffizienz und Barrierefreiheit.",
    officialSource: "https://www.kfw.de/inlandsfoerderung/Privatpersonen/"
  },
  {
    id: "lbank",
    name: "L-Bank",
    description: "Landesprogramme für private Wohnvorhaben in Baden-Württemberg.",
    officialSource: "https://www.l-bank.de/produkte/wohnimmobilien/"
  }
] as const;

const categoryLabels: Record<NormalizedFundingProgram["category"], string> = {
  purchase: "Kauf und Wohneigentum",
  new_build: "Neubau",
  renovation: "Sanierung und Bestand",
  energy: "Energieeffizienz",
  accessibility: "Barrierefreiheit",
  other: "Weitere Wohnraumförderung"
};

const targetGroupLabels: Record<NormalizedFundingProgram["category"], string> = {
  purchase: "Privatpersonen beim Erwerb von Wohneigentum",
  new_build: "Privatpersonen mit einem Neubauvorhaben",
  renovation: "Eigentümerinnen und Eigentümer mit einem Sanierungsvorhaben",
  energy: "Privatpersonen mit einem Energieeffizienzvorhaben",
  accessibility: "Privatpersonen mit einem barrierearmen Umbauvorhaben",
  other: "Privatpersonen; Details stehen in der offiziellen Quelle"
};

function fundingType(program: NormalizedFundingProgram) {
  if (program.interestRate && program.repaymentGrant) return "Förderkredit mit möglichem Tilgungszuschuss";
  if (program.interestRate) return "Förderkredit";
  if (program.repaymentGrant) return "Zuschuss oder Tilgungszuschuss";
  return `${categoryLabels[program.category]} – Förderart in der Quelle prüfen`;
}

function fundingAmount(program: NormalizedFundingProgram) {
  if (program.maximumFunding.amount !== null) {
    return program.maximumFunding.amount.toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0
    });
  }
  return program.maximumFunding.description;
}

async function loadPrograms() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return {
      programs: [] as NormalizedFundingProgram[],
      notice: "Die Live-Daten sind derzeit nicht verbunden. Nutze bis dahin die verlinkten offiziellen Quellen."
    };
  }

  try {
    const { data, error } = await createAdminClient()
      .from("current_funding_programs")
      .select("normalized_data")
      .in("provider_id", providers.map((provider) => provider.id));

    if (error) throw error;

    const programs = (data ?? []).flatMap((row) => {
      const parsed = normalizedFundingProgramSchema.safeParse(row.normalized_data);
      return parsed.success ? [parsed.data] : [];
    });

    return {
      programs,
      notice: programs.length
        ? null
        : "Aktuell liegen noch keine veröffentlichten Live-Daten vor. Prüfe die Programme direkt bei den Förderbanken."
    };
  } catch {
    return {
      programs: [] as NormalizedFundingProgram[],
      notice: "Die Live-Daten konnten gerade nicht geladen werden. Die offiziellen Quellen bleiben erreichbar."
    };
  }
}

function ProgramCard({ program }: { program: NormalizedFundingProgram }) {
  const requirements = program.eligibility.map((item) => item.explanation).slice(0, 3);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-teal dark:text-teal-300">Programm {program.programId}</p>
          <h3 className="mt-2 text-lg font-bold text-ink dark:text-white">{program.programName}</h3>
        </div>
        <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-teal dark:bg-teal-950 dark:text-teal-200">{categoryLabels[program.category]}</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{program.description}</p>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-bold text-ink dark:text-white">Zielgruppe</dt>
          <dd className="mt-1 leading-6 text-slate-600 dark:text-slate-300">{targetGroupLabels[program.category]}</dd>
        </div>
        <div>
          <dt className="font-bold text-ink dark:text-white">Förderart</dt>
          <dd className="mt-1 leading-6 text-slate-600 dark:text-slate-300">{fundingType(program)}</dd>
        </div>
        <div>
          <dt className="font-bold text-ink dark:text-white">Mögliche Förderhöhe</dt>
          <dd className="mt-1 leading-6 text-slate-600 dark:text-slate-300">{fundingAmount(program)}</dd>
        </div>
        <div>
          <dt className="font-bold text-ink dark:text-white">Aktualitätsstand</dt>
          <dd className="mt-1 leading-6 text-slate-600 dark:text-slate-300">{new Date(program.lastUpdated).toLocaleDateString("de-DE")}</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-xl bg-cloud p-4 text-sm leading-6 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <p className="font-bold text-ink dark:text-white">Wichtigste Voraussetzungen</p>
        {requirements.length ? (
          <ul className="mt-2 space-y-1">
            {requirements.map((requirement) => <li key={requirement}>• {requirement}</li>)}
          </ul>
        ) : (
          <p className="mt-2">Die persönlichen Voraussetzungen müssen anhand der offiziellen Programmseite geprüft werden.</p>
        )}
      </div>

      <a href={program.officialSource} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl font-bold text-teal hover:underline dark:text-teal-300">
        Offizielle Quelle <ExternalLink size={16} aria-hidden="true" />
      </a>
    </article>
  );
}

export default async function FundingPage() {
  const { programs, notice } = await loadPrograms();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal dark:text-teal-300">Offizielle Förderquellen</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink dark:text-white sm:text-5xl">Förderprogramme verständlich prüfen.</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">Diese Übersicht zeigt den aktuellen versionierten Datenbestand. Eine persönliche Förderempfehlung entsteht erst durch den Abgleich mit deinen Angaben.</p>
        <Link href="/analyse" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-teal px-5 py-3 font-bold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200 dark:focus-visible:ring-teal-900">
          Persönliche Förderprüfung starten
        </Link>
      </header>

      {notice ? (
        <aside className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <RefreshCw className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
          <p><strong>Hinweis zu Live-Daten:</strong> {notice}</p>
        </aside>
      ) : null}

      <div className="mt-10 space-y-12">
        {providers.map((provider) => {
          const providerPrograms = programs.filter((program) => program.providerId === provider.id);
          return (
            <section key={provider.id} aria-labelledby={`${provider.id}-title`}>
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-700 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-teal dark:text-teal-300">{providerPrograms.length} Programme im aktuellen Bestand</p>
                  <h2 id={`${provider.id}-title`} className="mt-1 text-2xl font-black text-ink dark:text-white sm:text-3xl">{provider.name}</h2>
                  <p className="mt-2 max-w-3xl leading-7 text-slate-600 dark:text-slate-300">{provider.description}</p>
                </div>
                <a href={provider.officialSource} target="_blank" rel="noreferrer" className="inline-flex min-h-11 shrink-0 items-center gap-2 font-bold text-teal hover:underline dark:text-teal-300">Alle offiziellen Programme <ExternalLink size={16} aria-hidden="true" /></a>
              </div>

              {providerPrograms.length ? (
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {providerPrograms.map((program) => <ProgramCard key={`${program.providerId}-${program.programId}`} program={program} />)}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Für {provider.name} sind gerade keine Live-Programme verfügbar. Öffne die offizielle Quelle, um den aktuellen Stand zu prüfen.
                </div>
              )}
            </section>
          );
        })}
      </div>

      <aside className="mt-12 rounded-2xl bg-slate-100 p-5 text-sm leading-6 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
        Förderbedingungen können sich ändern. Verbindlich sind ausschließlich die verlinkten offiziellen Quellen und die Prüfung durch den jeweiligen Fördergeber.
      </aside>
    </main>
  );
}
