import { afterEach, describe, expect, it, vi } from 'vitest';
import { TtlCache } from '../src/lib/cache';
import { logger } from '../src/lib/logger';
import { buildChatReply } from '../src/services/rules/chat';
import { contextWithAqi } from './helpers';

describe('TtlCache', () => {
  it('returns fresh entries with their age and expires old ones', () => {
    let t = 1_000;
    const c = new TtlCache<string>(100, 10, () => t);
    c.set('a', 'x');
    t += 40;
    expect(c.get('a')).toEqual({ value: 'x', ageMs: 40 });
    t += 61;
    expect(c.get('a')).toBeUndefined();
    expect(c.size).toBe(0);
  });

  it('evicts the oldest entry when full and refreshes re-set keys', () => {
    const c = new TtlCache<number>(1_000, 2);
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);
    expect(c.get('a')).toBeUndefined();
    expect(c.get('b')?.value).toBe(2);
    c.set('b', 20); // overwriting must not evict anything else
    expect(c.size).toBe(2);
    expect(c.get('c')?.value).toBe(3);
  });
});

describe('logger', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('redacts secrets, tokens and emails (including nested values) before writing', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('LOG_LEVEL', 'debug');
    const out: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
    logger.info('request', { authorization: 'Bearer abc', nested: { apiKey: 'sk-123', email: 'a@b.c', ok: 'visible' } });
    spy.mockRestore();
    const line = out.join('');
    expect(line).not.toMatch(/Bearer abc|sk-123|a@b\.c/);
    expect(line).toContain('visible');
  });

  it('writes errors to stderr and respects the configured level', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('LOG_LEVEL', 'error');
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logger.info('hidden');
    logger.error('shown');
    expect(log).not.toHaveBeenCalled();
    expect(err).toHaveBeenCalledTimes(1);
    log.mockRestore();
    err.mockRestore();
  });
});

describe('BreatheBot replies for every supported question', () => {
  const questions = [
    'Is it safe to go outside today?',
    'Should my children play outdoors?',
    'Is opening windows a good idea right now?',
    'How can I improve air quality in my bedroom?',
    'Which is better: an air purifier or an air conditioner?',
    'What should I do if AQI reaches 300?',
    'How can I commute with less pollution exposure?',
    'Which mask should I wear?',
    'What are the most affordable ways to protect my family?',
    'Tell me something about smog',
  ];

  it.each(questions)('answers "%s" with real data, a caveat and no absolute safety claim', async (q) => {
    for (const aqi of [40, 180, 320, 450]) {
      const reply = buildChatReply(q, await contextWithAqi(aqi));
      expect(reply.length).toBeGreaterThan(80);
      expect(reply).not.toMatch(/completely safe|100% safe|guaranteed|no risk/i);
      expect(reply.toLowerCase()).toMatch(/official|advisor|doctor|not medical/);
    }
  });
});
