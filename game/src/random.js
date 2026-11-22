// The Velvet Vault — a small seeded random source, so a screenshot scene
// and a play-test can be replayed exactly from one seed. One clear job:
// deterministic randomness, nothing else.

// mulberry32: a tiny, well-behaved seeded PRNG.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function range(rng, min, max) {
  return min + rng() * (max - min);
}

export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

// A stable seed from a URL query (?seed=7) or a date string, so the same
// link always stages the same room.
export function seedFrom(value) {
  if (value === null || value === undefined || value === '') return 1;
  const n = Number(value);
  if (Number.isFinite(n)) return Math.floor(Math.abs(n)) || 1;
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}
