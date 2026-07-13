import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Anmelden" };

export default function LoginPage() {
  return (
    <main className="px-4 py-16">
      <div className="mx-auto mb-8 max-w-md text-center">
        <h1 className="text-3xl font-bold">Anmelden oder kostenlos registrieren</h1>
        <p className="mt-3 leading-7 text-slate-600">
          Nutze Google oder E-Mail. Die kostenlose Immobilienanalyse funktioniert weiterhin ohne Konto.
        </p>
      </div>
      <AuthForm />
    </main>
  );
}
