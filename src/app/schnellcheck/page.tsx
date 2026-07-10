import { QuickCheckForm } from "@/features/quick-check/components/quick-check-form";

export default function QuickCheckPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold">Dein Immobilien-Schnellcheck</h1>
      <p className="mt-4 text-slate-600">
        Wenige Angaben reichen für eine erste realistische Strategie.
      </p>
      <div className="mt-10">
        <QuickCheckForm />
      </div>
    </main>
  );
}
