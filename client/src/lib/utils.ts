import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/** localStorage/sessionStorage can throw (private mode, blocked cookies); never let that break the UI. */
export const safeStorage = {
  get<T>(key: string, fallback: T, store: Storage | undefined = globalThis.localStorage): T {
    try {
      const raw = store?.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown, store: Storage | undefined = globalThis.localStorage): void {
    try {
      store?.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
  remove(key: string, store: Storage | undefined = globalThis.localStorage): void {
    try {
      store?.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export function timeAgo(iso: string, now: number = Date.now()): string {
  const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
