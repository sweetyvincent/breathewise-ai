import { useEffect, useState, type FormEvent } from 'react';
import { useLocationCtx } from '@/context/LocationContext';
import { api } from '@/lib/api';
import type { GeoPoint } from '@/lib/types';

const MIN_QUERY_LENGTH = 2;
const PRESET_COUNT = 6;

const foundMessage = (count: number) =>
  count
    ? `${count} place${count > 1 ? 's' : ''} found. Choose one below.`
    : 'No places found. Try another spelling, or pick an example city.';

/** State and actions behind the location bar: city search, example cities, geolocation and a live status message. */
export function useLocationSearch() {
  const { setLocation, locateMe } = useLocationCtx();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoPoint[]>([]);
  const [presets, setPresets] = useState<GeoPoint[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  // Example cities come from the same search endpoint (an empty query returns the suggestions).
  useEffect(() => {
    const controller = new AbortController();
    api
      .searchLocations('', controller.signal)
      .then((r) => setPresets(r.results.slice(0, PRESET_COUNT)))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const search = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setStatus(`Type at least ${MIN_QUERY_LENGTH} letters of a city name.`);
      return;
    }
    setBusy(true);
    setStatus('Searching…');
    try {
      const r = await api.searchLocations(trimmed);
      setResults(r.results);
      setStatus(foundMessage(r.results.length));
    } catch {
      setStatus('Search is unavailable right now. Pick an example city instead.');
    } finally {
      setBusy(false);
    }
  };

  const choose = (place: GeoPoint) => {
    setLocation(place);
    setResults([]);
    setQuery('');
    setStatus(`Location set to ${place.name}.`);
  };

  const locate = async () => {
    setStatus('Finding your location…');
    const error = await locateMe();
    setStatus(error ?? 'Using your current location.');
  };

  return { query, setQuery, results, presets, status, busy, search, choose, locate };
}
