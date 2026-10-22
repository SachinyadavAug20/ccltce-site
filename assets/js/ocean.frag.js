export const VERT = `void main(){ gl_Position = vec4(position, 1.0); }`;

export const FRAG = `
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform float uPalette;
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
  float t = uTime * 0.03;
  vec2 cell = floor(gl_FragCoord.xy / 3.0);
  vec2 cellUv = (cell + 0.5) * 3.0 / uRes;
  vec2 md = (uv - uMouse) * vec2(aspect, 1.0);
  float mDist = length(md);
  float velL = length(uVel);
  vec2 wind = normalize(md) * exp(-2.0 * mDist) * velL * 0.2;
  vec2 p = cellUv * vec2(aspect, 1.0) * 2.4 + wind;
  vec2 warp = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 - t + 3.7));
  float n = fbm(p * 2.0 + warp * 1.8 + md * 0.5);
  n = n * n * (3.0 - 2.0 * n);
  float v = clamp(floor(n * 5.0 + (ign(cell) - 0.5) * 0.5) / 5.0, 0.0, 1.0);
  vec3 col;
  if (uPalette == 0.0) {
    col = mix(vec3(0.01,0.02,0.03), vec3(0.08,0.25,0.22), smoothstep(0.0, 0.5, v));
    col = mix(col, vec3(0.20,0.45,0.40), smoothstep(0.5, 1.0, v));
  } else if (uPalette == 1.0) {
    col = mix(vec3(0.30,0.02,0.05), vec3(0.60,0.15,0.10), smoothstep(0.0, 0.5, v));
    col = mix(col, vec3(0.80,0.40,0.20), smoothstep(0.5, 1.0, v));
  } else if (uPalette == 2.0) {
    col = mix(vec3(0.10,0.08,0.02), vec3(0.25,0.18,0.05), smoothstep(0.0, 0.5, v));
    col = mix(col, vec3(0.50,0.40,0.20), smoothstep(0.5, 1.0, v));
  } else {
    col = mix(vec3(0.02,0.05,0.07), vec3(0.05,0.30,0.35), smoothstep(0.0, 0.5, v));
    col = mix(col, vec3(0.10,0.65,0.70), smoothstep(0.5, 1.0, v));
  }
  float t2 = uTime * 0.15;
  float ps = sin(t2) * 0.5 + 0.5;
  col = mix(col, vec3(0.12,0.28,0.35), ps * 0.2);
  col += step(0.97, ign(cell + floor(uTime * 2.0) * 11.0)) * v * vec3(0.22,0.38,0.33) * 0.45;
  col *= 1.0 - 0.35 * smoothstep(0.55, 1.02, length(uv - 0.5));
  col *= 0.96 + 0.04 * sin(gl_FragCoord.y * 3.21459);
  gl_FragColor = vec4(col, 1.0);
}`;