"use client";

import dynamic from "next/dynamic";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import type AreaMapType from "./AreaMap";

const placeholder = <div className="h-[460px] animate-pulse rounded-2xl border border-border bg-tint" />;

// Leaflet touches `window`, so the map only renders in the browser.
const AreaMap = dynamic(() => import("./AreaMap"), { ssr: false, loading: () => placeholder });

/**
 * The map (Leaflet's code and the OpenStreetMap tiles, ~250 KB) loads only when it's about to
 * scroll into view, so it no longer competes with the top of the page on a phone connection.
 */
export default function MapLoader(props: ComponentProps<typeof AreaMapType>) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return <div ref={ref}>{near ? <AreaMap {...props} /> : placeholder}</div>;
}
