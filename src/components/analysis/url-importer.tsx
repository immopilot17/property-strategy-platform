"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link2 } from "lucide-react";
import type { PropertyProfile } from "@/features/analysis/domain";
import { Button } from "@/components/ui/button";

export type ImportedProperty = Partial<Omit<PropertyProfile, "address">> & {
  address?: Partial<PropertyProfile["address"]>;
};

type UrlImportResponse = {
  ok: boolean;
  property?: ImportedProperty;
  warnings?: string[];
  message?: string;
};

export function UrlImporter({ onImported, initialUrl }: { onImported: (property: ImportedProperty) => void; initialUrl?: string }) {
  const [url, setUrl] = useState("");
  const hasImportedInitialUrl = useRef(false);
  const [status, setStatus] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const importUrl = useCallback(async (urlToImport = url) => {
    setLoading(true);
    setStatus("Immobilienseite wird gelesen …");
    setWarnings([]);
    try {
      const response = await fetch("/api/analysis/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToImport })
      });
      const data = await response.json() as UrlImportResponse;
      if (!response.ok || !data.property) {
        setStatus(data.message ?? "Der Immobilienlink konnte nicht gelesen werden.");
        return;
      }
      onImported(data.property);
      setWarnings(data.warnings ?? []);
      setStatus("Erkannte Daten wurden übernommen. Bitte kontrolliere alle Werte.");
    } catch {
      setStatus("Der Immobilienlink konnte nicht erreicht werden.");
    } finally {
      setLoading(false);
    }
  }, [onImported, url]);

  useEffect(() => {
    if (!initialUrl || hasImportedInitialUrl.current) return;
    hasImportedInitialUrl.current = true;
    setUrl(initialUrl);
    void importUrl(initialUrl);
  }, [importUrl, initialUrl]);

  return (
    <div>
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Füge den Link eines Immobilienangebots ein. Erkannte Angaben werden übernommen und bleiben von dir kontrollierbar.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center rounded-xl border border-slate-300 bg-white px-3 transition focus-within:border-teal focus-within:ring-4 focus-within:ring-teal-100 dark:border-slate-600 dark:bg-slate-950 dark:focus-within:ring-teal-950">
          <span className="sr-only">Immobilienlink</span><Link2 className="mr-2 shrink-0 text-slate-400" size={18} aria-hidden="true" /><input type="url" value={url} onChange={(event) => setUrl(event.target.value)} className="min-w-0 flex-1 bg-transparent py-3 text-sm text-ink outline-none dark:text-white" />
        </label>
        <Button type="button" disabled={loading || !url.startsWith("http")} onClick={() => void importUrl()}>{loading ? "Link wird gelesen …" : "Daten übernehmen"}</Button>
      </div>
      {status ? <p className="mt-4 rounded-xl bg-cloud p-3 text-sm leading-6 text-slate-700 dark:bg-slate-800 dark:text-slate-200" aria-live="polite">{status}</p> : null}
      {warnings.length ? <ul className="mt-3 space-y-2 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">{warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul> : null}
    </div>
  );
}
