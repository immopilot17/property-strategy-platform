"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { LocationFields } from "@/components/location/LocationFields";
import { Button } from "@/components/ui/button";
import type { LocationAddress } from "@/features/location/domain";

const emptyLocation = (): LocationAddress => ({
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  latitude: null,
  longitude: null,
  locationSource: null,
  geocodedAt: null
});

export default function PropertyForm() {
  const [location, setLocation] = useState<LocationAddress>(emptyLocation);
  const [country, setCountry] = useState("Deutschland");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(false);
    setLoading(true);
    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: location.street,
          house_number: location.houseNumber,
          city: location.city,
          postal_code: location.postalCode,
          country,
          lat: location.latitude,
          lon: location.longitude,
          location_source: location.locationSource,
          geocoded_at: location.geocodedAt
        })
      });
      const data = await response.json() as { message?: string; location_status?: string };
      if (!response.ok) throw new Error(data.message || "Immobilie konnte nicht gespeichert werden.");
      setMessage(data.location_status === "found" ? "Immobilie und Standort wurden gespeichert." : "Immobilie wurde gespeichert. Der Standort kann später ergänzt werden.");
      setLocation(emptyLocation());
      setCountry("Deutschland");
      window.dispatchEvent(new CustomEvent("property:created"));
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "Immobilie konnte nicht gespeichert werden.");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-ink outline-none transition focus:border-teal focus:ring-4 focus:ring-teal-100 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-teal-950";

  return (
    <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <h2 className="text-xl font-bold text-ink dark:text-white">Immobilie hinzufügen</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Speichere nur die Adresse. Finanzdaten werden erst in einer Analyse ergänzt.</p>
      <div className="mt-6 space-y-4">
        <LocationFields value={location} onChange={setLocation} postalCodeRequired />
        <label className="block"><span className="text-sm font-bold text-ink dark:text-white">Land</span><input required value={country} onChange={(event) => setCountry(event.target.value)} autoComplete="country-name" className={fieldClass} /></label>
      </div>
      <Button type="submit" disabled={loading} className="mt-6 w-full"><Plus size={18} aria-hidden="true" />{loading ? "Wird gespeichert …" : "Immobilie speichern"}</Button>
      {message ? <p role={error ? "alert" : "status"} className={error ? "mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-100" : "mt-4 rounded-xl bg-mint p-3 text-sm text-teal dark:bg-teal-950 dark:text-teal-100"}>{message}</p> : null}
    </form>
  );
}
