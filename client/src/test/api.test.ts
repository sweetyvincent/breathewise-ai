import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, setTokenProvider } from '@/lib/api';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
afterEach(() => {
  vi.unstubAllGlobals();
  setTokenProvider(async () => null);
});

describe('api client', () => {
  it('sends the bearer token and JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { reply: 'ok', generatedBy: 'rules', dataQuality: null, disclaimer: '' }));
    vi.stubGlobal('fetch', fetchMock);
    setTokenProvider(async () => 'demo-abcdefgh1234');
    await api.chat({ messages: [{ role: 'user', content: 'hi' }], demo: true });
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toContain('/api/ai/chat');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer demo-abcdefgh1234');
    expect(JSON.parse(init.body as string).messages[0].content).toBe('hi');
  });

  it('omits empty query params and puts coordinates in the query string', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, {}));
    vi.stubGlobal('fetch', fetchMock);
    await api.airQuality({ lat: 28.6, lon: 77.2, name: 'Delhi' }, false);
    const url = String((fetchMock.mock.calls[0] as [URL])[0]);
    expect(url).toContain('lat=28.6');
    expect(url).not.toContain('demo=');
  });

  it('turns server validation errors into friendly ApiErrors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        json(400, {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Some inputs are invalid.',
            details: [{ field: 'distanceKm', message: 'Too big' }],
          },
        }),
      ),
    );
    const err = await api
      .mobility({
        location: { lat: 1, lon: 1 },
        distanceKm: 9999,
        preferredMode: 'bus',
        tripsPerWeek: 1,
        sensitive: false,
        travellingWithChildrenOrElderly: false,
        demo: true,
      })
      .catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.friendly).toContain('distanceKm: Too big');
  });

  it('reports network failures in plain language', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const err = await api.health().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('NETWORK');
    expect(err.message).toMatch(/cannot reach/i);
  });
});
