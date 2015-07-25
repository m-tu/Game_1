export function absoluteRot(a) {

  const TWO_PI = Math.PI * 2;

  while (a < 0) {
    a += TWO_PI;
  }

  while(a > TWO_PI) {
    a -= TWO_PI
  }

  return a;
}

export function shortestTurn(a, b) {
  
  const t1 = absoluteRot(b - a);
  const t2 = -absoluteRot(a - b);

  if (Math.abs(t1) > Math.abs(t2)) return t2;

  return t1;
}

export function rlerp(u, v, t) {

  const d = shortestTurn(u, v);

  return u + d * t;
}

export function lerp(a, b, t) {
  return a + t * (b - a);
}

export function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

