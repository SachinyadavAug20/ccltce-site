export const FRAG = `
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform vec2 uVel;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.55; }
  return v;
}
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float t = uTime * 0.045;
  vec2 cell = floor(gl_FragCoord.xy / 3.0);
  vec2 cellUv = (cell + 0.5) * 3.0 / uRes;
  vec2 md = (uv - uMouse) * vec2(aspect, 1.0);
  float mDist = length(md);
  float velL = length(uVel);
  float wake = exp(-3.5 * mDist) * velL;
  vec2 swirl = vec2(-md.y, md.x) * exp(-3.5 * mDist) * 8.0 * uVel;

  vec2 p = cellUv * vec2(aspect, 1.0) * (2.2 + 0.12 * sin(t * 0.7)) + swirl;
  vec2 warp = vec2(fbm(p * 1.6 + t), fbm(p * 1.6 - t + 4.0));
  float n = smoothstep(0.18, 0.88, fbm(p * 2.2 + warp * 1.6 + uMouse * 0.25));
  float glow = exp(-5.0 * mDist) * (0.15 + 0.03 * sin(uTime * 1.7));
  float rip = sin(26.0 * mDist - uTime * 4.0);
  float v = clamp(n + glow + wake * (0.06 + 0.06 * rip), 0.0, 1.0);
  v = clamp(floor(v * 6.0 + (ign(cell) - 0.5) * 0.7) / 6.0, 0.0, 1.0);

  vec3 col = mix(vec3(0.006, 0.012, 0.016), vec3(0.020, 0.055, 0.060), smoothstep(0.10, 0.34, v));
  col = mix(col, vec3(0.065, 0.230, 0.205), smoothstep(0.38, 0.60, v));
  col = mix(col, vec3(0.105, 0.360, 0.320), smoothstep(0.64, 0.84, v));
  col = mix(col, vec3(0.190, 0.560, 0.490), smoothstep(0.90, 0.99, v));
  col += step(0.997, ign(cell + floor(uTime * 2.0) * 11.0)) * v * vec3(0.30, 0.50, 0.45) * 0.55;

  col *= 1.0 - 0.45 * smoothstep(0.50, 1.02, length(uv - 0.5));
  col *= 0.97 + 0.03 * sin(gl_FragCoord.y * 3.14159);
  gl_FragColor = vec4(col, 1.0);
}`;
