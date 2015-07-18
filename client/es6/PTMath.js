export function lerp(a, b, t) {
  return a + t * (b - a);
}

export function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

export function length(vec2) {
  const [a, b] = [vec2[0], vec2[1]];
  return Math.sqrt(a * a + b * b);
}

export function normalize(vec2) {
  const magnitude = length(vec2);
  return [vec2[0] / magnitude, vec2[1] / magnitude];
}
