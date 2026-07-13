import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeFundingDocument } from "./normalizer";
import { fundingProviders } from "./providers";

type ProviderReport = { provider: string; discovered: number; updated: number; unchanged: number; errors: string[] };

async function mapWithConcurrency<T>(items: T[], concurrency: number, task: (item: T) => Promise<void>) {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const item = items[index++];
      await task(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
}

function assertFundingEnvironment() {
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "CRON_SECRET"] as const;
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length) throw new Error(`Funding-Konfiguration fehlt: ${missing.join(", ")}.`);
}

export async function synchronizeFundingProviders() {
  assertFundingEnvironment();
  const supabase = createAdminClient();
  const { error: schemaError } = await supabase.from("funding_program_versions").select("id", { head: true, count: "exact" });
  if (schemaError) throw new Error(`Funding-Datenbank nicht bereit: ${schemaError.message}`);

  const report: ProviderReport[] = [];
  for (const provider of fundingProviders) {
    const entry = { provider: provider.id, discovered: 0, updated: 0, unchanged: 0, errors: [] as string[] };
    try {
      const urls = await provider.discover();
      entry.discovered = urls.length;
      await mapWithConcurrency(urls, 1, async (url) => {
        try {
          const document = await provider.collect(url);
          const { data: current, error: currentError } = await supabase.from("funding_program_versions").select("source_checksum").eq("provider_id", provider.id).eq("official_source", url).order("fetched_at", { ascending: false }).limit(1).maybeSingle();
          if (currentError) throw currentError;
          if (current?.source_checksum === document.checksum) { entry.unchanged++; return; }
          const program = normalizeFundingDocument(document);
          const { error } = await supabase.from("funding_program_versions").insert({
            provider_id: program.providerId, program_id: program.programId, program_name: program.programName,
            official_source: program.officialSource, source_checksum: document.checksum, source_snapshot: document.text,
            normalized_data: program, valid_from: program.validFrom, valid_until: program.validUntil,
            source_published_at: program.sourcePublishedAt, fetched_at: document.fetchedAt
          });
          if (error) throw error;
          entry.updated++;
        } catch (error) { entry.errors.push(`${url}: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`); }
      });
      if (entry.updated + entry.unchanged === 0 && entry.errors.length === 0) entry.errors.push("Keine Programme verarbeitet.");
    } catch (error) { entry.errors.push(error instanceof Error ? error.message : "Provider fehlgeschlagen"); }
    report.push(entry);
  }
  const totals = report.reduce((sum, entry) => ({
    discovered: sum.discovered + entry.discovered,
    updated: sum.updated + entry.updated,
    unchanged: sum.unchanged + entry.unchanged,
    errors: sum.errors + entry.errors.length
  }), { discovered: 0, updated: 0, unchanged: 0, errors: 0 });
  return { ok: totals.errors === 0 && totals.discovered > 0 && totals.updated + totals.unchanged > 0, report, totals };
}
