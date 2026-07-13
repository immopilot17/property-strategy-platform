"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { CircleAlert, LoaderCircle, MapPin } from "lucide-react";
import { germanPostalCodePattern, type GeocodingOutcome, type LocationAddress } from "@/features/location/domain";

const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => <div className="grid h-64 place-items-center rounded-2xl border border-slate-200 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">Karte wird geladen …</div>
});

const clientCache = new Map<string, GeocodingOutcome>();
const fieldClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-ink outline-none transition focus:border-teal focus:ring-4 focus:ring-teal-100 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-teal-950";

type LocationStatus = { kind: "idle" | "searching" | "found" | "not_found"; message: string };

export function LocationFields({ value, onChange, postalCodeRequired = false }: {
  value: LocationAddress;
  onChange: (value: LocationAddress) => void;
  postalCodeRequired?: boolean;
}) {
  const [status, setStatus] = useState<LocationStatus>(() => value.latitude !== null && value.longitude !== null
    ? { kind: "found", message: value.locationSource?.includes("postal_code") ? "Ungefährer Standort gefunden." : "Standort gefunden." }
    : { kind: "idle", message: "" });
  const currentValue = useRef(value);
  const onChangeRef = useRef(onChange);
  const lastRequestedKey = useRef("");
  const cityWasEdited = useRef(false);
  const lastAutomaticCity = useRef("");
  currentValue.current = value;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const addressKey = useMemo(() => {
    const postalOnly = !value.street.trim() || !value.houseNumber.trim() || !value.city.trim();
    if (postalOnly) return `postal|||${value.postalCode.trim()}|`;
    return ["full", value.street, value.houseNumber, value.postalCode, value.city]
      .map((part) => part.trim().replace(/\s+/g, " ").toLocaleLowerCase("de-DE"))
      .join("|");
  }, [value.city, value.houseNumber, value.postalCode, value.street]);

  useEffect(() => {
    if (!germanPostalCodePattern.test(currentValue.current.postalCode)) {
      setStatus({ kind: "idle", message: "" });
      return;
    }
    if (lastRequestedKey.current === addressKey) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      lastRequestedKey.current = addressKey;
      setStatus({ kind: "searching", message: "Standort wird gesucht …" });
      let outcome = clientCache.get(addressKey);
      try {
        if (!outcome) {
          const address = currentValue.current;
          const response = await fetch("/api/location/geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              street: address.street,
              houseNumber: address.houseNumber,
              postalCode: address.postalCode,
              city: address.city
            }),
            signal: controller.signal
          });
          outcome = await response.json() as GeocodingOutcome;
          if (outcome.status !== "unavailable") clientCache.set(addressKey, outcome);
        }
        if (controller.signal.aborted) return;

        if (outcome.status === "found") {
          const current = currentValue.current;
          const shouldFillCity = Boolean(outcome.result.city) && (!cityWasEdited.current || !current.city.trim());
          const city = shouldFillCity ? outcome.result.city : current.city;
          if (shouldFillCity) lastAutomaticCity.current = city;
          const next: LocationAddress = {
            ...current,
            city,
            latitude: outcome.result.latitude,
            longitude: outcome.result.longitude,
            locationSource: outcome.result.source,
            geocodedAt: outcome.result.geocodedAt
          };
          currentValue.current = next;
          onChangeRef.current(next);
          setStatus({ kind: "found", message: outcome.message });
          return;
        }
        setStatus({ kind: "not_found", message: outcome.message });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus({ kind: "not_found", message: "Standort nicht gefunden. Bitte später erneut versuchen oder Koordinaten eintragen." });
      }
    }, 650);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [addressKey, value.city, value.houseNumber, value.postalCode, value.street]);

  const updateAddress = (key: "street" | "houseNumber" | "postalCode" | "city", rawValue: string) => {
    const current = currentValue.current;
    const nextValue = key === "postalCode" ? rawValue.replace(/\D/g, "").slice(0, 5) : rawValue;
    let city = current.city;
    if (key === "postalCode" && nextValue !== current.postalCode) {
      cityWasEdited.current = false;
      if (city === lastAutomaticCity.current) city = "";
      lastAutomaticCity.current = "";
    }
    if (key === "city") cityWasEdited.current = true;
    const next: LocationAddress = {
      ...current,
      [key]: nextValue,
      city: key === "city" ? nextValue : city,
      latitude: null,
      longitude: null,
      locationSource: null,
      geocodedAt: null
    };
    currentValue.current = next;
    lastRequestedKey.current = "";
    setStatus({ kind: "idle", message: "" });
    onChangeRef.current(next);
  };

  const updateCoordinate = (key: "latitude" | "longitude", rawValue: string) => {
    const current = currentValue.current;
    const coordinate = rawValue === "" ? null : Number(rawValue);
    const next: LocationAddress = {
      ...current,
      [key]: coordinate !== null && Number.isFinite(coordinate) ? coordinate : null,
      locationSource: "manual",
      geocodedAt: null
    };
    currentValue.current = next;
    onChangeRef.current(next);
    const completeCoordinates = next.latitude !== null && next.longitude !== null;
    setStatus(completeCoordinates ? { kind: "found", message: "Standort manuell gesetzt." } : { kind: "idle", message: "" });
  };

  const hasCoordinates = value.latitude !== null && value.longitude !== null && Number.isFinite(value.latitude) && Number.isFinite(value.longitude);
  const approximate = value.locationSource?.includes("postal_code") ?? false;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-[1fr_0.45fr]">
        <label className="block"><span className="text-sm font-bold text-ink dark:text-white">Straße</span><input value={value.street} onChange={(event) => updateAddress("street", event.target.value)} autoComplete="address-line1" className={fieldClass} /></label>
        <label className="block"><span className="text-sm font-bold text-ink dark:text-white">Hausnummer</span><input value={value.houseNumber} onChange={(event) => updateAddress("houseNumber", event.target.value)} autoComplete="address-line2" className={fieldClass} /></label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[0.55fr_1fr]">
        <label className="block"><span className="text-sm font-bold text-ink dark:text-white">Postleitzahl</span><input required={postalCodeRequired} inputMode="numeric" pattern="[0-9]{5}" value={value.postalCode} onChange={(event) => updateAddress("postalCode", event.target.value)} autoComplete="postal-code" className={fieldClass} /></label>
        <label className="block"><span className="text-sm font-bold text-ink dark:text-white">Ort</span><input value={value.city} onChange={(event) => updateAddress("city", event.target.value)} autoComplete="address-level2" className={fieldClass} /></label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-sm font-bold text-ink dark:text-white">Breitengrad</span><input type="number" min="-90" max="90" step="any" value={value.latitude ?? ""} onChange={(event) => updateCoordinate("latitude", event.target.value)} className={fieldClass} /></label>
        <label className="block"><span className="text-sm font-bold text-ink dark:text-white">Längengrad</span><input type="number" min="-180" max="180" step="any" value={value.longitude ?? ""} onChange={(event) => updateCoordinate("longitude", event.target.value)} className={fieldClass} /></label>
      </div>

      {status.kind !== "idle" ? (
        <p role="status" aria-live="polite" className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${status.kind === "not_found" ? "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100" : "bg-mint text-teal dark:bg-teal-950 dark:text-teal-100"}`}>
          {status.kind === "searching" ? <LoaderCircle className="animate-spin" size={17} aria-hidden="true" /> : status.kind === "not_found" ? <CircleAlert size={17} aria-hidden="true" /> : <MapPin size={17} aria-hidden="true" />}
          {status.message}
        </p>
      ) : null}

      {hasCoordinates ? (
        <div className="mt-4">
          <LocationMap latitude={value.latitude!} longitude={value.longitude!} approximate={approximate} />
          {approximate ? <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Die Markierung zeigt nur den ungefähren Bereich der Postleitzahl.</p> : null}
        </div>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Die Standortsuche läuft serverseitig über OpenStreetMap/Nominatim. Gefundene Werte bleiben manuell änderbar.</p>
    </div>
  );
}
