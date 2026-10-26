"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type AreaMapType from "./AreaMap";

// Leaflet touches `window`, so the map only renders in the browser.
const AreaMap = dynamic(() => import("./AreaMap"), {
  ssr: false,
  loading: () => <div className="h-[460px] animate-pulse rounded-2xl border border-border bg-tint" />,
});

export default function MapLoader(props: ComponentProps<typeof AreaMapType>) {
  return <AreaMap {...props} />;
}
