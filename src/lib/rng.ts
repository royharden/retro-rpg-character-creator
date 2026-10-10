export class SeededRNG {
  private state: number;

  constructor(seed: string) {
    this.state = this.hashString(seed);
  }

  private hashString(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  next(): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  weightedSample(probabilities: Record<string, number>): string {
    const entries = Object.entries(probabilities);
    const total = entries.reduce((s, [, p]) => s + p, 0);
    let r = this.next() * total;
    for (const [key, p] of entries) {
      r -= p;
      if (r <= 0) return key;
    }
    return entries[entries.length - 1][0];
  }
}

export function makeSeed(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function hashDescription(text: string): string {
  const normalized = text.trim().toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    h ^= normalized.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
