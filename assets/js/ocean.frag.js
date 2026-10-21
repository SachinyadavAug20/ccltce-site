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
  float t = uTime * 0.03;
  vec2 cell = floor(gl_FragCoord.xy / 3.0);
  vec2 cellUv = (cell + 0.5) * 3.0 / uRes;
  vec2 md = (uv - uMouse) * vec2(aspect, 1.0);
  float mDist = length(md);
  float velL = length(uVel);

  vec2 flow = vec2(t * 0.35, -t * 0.12) + uMouse * 0.18;
  vec2 swirl = vec2(-md.y, md.x) * exp(-4.0 * mDist) * 8.0 * uVel;
  vec2 p = cellUv * vec2(aspect, 1.0) * 2.4 + swirl;
  vec2 warp = vec2(fbm(p * 1.4 + flow), fbm(p * 1.4 - flow + 3.7));
  float n = fbm(p * 2.0 + warp * 1.8 + flow * 0.5);
  n += exp(-4.0 * mDist) * velL * 0.5;
  n = n * n * (3.0 - 2.0 * n);
  float v = clamp(floor(n * 7.0 + (ign(cell) - 0.5) * 0.8) / 7.0, 0.0, 1.0);

  vec3 col = mix(vec3(0.010, 0.018, 0.022), vec3(0.055, 0.110, 0.115), smoothstep(0.00, 0.38, v));
  col = mix(col, vec3(0.270, 0.360, 0.350), smoothstep(0.38, 0.72, v));
  col = mix(col, vec3(0.520, 0.640, 0.620), smoothstep(0.80, 0.97, v));
  col += step(0.997, ign(cell + floor(uTime * 2.0) * 11.0)) * v * vec3(0.30, 0.50, 0.45) * 0.55;
  col *= 1.0 - 0.30 * smoothstep(0.55, 1.02, length(uv - 0.5));
  col *= 0.97 + 0.03 * sin(gl_FragCoord.y * 3.14159);
  gl_FragColor = vec4(col, 1.0);
}`;
