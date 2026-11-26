/** Output screening applied to every model response before it can reach a user. */

const UNSAFE_PATTERNS: RegExp[] = [
  /\b(100\s?%|completely|totally|absolutely|entirely|perfectly)\s+(safe|protected|protect)/i,
  /\b(guaranteed?|guarantees)\b.{0,30}\b(safe|protect|healthy|clean)/i,
  /\byou (have|probably have|likely have|may have|are suffering from)\s+(asthma|bronchitis|copd|pneumonia|an? (infection|lung|respiratory))/i,
  /\b(take|use|inhale)\s+\d+(\.\d+)?\s?(mg|mcg|ml|puffs?)\b/i,
  /\bi (prescribe|recommend (the )?medication)\b/i,
  /\bcures?\b/i,
];

const PLANT_CLAIM =
  /(plants?|snake plant|spider plant|peace lily|areca palm)[^.]{0,90}\b(remove|purif|clean|filter|absorb|detox)\w*[^.]{0,50}(air|pollut|toxin|smog)/i;
const PLANT_NEGATION = /\b(not|n't|myth|negligible|minimal|little|cannot|can't|never|no meaningful|don't)\b/i;

/** Thresholds a model may legitimately mention ("if AQI reaches 300"). */
const ALLOWED_AQI_MENTIONS = new Set([50, 51, 100, 101, 200, 201, 300, 301, 400, 401, 500]);
const AQI_MENTION = /\bAQI\s*(?:is|of|at|reading|reads|=|:|currently|now)?\s*(\d{1,3})\b/gi;

export function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // A myth is only judged together with its rebuttal ("Plants clean the air" → "Not at room scale").
    if (typeof obj.myth === 'string' && typeof obj.reality === 'string') out.push(`${obj.myth} — ${obj.reality}`);
    else Object.values(obj).forEach((v) => collectStrings(v, out));
  }
  return out;
}

export interface ScreenResult {
  ok: boolean;
  reason?: string;
}

/**
 * @param actualAqi when provided, any AQI figure the model states that is not the real value (±10) or a
 *                  standard threshold is treated as an invented number and rejected.
 */
export function screenText(texts: string[], opts: { actualAqi?: number } = {}): ScreenResult {
  for (const t of texts) {
    for (const re of UNSAFE_PATTERNS) if (re.test(t)) return { ok: false, reason: `unsafe phrase: ${re.source.slice(0, 30)}` };
    if (PLANT_CLAIM.test(t) && !PLANT_NEGATION.test(t)) return { ok: false, reason: 'plants-clean-air claim' };
    if (opts.actualAqi !== undefined) {
      for (const m of t.matchAll(AQI_MENTION)) {
        const n = Number(m[1]);
        if (Math.abs(n - opts.actualAqi) > 10 && !ALLOWED_AQI_MENTIONS.has(n)) return { ok: false, reason: `invented AQI figure ${n}` };
      }
    }
  }
  return { ok: true };
}

export function screenValue(value: unknown, opts: { actualAqi?: number } = {}): ScreenResult {
  return screenText(collectStrings(value), opts);
}
