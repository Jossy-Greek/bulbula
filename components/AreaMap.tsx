"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Locale } from "@/data/content";
import { site } from "@/data/site";

export type MapPoint = {
  slug: string;
  name: string;
  category: string;
  group: "business" | "community";
  claimed: boolean;
  lat: number;
  lng: number;
  /** Google Maps link for the place (see googleMapsUrl). */
  mapsUrl: string;
};

function pin(p: MapPoint, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="bb-pin ${p.group === "community" ? "community" : ""} ${p.claimed ? "claimed" : ""} ${active ? "active" : ""}"><span></span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });
}

function fitTo(map: L.Map, points: MapPoint[]) {
  if (!points.length) return;
  if (points.length === 1) map.setView([points[0].lat, points[0].lng], 16);
  else map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [36, 36], maxZoom: 16 });
}

/**
 * Leaflet measures its box once. Re-measure when it is resized or un-hidden
 * (the phone Map/List switch) — and, when fitting to points, refit after
 * coming out of a hidden (0×0) state, where any earlier fit was meaningless.
 */
function AutoResize({ points, fit }: { points: MapPoint[]; fit: boolean }) {
  const map = useMap();
  const latest = useRef(points);
  useEffect(() => {
    latest.current = points;
  }, [points]);
  useEffect(() => {
    let wasHidden = map.getContainer().clientWidth === 0;
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
      const hidden = map.getContainer().clientWidth === 0;
      if (fit && wasHidden && !hidden) fitTo(map, latest.current);
      wasHidden = hidden;
    });
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map, fit]);
  return null;
}

/** Zooms the map to the given points whenever the set changes (the list+map view). */
function FitToPoints({ points }: { points: MapPoint[] }) {
  const map = useMap();
  const key = points.map((p) => p.slug).join(",");
  useEffect(() => {
    if (map.getContainer().clientWidth > 0) fitTo(map, points);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit only when the set of places changes
  }, [key, map]);
  return null;
}

/**
 * OpenStreetMap tiles with one pin per listing. Light use of the public tile
 * server with attribution follows its usage policy; switch providers if
 * traffic grows (see README).
 */
export default function AreaMap({
  points,
  locale,
  detailsLabel,
  mapsLabel,
  showDetails = true,
  fit = false,
  activeSlug = null,
  height = 460,
  center,
  zoom,
}: {
  points: MapPoint[];
  locale: Locale;
  detailsLabel: string;
  mapsLabel: string;
  /** Off on a business page, where the popup would link to the page itself. */
  showDetails?: boolean;
  /** Zoom to the points instead of the fixed area view. */
  fit?: boolean;
  /** The pin to highlight (the card under the pointer). */
  activeSlug?: string | null;
  height?: number | string;
  center?: { lat: number; lng: number };
  zoom?: number;
}) {
  const c = center ?? site.center;
  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-border" style={{ height }}>
      <MapContainer center={[c.lat, c.lng]} zoom={zoom ?? site.zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AutoResize points={points} fit={fit} />
        {fit ? <FitToPoints points={points} /> : null}
        {points.map((p) => (
          <Marker key={p.slug} position={[p.lat, p.lng]} icon={pin(p, p.slug === activeSlug)} zIndexOffset={p.slug === activeSlug ? 1000 : 0} title={p.name}>
            <Popup>
              <p style={{ fontWeight: 700, color: "#0e3d47", margin: 0 }}>{p.name}</p>
              <p style={{ color: "#4b5f63", margin: "2px 0 8px" }}>{p.category}</p>
              <span style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
                {showDetails ? (
                  <a href={`/${locale}/b/${p.slug}`} style={{ color: "#17646d", fontWeight: 700 }}>
                    {detailsLabel} →
                  </a>
                ) : null}
                <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#17646d", fontWeight: 700 }}>
                  {mapsLabel} ↗
                </a>
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
