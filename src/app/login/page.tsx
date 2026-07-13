import { CheckCircle2, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Anmelden" };

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100svh-72px)] max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-8 lg:py-16">
      <section className="max-w-xl">
        <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-teal dark:text-teal-300"><ShieldCheck size={17} aria-hidden="true" />Dein persönlicher Bereich</p>
        <h1 className="text-balance mt-4 text-4xl font-black tracking-tight text-ink dark:text-white sm:text-5xl">Analysen sicher speichern und überall fortsetzen.</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">Melde dich mit Google oder E-Mail an. Ein Konto ist für die kostenlose Immobilienanalyse nicht erforderlich.</p>
        <ul className="mt-8 space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
          {["Analysen geräteübergreifend speichern", "Pakete und Tokenbudget dem Konto zuordnen", "Premium-Berichte später erneut öffnen"].map((item) => <li key={item} className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-teal" size={18} aria-hidden="true" />{item}</li>)}
        </ul>
      </section>
      <AuthForm />
    </main>
  );
}
