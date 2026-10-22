export const VERT = `void main(){ gl_Position = vec4(position, 1.0); }`;

export const FRAG = `
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform vec2 uVel;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float t = uTime * 0.05;
  vec2 md = (uv - uMouse) * vec2(aspect, 1.0);
  float mDist = length(md);
  float velL = length(uVel);
  vec2 wind = normalize(md) * exp(-2.5 * mDist) * velL * 0.15;
  vec2 p = vec2(aspect, 1.0) * 2.2 + wind * 0.5;
  float n = fract(fbm(p * 1.5 + t) * 4.5 + (ign(cell) - 0.5) * 0.5);
  n = n * n * (3.0 - 2.0 * n);
  float v = clamp(n, 0.0, 1.0);
  vec3 col = mix(vec3(0.02, 0.04, 0.05), vec3(0.07, 0.18, 0.20), smoothstep(0.2, 0.8, v));
  col += step(0.95, ign(cell + floor(uTime * 2.0) * 9.0)) * v * vec3(0.20, 0.35, 0.30) * 0.4;
  col *= 1.0 - 0.30 * smoothstep(0.4, 1.02, length(uv - 0.5));
  col *= 0.98 + 0.02 * sin(gl_FragCoord.y * 3.14159);
  gl_FragColor = vec4(col, 1.0);
}`;