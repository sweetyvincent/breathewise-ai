/** Browser stand-in for `node:crypto`, used only by the static (GitHub Pages) build. */
export const randomUUID = (): string => globalThis.crypto.randomUUID();
