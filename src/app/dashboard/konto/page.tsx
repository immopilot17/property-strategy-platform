import { BarChart3, Building2, CheckCircle2, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { getAccountAccess } from "@/features/payments/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mein Konto" };

const roleLabels = { user: "Nutzer", admin: "Admin", founder: "Founder" } as const;
const tierLabels: Record<string, string> = {
  free: "Kostenlos",
  starter: "Analyse",
  plus: "Finanzierung",
  pro: "Strategie",
  premium: "Premium",
  founder: "Founder – alle Leistungen"
};

export default async function AccountPage() {
  const access = await getAccountAccess();

  if (!access.user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="rounded-3xl border border-teal-200 bg-mint p-7 dark:border-teal-800 dark:bg-teal-950/50 sm:p-9">
          <UserRound className="text-teal" size={30} aria-hidden="true" />
          <h1 className="mt-5 text-3xl font-black tracking-tight text-ink dark:text-white">Mein Konto</h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-700 dark:text-slate-200">Melde dich an, um Kontostatus, Tarif, gespeicherte Analysen und deine Immobilien an einem Ort zu verwalten.</p>
          <ButtonLink href="/login?next=%2Fdashboard%2Fkonto" className="mt-6">Anmelden</ButtonLink>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="max-w-3xl">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-teal dark:text-teal-300"><UserRound size={17} aria-hidden="true" />Mein Konto</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-ink dark:text-white sm:text-5xl">Dein persönlicher Arbeitsbereich.</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">Kontostatus, Leistungen und gespeicherte Entscheidungen – übersichtlich und ohne doppelte Einstellungen.</p>
      </header>

      <section className="mt-9 grid gap-4 md:grid-cols-3" aria-label="Kontostatus">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><p className="text-sm text-slate-500">E-Mail</p><p className="mt-2 break-all font-bold text-ink dark:text-white">{access.user.email ?? "Nicht hinterlegt"}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><p className="text-sm text-slate-500">Rolle</p><p className="mt-2 flex items-center gap-2 font-bold text-ink dark:text-white"><ShieldCheck size={18} className="text-teal" />{roleLabels[access.role]}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><p className="text-sm text-slate-500">Tarif & Leistungen</p><p className="mt-2 font-bold text-ink dark:text-white">{tierLabels[access.tier] ?? access.tier}</p><p className="mt-1 text-sm text-slate-500">{access.unlimited ? "Unbegrenztes API-Budget" : `${new Intl.NumberFormat("de-DE").format(access.tokenBalance)} Tokens verfügbar`}</p></article>
      </section>

      <section className="mt-8 rounded-3xl bg-ink p-6 text-white sm:p-8">
        <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal"><CheckCircle2 size={22} /></span><div><h2 className="text-xl font-black">Deine Analysen werden automatisch als Entwurf gespeichert.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Fertige Ergebnisse kannst du zusätzlich im Konto sichern und später geräteübergreifend öffnen.</p></div></div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Kontobereiche">
        <ButtonLink href="/analysen" variant="secondary" className="min-h-16 justify-between"><span className="flex items-center gap-3"><BarChart3 size={20} />Gespeicherte Analysen</span><span aria-hidden="true">→</span></ButtonLink>
        <ButtonLink href="/dashboard/properties" variant="secondary" className="min-h-16 justify-between"><span className="flex items-center gap-3"><Building2 size={20} />Meine Immobilien</span><span aria-hidden="true">→</span></ButtonLink>
        <ButtonLink href="/dashboard/zahlungen" variant="secondary" className="min-h-16 justify-between"><span className="flex items-center gap-3"><WalletCards size={20} />Tarife & Leistungen</span><span aria-hidden="true">→</span></ButtonLink>
        {access.role !== "user" ? <ButtonLink href="/admin" variant="secondary" className="min-h-16 justify-between"><span className="flex items-center gap-3"><ShieldCheck size={20} />Admin-Konsole</span><span aria-hidden="true">→</span></ButtonLink> : null}
      </section>
    </main>
  );
}
