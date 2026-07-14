import { lookup } from "node:dns/promises";
import { request as httpRequest, type IncomingHttpHeaders } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP, type LookupFunction } from "node:net";

const MAX_REDIRECTS = 4;
const MAX_RESPONSE_BYTES = 2_500_000;
const REQUEST_TIMEOUT_MS = 15_000;

type ResolvedPublicUrl = {
  url: URL;
  address: string;
  family: 4 | 6;
};

export type PublicUrlResponse = {
  body: Buffer;
  finalUrl: URL;
  headers: IncomingHttpHeaders;
  ok: boolean;
  status: number;
};

export class PublicUrlFetchError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "PublicUrlFetchError";
  }
}

export function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return true;

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 2) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
}

export function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8")
  ) {
    return true;
  }

  if (normalized.startsWith("::ffff:")) {
    const ipv4 = normalized.replace("::ffff:", "");
    if (isIP(ipv4) === 4) return isPrivateIpv4(ipv4);
    const hexMatch = ipv4.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hexMatch) {
      const high = Number.parseInt(hexMatch[1], 16);
      const low = Number.parseInt(hexMatch[2], 16);
      return isPrivateIpv4(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
    }
  }

  return false;
}

export function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
}

async function resolvePublicUrl(rawUrl: string): Promise<ResolvedPublicUrl> {
  const url = new URL(rawUrl);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new PublicUrlFetchError("Nur HTTP- und HTTPS-Links werden unterstützt.", 400);
  }
  if (url.username || url.password) {
    throw new PublicUrlFetchError("Links mit Benutzername oder Passwort sind nicht erlaubt.", 400);
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new PublicUrlFetchError("Diese Adresse ist nicht erlaubt.", 400);
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length) throw new PublicUrlFetchError("Die Adresse konnte nicht aufgelöst werden.", 400);
  if (addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new PublicUrlFetchError("Interne oder private Netzwerkadressen sind nicht erlaubt.", 400);
  }

  const selected = addresses[0];
  if (selected.family !== 4 && selected.family !== 6) {
    throw new PublicUrlFetchError("Die Adresse verwendet eine nicht unterstützte IP-Version.", 400);
  }
  return { url, address: selected.address, family: selected.family };
}

function requestPinnedUrl(target: ResolvedPublicUrl): Promise<Omit<PublicUrlResponse, "finalUrl">> {
  return new Promise((resolve, reject) => {
    let complete = false;
    const finishError = (error: Error) => {
      if (complete) return;
      complete = true;
      clearTimeout(timeout);
      reject(error);
    };
    const transport = target.url.protocol === "https:" ? httpsRequest : httpRequest;
    const request = transport(target.url, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.7",
        "User-Agent": "Mozilla/5.0 (compatible; PropertyStrategyAnalyzer/1.0)"
      },
      lookup: createPinnedLookup(target.address, target.family)
    }, (response) => {
      const declaredLength = Number(response.headers["content-length"] ?? 0);
      if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
        response.destroy();
        finishError(new PublicUrlFetchError("Die Immobilienseite ist zu groß für den automatischen Import.", 413));
        return;
      }

      const chunks: Buffer[] = [];
      let totalBytes = 0;
      response.on("data", (chunk: Buffer | Uint8Array) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalBytes += buffer.byteLength;
        if (totalBytes > MAX_RESPONSE_BYTES) {
          response.destroy();
          request.destroy();
          finishError(new PublicUrlFetchError("Die Immobilienseite ist zu groß für den automatischen Import.", 413));
          return;
        }
        chunks.push(buffer);
      });
      response.on("error", finishError);
      response.on("end", () => {
        if (complete) return;
        complete = true;
        clearTimeout(timeout);
        const status = response.statusCode ?? 502;
        resolve({
          body: Buffer.concat(chunks),
          headers: response.headers,
          ok: status >= 200 && status < 300,
          status
        });
      });
    });

    const timeout = setTimeout(() => {
      request.destroy();
      finishError(new PublicUrlFetchError("Zeitüberschreitung beim Abruf der Immobilienseite.", 504));
    }, REQUEST_TIMEOUT_MS);
    request.on("error", finishError);
    request.end();
  });
}

export function createPinnedLookup(address: string, family: 4 | 6): LookupFunction {
  return (_hostname, options, callback) => {
    if (options.all) {
      callback(null, [{ address, family }]);
      return;
    }
    callback(null, address, family);
  };
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function fetchPublicUrl(rawUrl: string): Promise<PublicUrlResponse> {
  let target = await resolvePublicUrl(rawUrl);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await requestPinnedUrl(target);
    if (response.status >= 300 && response.status < 400) {
      const location = firstHeaderValue(response.headers.location);
      if (!location) throw new PublicUrlFetchError("Die Weiterleitung der Immobilienseite ist ungültig.", 502);
      target = await resolvePublicUrl(new URL(location, target.url).toString());
      continue;
    }
    return { ...response, finalUrl: target.url };
  }

  throw new PublicUrlFetchError("Die Immobilienseite enthält zu viele Weiterleitungen.", 508);
}

export function contentTypeOf(headers: IncomingHttpHeaders): string {
  return firstHeaderValue(headers["content-type"]) ?? "";
}
