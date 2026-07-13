"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PropertyForm() {
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
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
        body: JSON.stringify({ address_line1: addressLine1, city, postal_code: postalCode, country })
      });
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message || "Immobilie konnte nicht gespeichert werden.");
      setMessage("Immobilie wurde gespeichert.");
      setAddressLine1("");
      setCity("");
      setPostalCode("");
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
        <label className="block"><span className="text-sm font-bold text-ink dark:text-white">Straße und Hausnummer</span><input required value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} autoComplete="street-address" className={fieldClass} /></label>
        <div className="grid gap-4 sm:grid-cols-[0.55fr_1fr]">
          <label className="block"><span className="text-sm font-bold text-ink dark:text-white">Postleitzahl</span><input required inputMode="numeric" pattern="[0-9]{5}" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} autoComplete="postal-code" className={fieldClass} /></label>
          <label className="block"><span className="text-sm font-bold text-ink dark:text-white">Ort</span><input required value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" className={fieldClass} /></label>
        </div>
        <label className="block"><span className="text-sm font-bold text-ink dark:text-white">Land</span><input required value={country} onChange={(event) => setCountry(event.target.value)} autoComplete="country-name" className={fieldClass} /></label>
      </div>
      <Button type="submit" disabled={loading} className="mt-6 w-full"><Plus size={18} aria-hidden="true" />{loading ? "Wird gespeichert …" : "Immobilie speichern"}</Button>
      {message ? <p role={error ? "alert" : "status"} className={error ? "mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-100" : "mt-4 rounded-xl bg-mint p-3 text-sm text-teal dark:bg-teal-950 dark:text-teal-100"}>{message}</p> : null}
    </form>
  );
}
