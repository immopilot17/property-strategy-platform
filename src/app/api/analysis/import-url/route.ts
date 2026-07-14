import * as cheerio from "cheerio";
import { z } from "zod";
import { contentTypeOf, fetchPublicUrl, PublicUrlFetchError } from "@/lib/http/public-url";
import { clientAddress, takeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

const requestSchema = z.object({
  url: z.string().trim().url("Bitte einen gültigen Immobilienlink eingeben.")
});

type JsonRecord = Record<string, unknown>;

type ImportedProperty = {
  title?: string;
  sourceUrl: string;
  purchasePrice?: number;
  livingArea?: number;
  landArea?: number;
  numberOfUnits?: number;
  yearBuilt?: number;
  monthlyColdRent?: number;
  monthlyHouseMoney?: number;
  renovationCosts?: number;
  energyClass?: "A+" | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
  address?: {
    postalCode?: string;
    city?: string;
  };
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  let cleaned = value
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "");

  if (!cleaned) {
    return undefined;
  }

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      cleaned = cleaned
        .replace(/\./g, "")
        .replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    const decimals =
      cleaned.length - lastComma - 1;

    cleaned =
      decimals > 0 && decimals <= 2
        ? cleaned.replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else if (lastDot >= 0) {
    const decimals =
      cleaned.length - lastDot - 1;

    if (decimals === 3) {
      cleaned = cleaned.replace(/\./g, "");
    }
  }

  const result = Number(cleaned);

  return Number.isFinite(result)
    ? result
    : undefined;
}

function getPath(
  record: JsonRecord,
  path: string[]
): unknown {
  let current: unknown = record;

  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[key];
  }

  return current;
}

function firstValue(
  records: JsonRecord[],
  paths: string[][]
): unknown {
  for (const record of records) {
    for (const path of paths) {
      const value = getPath(record, path);

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }
  }

  return undefined;
}

function flattenJsonLd(
  value: unknown,
  result: JsonRecord[]
): void {
  if (Array.isArray(value)) {
    value.forEach((item) =>
      flattenJsonLd(item, result)
    );

    return;
  }

  if (!isRecord(value)) {
    return;
  }

  result.push(value);

  const graph = value["@graph"];

  if (graph) {
    flattenJsonLd(graph, result);
  }

  for (const nestedValue of Object.values(value)) {
    if (
      Array.isArray(nestedValue) ||
      isRecord(nestedValue)
    ) {
      flattenJsonLd(nestedValue, result);
    }
  }
}

function extractJsonLd(
  $: cheerio.CheerioAPI
): JsonRecord[] {
  const records: JsonRecord[] = [];

  $('script[type="application/ld+json"]').each(
    (_, element) => {
      const content = $(element).html()?.trim();

      if (!content) {
        return;
      }

      try {
        flattenJsonLd(
          JSON.parse(content) as unknown,
          records
        );
      } catch {
        // Ungültige JSON-LD-Blöcke werden ignoriert.
      }
    }
  );

  return records;
}

function findNumberInText(
  text: string,
  patterns: RegExp[]
): number | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      const parsed = parseNumber(match[1]);

      if (parsed !== undefined) {
        return parsed;
      }
    }
  }

  return undefined;
}

function cleanPageText(
  $: cheerio.CheerioAPI
): string {
  $("script, style, noscript, svg").remove();

  return $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150_000);
}

function normalizeEnergyClass(
  value: unknown
): ImportedProperty["energyClass"] {
  if (typeof value !== "string") {
    return undefined;
  }

  const match = value
    .toUpperCase()
    .match(/\b(A\+|A|B|C|D|E|F|G|H)\b/);

  return match?.[1] as
    | ImportedProperty["energyClass"]
    | undefined;
}

function extractProperty(
  html: string,
  sourceUrl: string
): {
  property: ImportedProperty;
  warnings: string[];
} {
  const $ = cheerio.load(html);
  const jsonLd = extractJsonLd($);
  const text = cleanPageText($);

  const pageTitle =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().trim();

  const jsonTitle = firstValue(jsonLd, [
    ["name"],
    ["headline"],
    ["itemOffered", "name"]
  ]);

  const jsonPrice = firstValue(jsonLd, [
    ["offers", "price"],
    ["offers", "lowPrice"],
    ["price"],
    ["itemOffered", "offers", "price"]
  ]);

  const jsonLivingArea = firstValue(jsonLd, [
    ["floorSize", "value"],
    ["floorSize"],
    ["itemOffered", "floorSize", "value"]
  ]);

  const jsonLandArea = firstValue(jsonLd, [
    ["lotSize", "value"],
    ["lotSize"],
    ["itemOffered", "lotSize", "value"]
  ]);

  const jsonRooms = firstValue(jsonLd, [
    ["numberOfRooms"],
    ["itemOffered", "numberOfRooms"]
  ]);

  const jsonYearBuilt = firstValue(jsonLd, [
    ["yearBuilt"],
    ["dateBuilt"],
    ["itemOffered", "yearBuilt"]
  ]);

  const jsonPostalCode = firstValue(jsonLd, [
    ["address", "postalCode"],
    ["itemOffered", "address", "postalCode"]
  ]);

  const jsonCity = firstValue(jsonLd, [
    ["address", "addressLocality"],
    ["itemOffered", "address", "addressLocality"]
  ]);

  const purchasePrice =
    parseNumber(jsonPrice) ??
    findNumberInText(text, [
      /Kaufpreis\s*:?\s*([\d.\s]+(?:,\d{1,2})?)\s*€/i,
      /Preis\s*:?\s*([\d.\s]+(?:,\d{1,2})?)\s*€/i
    ]);

  const livingArea =
    parseNumber(jsonLivingArea) ??
    findNumberInText(text, [
      /Wohnfläche\s*:?\s*([\d.,]+)\s*m²/i,
      /Wohnfläche\s*:?\s*([\d.,]+)\s*qm/i
    ]);

  const landArea =
    parseNumber(jsonLandArea) ??
    findNumberInText(text, [
      /Grundstück(?:sfläche)?\s*:?\s*([\d.,]+)\s*m²/i,
      /Grundstück(?:sfläche)?\s*:?\s*([\d.,]+)\s*qm/i
    ]);

  const numberOfUnits = findNumberInText(text, [
    /(?:Wohneinheiten|Einheiten)\s*:?\s*(\d+)/i
  ]);

  const yearBuilt =
    parseNumber(jsonYearBuilt) ??
    findNumberInText(text, [
      /Baujahr\s*:?\s*(\d{4})/i
    ]);

  const monthlyColdRent = findNumberInText(text, [
    /(?:Kaltmiete|Nettokaltmiete|Mieteinnahmen)\s*:?\s*([\d.\s]+(?:,\d{1,2})?)\s*€/i
  ]);

  const monthlyHouseMoney = findNumberInText(text, [
    /Hausgeld\s*:?\s*([\d.\s]+(?:,\d{1,2})?)\s*€/i
  ]);

  const energyClass =
    normalizeEnergyClass(
      text.match(
        /(?:Energieeffizienzklasse|Energieklasse)\s*:?\s*(A\+|A|B|C|D|E|F|G|H)/i
      )?.[1]
    );

  const postalCode =
    typeof jsonPostalCode === "string"
      ? jsonPostalCode
      : text.match(/\b(\d{5})\b/)?.[1];

  const city =
    typeof jsonCity === "string"
      ? jsonCity
      : undefined;

  const property: ImportedProperty = {
    sourceUrl,
    title:
      typeof jsonTitle === "string"
        ? jsonTitle
        : pageTitle || undefined,
    purchasePrice,
    livingArea,
    landArea,
    numberOfUnits:
      numberOfUnits ??
      parseNumber(jsonRooms),
    yearBuilt,
    monthlyColdRent,
    monthlyHouseMoney,
    energyClass,
    address:
      postalCode || city
        ? {
            postalCode,
            city
          }
        : undefined
  };

  const detectedValues = Object.entries(property)
    .filter(
      ([key, value]) =>
        key !== "sourceUrl" &&
        key !== "address" &&
        value !== undefined
    )
    .length;

  const warnings: string[] = [];

  if (detectedValues < 3) {
    warnings.push(
      "Nur wenige Werte wurden erkannt. Das Portal liefert möglicherweise Inhalte erst per JavaScript oder blockiert automatische Abrufe."
    );
  }

  if (!purchasePrice) {
    warnings.push(
      "Kaufpreis wurde nicht sicher erkannt."
    );
  }

  if (!livingArea) {
    warnings.push(
      "Wohnfläche wurde nicht sicher erkannt."
    );
  }

  return {
    property,
    warnings
  };
}

export async function POST(request: Request) {
  const rateLimitKey = `property-url:${clientAddress(request)}`;
  if (!takeRateLimit(rateLimitKey, 10, 60_000)) {
    return Response.json(
      { ok: false, message: "Zu viele Importversuche. Bitte warte eine Minute." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const { url } = requestSchema.parse(
      await request.json()
    );

    const response = await fetchPublicUrl(url);

    if (response.status === 401 || response.status === 403) {
      return Response.json(
        {
          ok: false,
          message:
            "Das Immobilienportal blockiert den automatischen Zugriff. Bitte den Exposé-Text als Alternative einfügen."
        },
        { status: 422 }
      );
    }

    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          message: `Die Immobilienseite antwortete mit Status ${response.status}.`
        },
        { status: 422 }
      );
    }

    const contentType = contentTypeOf(response.headers);

    if (!contentType.includes("text/html")) {
      return Response.json(
        {
          ok: false,
          message:
            "Der Link verweist nicht auf eine lesbare HTML-Seite."
        },
        { status: 422 }
      );
    }

    const html = new TextDecoder().decode(response.body);

    const {
      property,
      warnings
    } = extractProperty(
      html,
      response.finalUrl.toString()
    );

    return Response.json({
      ok: true,
      property,
      warnings
    });
  } catch (error) {
    const knownError = error instanceof PublicUrlFetchError;
    const message = knownError
      ? error.message
      : error instanceof z.ZodError
        ? "Bitte gib einen vollständigen HTTP- oder HTTPS-Link ein."
        : "Der Immobilienlink konnte nicht erreicht werden. Bitte prüfe den Link oder trage die Daten manuell ein.";

    return Response.json(
      {
        ok: false,
        message
      },
      { status: knownError ? error.status : error instanceof z.ZodError ? 400 : 502 }
    );
  }
}
