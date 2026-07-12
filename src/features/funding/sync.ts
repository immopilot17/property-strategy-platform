import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeFundingDocument } from "./normalizer";
import { fundingProviders } from "./providers";

export async function synchronizeFundingProviders() {
  const supabase = createAdminClient();
  const report: Array<{ provider: string; discovered: number; updated: number; unchanged: number; errors: string[] }> = [];
  for (const provider of fundingProviders) {
    const entry = { provider: provider.id, discovered: 0, updated: 0, unchanged: 0, errors: [] as string[] };
    try {
      const urls = await provider.discover();
      entry.discovered = urls.length;
      for (const url of urls) {
        try {
          const document = await provider.collect(url);
          const { data: current } = await supabase.from("funding_program_versions").select("source_checksum").eq("provider_id", provider.id).eq("official_source", url).order("fetched_at", { ascending: false }).limit(1).maybeSingle();
          if (current?.source_checksum === document.checksum) { entry.unchanged++; continue; }
          const program = await normalizeFundingDocument(document);
          const { error } = await supabase.from("funding_program_versions").insert({
            provider_id: program.providerId, program_id: program.programId, program_name: program.programName,
            official_source: program.officialSource, source_checksum: document.checksum, source_snapshot: document.text,
            normalized_data: program, valid_from: program.validFrom, valid_until: program.validUntil,
            source_published_at: program.sourcePublishedAt, fetched_at: document.fetchedAt
          });
          if (error) throw error;
          entry.updated++;
        } catch (error) { entry.errors.push(`${url}: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`); }
      }
    } catch (error) { entry.errors.push(error instanceof Error ? error.message : "Provider fehlgeschlagen"); }
    report.push(entry);
  }
  return report;
}
