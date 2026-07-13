import { Building2 } from "lucide-react";
import PropertiesList from "@/components/properties/PropertiesList";
import PropertyForm from "@/components/properties/PropertyForm";

export const metadata = { title: "Gespeicherte Immobilien" };

export default function PropertiesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="max-w-3xl">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-teal dark:text-teal-300"><Building2 size={17} aria-hidden="true" />Immobilien</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-ink dark:text-white sm:text-5xl">Gespeicherte Immobilien</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">Lege ein Objekt einmal an und nutze die Adresse später für weitere Analysen.</p>
      </header>
      <div className="mt-9 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <PropertyForm />
        <PropertiesList />
      </div>
    </main>
  );
}
