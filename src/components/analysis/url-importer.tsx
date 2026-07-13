"use client";

import { useEffect, useRef, useState } from "react";
import type {
  PropertyProfile
} from "@/features/analysis/domain";

export type ImportedProperty = Partial<
  Omit<PropertyProfile, "address">
> & {
  address?: Partial<PropertyProfile["address"]>;
};

type UrlImportResponse = {
  ok: boolean;
  property?: ImportedProperty;
  warnings?: string[];
  message?: string;
};

export function UrlImporter({
  onImported,
  initialUrl
}: {
  onImported: (
    property: ImportedProperty
  ) => void;
  initialUrl?: string;
}) {
  const [url, setUrl] = useState("");
  const hasImportedInitialUrl = useRef(false);
  const [status, setStatus] = useState("");
  const [warnings, setWarnings] =
    useState<string[]>([]);
  const [loading, setLoading] =
    useState(false);

  const importUrl = async (urlToImport = url) => {
    setLoading(true);
    setStatus("Immobilienseite wird gelesen …");
    setWarnings([]);

    try {
      const response = await fetch(
        "/api/analysis/import-url",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: urlToImport })
        }
      );

      const data =
        (await response.json()) as UrlImportResponse;

      if (!response.ok || !data.property) {
        setStatus(
          data.message ??
            "Der Immobilienlink konnte nicht gelesen werden."
        );

        return;
      }

      onImported(data.property);
      setWarnings(data.warnings ?? []);
      setStatus(
        "Erkannte Immobiliendaten wurden übernommen. Bitte alle Werte kontrollieren."
      );
    } catch {
      setStatus(
        "Der Immobilienlink konnte nicht erreicht werden."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialUrl || hasImportedInitialUrl.current) return;
    hasImportedInitialUrl.current = true;
    setUrl(initialUrl);
    void importUrl(initialUrl);
  }, [initialUrl]);

  return (
    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
      <h2 className="text-xl font-bold">
        Immobilie über Link übernehmen
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Link eines Immobilienangebots einfügen.
        Erkannte Angaben werden direkt in das
        Formular übernommen.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          value={url}
          onChange={(event) =>
            setUrl(event.target.value)
          }
          placeholder="Immobilienlink einfügen"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-700"
        />

        <button
          type="button"
          onClick={() => void importUrl()}
          disabled={
            loading ||
            !url.startsWith("http")
          }
          className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-40"
        >
          {loading
            ? "Link wird gelesen …"
            : "Link analysieren"}
        </button>
      </div>

      {status ? (
        <p className="mt-4 text-sm leading-6 text-slate-700">
          {status}
        </p>
      ) : null}

      {warnings.length ? (
        <ul className="mt-3 space-y-2 text-sm text-amber-800">
          {warnings.map((warning) => (
            <li key={warning}>
              • {warning}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
