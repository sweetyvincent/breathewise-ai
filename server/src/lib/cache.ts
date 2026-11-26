/** Tiny in-memory TTL cache with a size cap (oldest-inserted eviction). */
export class TtlCache<V> {
  private readonly entries = new Map<string, { value: V; at: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 500,
    private readonly now: () => number = Date.now,
  ) {}

  get(key: string): { value: V; ageMs: number } | undefined {
    const hit = this.entries.get(key);
    if (!hit) return undefined;
    const ageMs = this.now() - hit.at;
    if (ageMs > this.ttlMs) {
      this.entries.delete(key);
      return undefined;
    }
    return { value: hit.value, ageMs };
  }

  set(key: string, value: V): void {
    if (this.entries.size >= this.maxEntries && !this.entries.has(key)) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.delete(key);
    this.entries.set(key, { value, at: this.now() });
  }

  get size(): number {
    return this.entries.size;
  }
}
