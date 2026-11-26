import { vi } from 'vitest';
import { handleStatic } from '@/static/staticBackend';

/** Routes `fetch` to the in-browser backend, so page tests exercise the real handlers end to end. */
export function useStaticBackend() {
  const fn = vi.fn(async (input: URL | string, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const auth = (init?.headers as Record<string, string> | undefined)?.Authorization;
    try {
      const data = await handleStatic({
        method: init?.method ?? 'GET',
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
        token: auth?.replace('Bearer ', '') ?? null,
      });
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
      const e = err as { status?: number; code?: string; message?: string; details?: unknown };
      return new Response(JSON.stringify({ error: { code: e.code, message: e.message, details: e.details } }), { status: e.status ?? 500 });
    }
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}
