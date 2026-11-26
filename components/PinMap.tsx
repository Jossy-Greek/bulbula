"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { site } from "@/data/site";

export type Pin = { lat: number; lng: number };

const icon = L.divIcon({
  className: "",
  html: '<div class="bb-pin claimed active"><span></span></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

/** A tap anywhere puts the pin there. */
function TapToPin({ onPin }: { onPin: (p: Pin) => void }) {
  useMapEvents({ click: (e) => onPin({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

/** Moves the view to the pin when it came from "Use my location" (`focus` changes). */
function FollowPin({ pin, focus }: { pin: Pin | null; focus: number }) {
  const map = useMap();
  useEffect(() => {
    if (pin && focus) map.setView([pin.lat, pin.lng], Math.max(map.getZoom(), 17));
    // Only on a new focus request; following every drag would fight the visitor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, map]);
  return null;
}

/** The Add-a-place map: tap to drop the pin, drag it to fine-tune. */
export default function PinMap({ pin, focus, onPin }: { pin: Pin | null; focus: number; onPin: (p: Pin) => void }) {
  return (
    <MapContainer
      center={pin ? [pin.lat, pin.lng] : [site.center.lat, site.center.lng]}
      zoom={pin ? 17 : 15}
      scrollWheelZoom={false}
      className="h-[320px] w-full rounded-xl border border-border sm:h-[380px]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <TapToPin onPin={onPin} />
      <FollowPin pin={pin} focus={focus} />
      {pin ? (
        <Marker
          position={[pin.lat, pin.lng]}
          icon={icon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = (e.target as L.Marker).getLatLng();
              onPin({ lat: p.lat, lng: p.lng });
            },
          }}
        />
      ) : null}
    </MapContainer>
  );
}
