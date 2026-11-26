// Defence-in-depth input sanitisation. React escapes output, and prompts receive user text
// only inside JSON-encoded context, but we still normalise and strip markup at the boundary.

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAGS = /<\/?[a-z][^>]*>/gi;

export function sanitizeText(input: string, maxLen = 500): string {
  return input
    .normalize('NFC')
    .replace(CONTROL_CHARS, '')
    .replace(HTML_TAGS, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLen);
}

/** Rounds coordinates to ~1 km so community reports never expose a precise (e.g. home) location. */
export function coarsenCoordinate(value: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
