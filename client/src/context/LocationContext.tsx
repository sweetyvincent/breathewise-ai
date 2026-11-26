import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { GeoPoint, ServerMode } from '@/lib/types';
import { safeStorage } from '@/lib/utils';

const DEFAULT_LOCATION: GeoPoint = { name: 'Delhi, India', lat: 28.6139, lon: 77.209 };

interface LocationState {
  location: GeoPoint;
  setLocation(l: GeoPoint): void;
  /** Force clearly-labelled simulated data even when the server has a live provider. */
  forceDemo: boolean;
  setForceDemo(v: boolean): void;
  /** True when the server (or the user) means data will be simulated. */
  effectiveDemo: boolean;
  mode: ServerMode | null;
  modeError: boolean;
  locateMe(): Promise<string | null>;
}

const Ctx = createContext<LocationState | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<GeoPoint>(() => safeStorage.get('bw.location', DEFAULT_LOCATION));
  const [forceDemo, setForceDemoState] = useState<boolean>(() => safeStorage.get('bw.forceDemo', false));
  const [mode, setMode] = useState<ServerMode | null>(null);
  const [modeError, setModeError] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    api
      .health(ctrl.signal)
      .then((h) => setMode(h.mode))
      .catch((e) => {
        if (!(e instanceof DOMException)) setModeError(true);
      });
    return () => ctrl.abort();
  }, []);

  const setLocation = useCallback((l: GeoPoint) => {
    setLocationState(l);
    safeStorage.set('bw.location', l);
  }, []);
  const setForceDemo = useCallback((v: boolean) => {
    setForceDemoState(v);
    safeStorage.set('bw.forceDemo', v);
  }, []);

  const locateMe = useCallback(async (): Promise<string | null> => {
    if (!('geolocation' in navigator)) return 'Your browser does not support location access. Search for a city instead.';
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Math.round(pos.coords.latitude * 1000) / 1000; // ~100 m; the exact position is never needed
          const lon = Math.round(pos.coords.longitude * 1000) / 1000;
          setLocation({ name: `My location (${lat.toFixed(2)}, ${lon.toFixed(2)})`, lat, lon });
          resolve(null);
        },
        (err) =>
          resolve(
            err.code === err.PERMISSION_DENIED
              ? 'Location permission was denied. You can search for a city instead.'
              : 'Could not determine your location. Try searching for a city.',
          ),
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
      );
    });
  }, [setLocation]);

  const value = useMemo<LocationState>(
    () => ({
      location,
      setLocation,
      forceDemo,
      setForceDemo,
      effectiveDemo: forceDemo || mode?.airQuality !== 'live',
      mode,
      modeError,
      locateMe,
    }),
    [location, setLocation, forceDemo, setForceDemo, mode, modeError, locateMe],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocationCtx(): LocationState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLocationCtx must be used inside <LocationProvider>');
  return v;
}
