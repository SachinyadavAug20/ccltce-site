// Colour ramp for the ASCII tank — light, desaturated tints.
// Deliberately no blue shades anywhere in the palette.
export const PALETTE_GLSL = `
// 4-stop light ramp: 0 = pale mint ... 1 = pale rose
vec3 ramp3(float t) {
  t = clamp(t, 0.0, 1.0) * 3.0;
  vec3 c0 = vec3(0.82, 0.95, 0.88);
  vec3 c1 = vec3(0.90, 0.97, 0.80);
  vec3 c2 = vec3(0.98, 0.92, 0.74);
  vec3 c3 = vec3(0.99, 0.83, 0.82);
  if (t < 1.0) return mix(c0, c1, t);
  if (t < 2.0) return mix(c1, c2, t - 1.0);
  return mix(c2, c3, t - 2.0);
}

// creature colour by kind: fish, fish, shark, whale, jelly
vec3 critColor(float id) {
  if (id < 0.5) return vec3(0.55, 0.95, 0.62);
  if (id < 1.5) return vec3(0.75, 0.97, 0.45);
  if (id < 2.5) return vec3(1.00, 0.80, 0.35);
  if (id < 3.5) return vec3(1.00, 0.55, 0.58);
  return vec3(1.00, 0.66, 0.50);
}
`;
