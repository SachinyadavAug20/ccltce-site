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
float sdEll(vec2 p, vec2 r){ float k = length(p / r); return (k - 1.0) * min(r.x, r.y); }
vec2 rot(vec2 v, float a){ float c = cos(a); return mat2(c, -sin(a), sin(a), c) * v; }
float whale(vec2 p, float t){
  float s = sin(t * 1.4);
  float body = sdEll(p, vec2(0.58, 0.20));
  float stem = sdEll(p - vec2(0.55, 0.10 * s), vec2(0.14, 0.045));
  vec2 q = rot(p - vec2(0.66, 0.10 * s), -s * 0.5);
  float flukes = min(sdEll(q - vec2(0.10, 0.10), vec2(0.16, 0.055)), sdEll(q - vec2(0.10, -0.10), vec2(0.16, 0.055)));
  return min(body, min(stem, flukes));
}
float fish(vec2 p, float t, float ph){
  float body = sdEll(p, vec2(0.085, 0.036));
  vec2 q = p - vec2(-0.10, sin(t * 7.0 + ph) * 0.05);
  return min(body, sdEll(q, vec2(0.05, 0.028)));
}
float catboat(vec2 p, float t, float look){
  float hull = max(sdEll(p - vec2(0.10, 0.0), vec2(0.18, 0.06)), p.y - 0.045);
  float b = sdEll(p - vec2(-0.02, 0.11), vec2(0.055, 0.075));
  b = min(b, sdEll(p - vec2(-0.02 + look * 0.02, 0.20), vec2(0.046)));
  b = min(b, sdEll(p - vec2(-0.052 + look * 0.02, 0.245), vec2(0.016, 0.026)));
  b = min(b, sdEll(p - vec2(0.016 + look * 0.02, 0.245), vec2(0.016, 0.026)));
  b = min(b, sdEll(p - vec2(0.055, 0.07), vec2(0.07, 0.014)));
  return min(hull, b);
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float t = uTime * 0.045;
  vec2 cell = floor(gl_FragCoord.xy / 3.0);
  vec2 cellUv = (cell + 0.5) * 3.0 / uRes;
  vec2 dim = cellUv * vec2(aspect, 1.0);
  vec2 sea = (dim - 0.5 * vec2(aspect, 1.0)) * 1.6;
  vec2 mSea = (uMouse - 0.5) * vec2(aspect, 1.0) * 1.6;
  vec2 md = (uv - uMouse) * vec2(aspect, 1.0);
  float mDist = length(md);
  float velL = length(uVel);
  float wake = exp(-3.5 * mDist) * velL;
  vec2 swirl = vec2(-md.y, md.x) * exp(-3.5 * mDist) * 10.0 * uVel;

  vec2 p = dim * (2.2 + 0.12 * sin(t * 0.7)) + swirl;
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

  for (int i = 0; i < 4; i++){
    float fi = float(i);
    float span = aspect + 1.2;
    vec2 f0 = vec2(
      mod(t * (0.9 + 0.12 * fi) + fi * 2.4, span) - span * 0.5,
      -0.5 + 0.26 * fi + 0.05 * sin(uTime * 0.5 + fi * 1.7));
    vec2 flee = f0 - mSea;
    vec2 fdir = flee * inversesqrt(max(dot(flee, flee), 0.000001));
    f0 += fdir * exp(-3.0 * length(flee)) * velL * 0.45;
    float df = fish((f0 - sea) / (0.55 + 0.14 * fi), uTime, fi * 2.0);
    col = mix(col, vec3(0.02, 0.06, 0.06), (1.0 - smoothstep(0.9, 1.6, abs(df))) * 0.7);
    col = mix(col, vec3(0.12, 0.38, 0.33) * (0.85 + 0.15 * ign(cell)), (1.0 - smoothstep(0.1, 0.5, df)) * 0.8);
  }

  vec2 wPos = mSea * 0.45 + vec2(-0.15, 0.10) + vec2(0.12 * sin(uTime * 0.16), 0.08 * sin(uTime * 0.23));
  float dw = whale((wPos - sea) / 1.0, uTime);
  col = mix(col, vec3(0.018, 0.05, 0.05), (1.0 - smoothstep(1.0, 1.8, abs(dw))) * 0.85);
  col = mix(col, vec3(0.10, 0.33, 0.29) * (0.85 + 0.15 * ign(cell + 7.0)), (1.0 - smoothstep(0.05, 0.5, dw)) * 0.85);

  float span2 = aspect + 1.6;
  float bx = mod(t * 0.35 + 2.1, span2) - span2 * 0.5;
  float bDist = length(vec2(bx, -0.52) - mSea);
  float dip = exp(-5.0 * bDist) * min(velL * 2.2, 0.3);
  float rock = 0.09 * sin(uTime * 0.9) + dip * 2.2;
  float look = clamp((mSea.x - bx) * 0.25, -1.0, 1.0);
  vec2 lp = rot(sea - vec2(bx, -0.52 + dip), rock) / 1.1;
  float db = catboat(lp, uTime, look);
  col = mix(col, vec3(0.03, 0.075, 0.07), (1.0 - smoothstep(1.2, 2.2, abs(db))) * 0.85);
  col = mix(col, vec3(0.14, 0.40, 0.35) * (0.85 + 0.15 * ign(cell + 3.0)), (1.0 - smoothstep(0.1, 0.6, db)) * 0.88);
  float blink = step(0.06, fract(uTime * 0.27));
  float eyes = min(
    length(lp - vec2(look * 0.02 - 0.016, 0.205)),
    length(lp - vec2(look * 0.02 + 0.018, 0.205))) - 0.007;
  float head = length(lp - vec2(look * 0.02, 0.2));
  col = mix(col, vec3(0.02, 0.05, 0.05), (1.0 - smoothstep(0.0, 0.4, eyes)) * (1.0 - smoothstep(0.1, 0.6, db)) * blink * (1.0 - smoothstep(0.045, 0.075, head)));

  for (int i = 0; i < 5; i++){
    float fi = float(i);
    float h = fract(sin(fi * 127.1) * 43758.5);
    float by = -0.85 + mod(uTime * (0.055 + 0.014 * fi) + h * 1.5, 1.7);
    float bxx = (h - 0.5) * (aspect + 1.0) + 0.06 * sin(uTime * 0.8 + fi);
    float dBub = length(vec2(bxx, by) - sea) - (0.012 + 0.01 * h);
    col = mix(col, vec3(0.35, 0.80, 0.70), (1.0 - smoothstep(0.0, 0.8, dBub)) * 0.22 * (1.0 - smoothstep(0.75, 0.85, abs(by))));
  }

  col *= 1.0 - 0.45 * smoothstep(0.50, 1.02, length(uv - 0.5));
  col *= 0.96 + 0.04 * sin(gl_FragCoord.y * 3.14159);
  gl_FragColor = vec4(col, 1.0);
}`;
