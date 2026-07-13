"use client";

import { useEffect } from "react";
import { divIcon } from "leaflet";
import { Circle, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

const markerIcon = divIcon({
  className: "property-location-marker",
  html: "<span aria-hidden=\"true\"></span>",
  iconAnchor: [14, 28],
  iconSize: [28, 28]
});

function RecenterMap({ latitude, longitude, zoom }: { latitude: number; longitude: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], zoom);
  }, [latitude, longitude, map, zoom]);
  return null;
}

export default function LocationMap({ latitude, longitude, approximate }: {
  latitude: number;
  longitude: number;
  approximate: boolean;
}) {
  const zoom = approximate ? 12 : 16;
  return (
    <div role="region" className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700" aria-label={approximate ? "Karte mit ungefährer Lage" : "Karte mit markiertem Standort"}>
      <MapContainer center={[latitude, longitude]} zoom={zoom} scrollWheelZoom={false} className="h-64 w-full sm:h-72">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {approximate ? <Circle center={[latitude, longitude]} radius={1200} pathOptions={{ color: "#0f766e", fillColor: "#99f6e4", fillOpacity: 0.2 }} /> : null}
        <Marker position={[latitude, longitude]} icon={markerIcon} />
        <RecenterMap latitude={latitude} longitude={longitude} zoom={zoom} />
      </MapContainer>
    </div>
  );
}
