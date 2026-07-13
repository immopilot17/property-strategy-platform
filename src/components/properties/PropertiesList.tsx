"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackState } from "@/components/ui/feedback-state";

type Property = {
  id: string;
  address_line1: string;
  street: string;
  house_number: string;
  city: string;
  postal_code: string;
  country: string;
  lat: number | null;
  lon: number | null;
  location_source: string | null;
  geocoded_at: string | null;
  created_at: string;
};

export default function PropertiesList() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/properties");
      const data = await response.json() as { properties?: Property[]; message?: string };
      if (!response.ok) throw new Error(data.message || "Immobilien konnten nicht geladen werden.");
      setProperties(data.properties ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Immobilien konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("property:created", refresh);
    return () => window.removeEventListener("property:created", refresh);
  }, [load]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6" aria-labelledby="properties-title">
      <div className="flex items-center justify-between gap-4">
        <div><h2 id="properties-title" className="text-xl font-bold text-ink dark:text-white">Deine Immobilien</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Mit deinem Konto verknüpft</p></div>
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading} aria-label="Immobilien neu laden"><RefreshCw className={loading ? "animate-spin" : ""} size={17} aria-hidden="true" /></Button>
      </div>
      <div className="mt-5">
        {loading ? <FeedbackState kind="loading" title="Immobilien werden geladen" /> : error ? <FeedbackState kind="error" title="Laden nicht möglich" description={error} /> : !properties.length ? <FeedbackState kind="empty" title="Noch keine Immobilie gespeichert" description="Füge links deine erste Adresse hinzu." /> : (
          <ul className="space-y-3">
            {properties.map((property) => (
              <li key={property.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mint text-teal dark:bg-teal-950 dark:text-teal-200"><Building2 size={19} aria-hidden="true" /></span>
                <div><p className="font-bold text-ink dark:text-white">{property.address_line1 || "Adresse noch unvollständig"}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{property.postal_code} {property.city} · {property.country}</p>{property.lat !== null && property.lon !== null ? <p className="mt-2 text-xs font-semibold text-teal dark:text-teal-200">{property.location_source?.includes("postal_code") ? "Ungefährer PLZ-Standort" : "Standort gespeichert"}</p> : null}<p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Gespeichert am {new Date(property.created_at).toLocaleDateString("de-DE")}</p></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
