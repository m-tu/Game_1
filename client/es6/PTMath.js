export function lerp(a, b, t) {
  return a + t * (b - a);
}

export function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

