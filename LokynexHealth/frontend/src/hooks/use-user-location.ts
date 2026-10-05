"use client";

import { useCallback, useEffect, useState } from "react";

export type LocationStatus =
  | "loading"
  | "ready"
  | "denied"
  | "unsupported"
  | "error";

interface CachedLocation {
  lat: number;
  lng: number;
  label: string;
  ts: number;
}

const CACHE_KEY = "lokynex-user-location";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const SAME_PLACE_DEG = 0.01; // ~1 km — reuse cached name, skip reverse lookup

function readCache(): CachedLocation | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedLocation) : null;
  } catch {
    return null;
  }
}

function writeCache(value: CachedLocation) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // storage full / blocked — location still works, just not cached
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const coords = `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  try {
    // Free, key-less endpoint meant for browser use.
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    );
    if (!res.ok) return coords;
    const data = (await res.json()) as {
      locality?: string;
      city?: string;
      principalSubdivision?: string;
      countryName?: string;
    };
    const place = data.locality || data.city;
    const parts = [place, data.principalSubdivision].filter(
      (p, i, all): p is string => !!p && all.indexOf(p) === i,
    );
    return parts.length > 0 ? parts.join(", ") : data.countryName || coords;
  } catch {
    return coords;
  }
}

export function useUserLocation() {
  const [status, setStatus] = useState<LocationStatus>("loading");
  const [label, setLabel] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    setStatus((s) => (s === "ready" ? s : "loading"));

    // This call is what makes the browser show its "Allow location?" prompt
    // next to the address bar.
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const cached = readCache();
        if (
          cached &&
          Date.now() - cached.ts < CACHE_TTL_MS &&
          Math.abs(cached.lat - lat) < SAME_PLACE_DEG &&
          Math.abs(cached.lng - lng) < SAME_PLACE_DEG
        ) {
          setLabel(cached.label);
          setStatus("ready");
          return;
        }

        const name = await reverseGeocode(lat, lng);
        writeCache({ lat, lng, label: name, ts: Date.now() });
        setLabel(name);
        setStatus("ready");
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  useEffect(() => {
    // setTimeout(0): keeps setState out of the synchronous effect body
    // (same pattern the Topbar clock uses).
    const first = setTimeout(() => {
      const cached = readCache();
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        // Show the last known place instantly, then refresh quietly.
        setLabel(cached.label);
        setStatus("ready");
      }
      locate();
    }, 0);
    return () => clearTimeout(first);
  }, [locate]);

  return { status, label, retry: locate };
}
