import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Anmelden" };

export default function LoginPage() {
  return (
    <main className="px-4 py-16">
      <div className="mx-auto mb-8 max-w-md text-center">
        <h1 className="text-3xl font-bold">Cloudspeicherung aktivieren</h1>
        <p className="mt-3 leading-7 text-slate-600">
          Die Analyse funktioniert auch ohne Konto. Die Anmeldung wird nur für geräteübergreifendes Speichern benötigt.
        </p>
      </div>
      <AuthForm />
    </main>
  );
}
