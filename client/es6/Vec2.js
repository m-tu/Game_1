export function add(vec2, a) {
  return [vec2[0] + a, vec2[1] + a];
}

export function sub(vec2, a) {
  return add(vec2, -a);
}

export function mul(vec2, a) {
  return [vec2[0] * a, vec2[1] * a];
}

export function div(vec2, a) {
  return [vec2[0] / a, vec2[1] / a];
}

export function add2(a, b) {
  return [a[0] + b[0], a[1] + b[1]];
}

export function sub2(a, b) {
  return [a[0] - b[0], a[1] - b[1]];
}

export function mul2(a, b) {
  return [a[0] * b[0], a[1] * b[1]];
}

export function div2(a, b) {
  return [a[0] / b[0], a[1] / b[1]];
}

export function length(vec2) {
  const [a, b] = [vec2[0], vec2[1]];
  return Math.sqrt(a * a + b * b);
}

export function normalize(vec2) {
  const magnitude = length(vec2);
  return [vec2[0] / magnitude, vec2[1] / magnitude];
}
