import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRolePage } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type ModuleState = {
  description: string;
  missing?: string[];
  ready: boolean;
  title: string;
};

function configured(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function state(title: string, description: string, requirements: string[] = []): ModuleState {
  const missing = requirements.filter((name) => !configured(name));
  return { title, description, ready: missing.length === 0, missing };
}

export default async function SystemstatusPage() {
  await requireRolePage("founder");
  const supabaseRequirements = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const paymentProviderReady = configured("STRIPE_SECRET_KEY") ||
    (configured("PAYPAL_CLIENT_ID") && configured("PAYPAL_CLIENT_SECRET"));
  const modules: ModuleState[] = [
    state("Analyse-Engine", "Kaufkosten, Tragbarkeit, Finanzierung, Cashflow, Steuern und Risiken werden lokal und nachvollziehbar berechnet."),
    state("Förderintelligenz", "Versionierte KfW- und Landesprogramme werden aus dem Supabase-Datenbestand geladen.", supabaseRequirements),
    state("KI-Erklärungen", "OpenAI-Erklärungen verwenden reservierte Tokenbudgets angemeldeter Konten.", [...supabaseRequirements, "OPENAI_API_KEY"]),
    {
      title: "Konto und Pakete",
      description: "Authentifizierung, Guthaben und Käufe werden dem angemeldeten Konto zugeordnet.",
      ready: supabaseRequirements.every(configured) && paymentProviderReady,
      missing: [
        ...supabaseRequirements.filter((name) => !configured(name)),
        ...(paymentProviderReady ? [] : ["STRIPE oder PAYPAL"]),
      ],
    },
    state("Premium-Bericht", "Der vollständige Bericht kann über den Browser als PDF gespeichert werden."),
  ];
  const configuredCount = modules.filter((module) => module.ready).length;
  const checkedAt = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date());

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-teal dark:text-slate-300 dark:hover:text-teal-200">
        <ArrowLeft size={16} aria-hidden="true" />Zur Übersicht
      </Link>
      <header className="mt-8 max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal dark:text-teal-300">Systemkonfiguration</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-ink dark:text-white sm:text-5xl">Plattformmodule</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
          {configuredCount} von {modules.length} Modulen sind vollständig konfiguriert. Letzte Prüfung: {checkedAt} Uhr.
        </p>
      </header>
      <section className="mt-9 grid gap-4 sm:grid-cols-2">
        {modules.map((module) => (
          <article key={module.title} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold text-ink dark:text-white">{module.title}</h2>
              <StatusBadge tone={module.ready ? "positive" : "caution"}>
                {module.ready ? "Konfiguriert" : "Unvollständig"}
              </StatusBadge>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{module.description}</p>
            {module.missing?.length ? (
              <p className="mt-3 text-xs leading-5 text-amber-800 dark:text-amber-200">
                Fehlende Serverkonfiguration: {module.missing.join(", ")}
              </p>
            ) : null}
          </article>
        ))}
      </section>
      <aside className="mt-7 flex items-start gap-3 rounded-2xl bg-cloud p-5 text-sm leading-6 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <CheckCircle2 className="mt-0.5 shrink-0 text-teal" size={19} aria-hidden="true" />
        <p>Diese Seite prüft die benötigte Serverkonfiguration. Sie ist kein Uptime-Monitor für externe Anbieter.</p>
      </aside>
    </main>
  );
}
