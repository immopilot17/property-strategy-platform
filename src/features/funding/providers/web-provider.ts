import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import type { FundingProvider, FundingSourceDocument } from "../domain";

export abstract class OfficialWebProvider implements FundingProvider {
  abstract id: string;
  abstract name: string;
  abstract catalogUrls: string[];
  abstract allowedHost: string;
  abstract isProgramUrl(url: URL): boolean;

  private async fetchOfficial(url: string) {
    const response = await fetch(url, {
      headers: { "User-Agent": "PropertyStrategyFundingBot/1.0 (+https://property-strategy-platform.vercel.app)" },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000)
    });
    if (!response.ok) throw new Error(`${this.name}: Quelle nicht erreichbar (${response.status}).`);
    return response;
  }

  async discover() {
    const found = new Set<string>();
    for (const catalogUrl of this.catalogUrls) {
      const response = await this.fetchOfficial(catalogUrl);
      const $ = cheerio.load(await response.text());
      $("a[href]").each((_, element) => {
        try {
          const url = new URL(($(element).attr("href") ?? "").trim(), catalogUrl);
          url.search = ""; url.hash = "";
          if (url.hostname === this.allowedHost && this.isProgramUrl(url)) found.add(url.toString());
        } catch { /* ungültige Links ignorieren */ }
      });
    }
    if (found.size === 0) throw new Error(`${this.name}: Keine freigegebenen Förderprogramme gefunden.`);
    return [...found];
  }

  async collect(sourceUrl: string): Promise<FundingSourceDocument> {
    const url = new URL(sourceUrl);
    if (url.hostname !== this.allowedHost || !this.isProgramUrl(url)) throw new Error("Nicht erlaubte Förderquelle.");
    const response = await this.fetchOfficial(url.toString());
    const $ = cheerio.load(await response.text());
    $("script,style,noscript,nav,footer").remove();
    const title = $("h1").first().text().replace(/\s+/g, " ").trim() || $("title").text().trim();
    const text = $("main").text().replace(/\s+/g, " ").trim() || $("body").text().replace(/\s+/g, " ").trim();
    return { providerId: this.id, sourceUrl: url.toString(), fetchedAt: new Date().toISOString(), title, text: text.slice(0, 120000), checksum: createHash("sha256").update(text).digest("hex") };
  }
}
