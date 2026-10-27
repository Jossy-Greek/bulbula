"use client";

import { useSyncExternalStore } from "react";
import { OPT_OUT_KEY } from "@/lib/track";

const read = () => {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
};
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** Lets the admin keep their own visits out of the numbers (stored in this browser only). */
export default function ExcludeMe() {
  const excluded = useSyncExternalStore(subscribe, read, () => false);
  return (
    <label className="an-exclude">
      <input
        type="checkbox"
        checked={excluded}
        onChange={(e) => {
          try {
            if (e.target.checked) localStorage.setItem(OPT_OUT_KEY, "1");
            else localStorage.removeItem(OPT_OUT_KEY);
          } catch {}
          listeners.forEach((l) => l());
        }}
      />
      Don’t count my visits from this browser
    </label>
  );
}
