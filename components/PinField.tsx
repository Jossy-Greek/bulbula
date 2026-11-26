"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { LocateFixed, MapPin, X } from "lucide-react";
import type { Content } from "@/data/content";
import type { Pin } from "./PinMap";

type Text = Content["addPage"]["fields"]["pin"];

// Leaflet touches `window`; and its code + tiles load only once the visitor opens the map.
const PinMap = dynamic(() => import("./PinMap"), {
  ssr: false,
  loading: () => <div className="h-[320px] animate-pulse rounded-xl border border-border bg-tint sm:h-[380px]" />,
});

const round = (n: number) => Math.round(n * 1e6) / 1e6;

/**
 * An optional map pin for the place, sent as hidden `lat`/`lng` fields.
 * "Use my location" asks the browser once; the position is used only to
 * place the pin, and leaves the phone only if the visitor sends the form.
 */
export default function PinField({ t }: { t: Text }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState<Pin | null>(null);
  const [focus, setFocus] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(false);

  function locate() {
    if (!navigator.geolocation) return setLocError(true);
    setLocating(true);
    setLocError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setFocus((f) => f + 1);
      },
      () => {
        setLocating(false);
        setLocError(true);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  }

  return (
    <div className="sm:col-span-2">
      <span className="label">{t.label}</span>
      {pin ? (
        <>
          <input type="hidden" name="lat" value={round(pin.lat)} />
          <input type="hidden" name="lng" value={round(pin.lng)} />
        </>
      ) : null}
      {open ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">{pin ? t.dragHint : t.tapHint}</p>
          <PinMap pin={pin} focus={focus} onPin={setPin} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={locate} disabled={locating} className="btn btn-outline">
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
              {locating ? t.locating : t.useLocation}
            </button>
            {pin ? (
              <button type="button" onClick={() => setPin(null)} className="btn btn-outline">
                <X className="h-4 w-4" aria-hidden="true" />
                {t.remove}
              </button>
            ) : null}
          </div>
          {locError ? <p className="text-sm font-semibold text-[#8f2a1d]">{t.locationFailed}</p> : null}
          {pin ? <p className="text-sm font-semibold text-teal-text">{t.pinned}</p> : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-4 rounded-xl border border-dashed border-border p-4 text-left transition hover:border-teal hover:bg-tint/50"
        >
          <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-tint text-teal-text">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-sm text-muted">{t.openHint}</span>
        </button>
      )}
    </div>
  );
}
