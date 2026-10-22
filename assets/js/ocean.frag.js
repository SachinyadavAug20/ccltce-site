export const VERT = `void main(){ gl_Position = vec4(position, 1.0); }`;

export const FRAG = `
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform vec2 uVel;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float t = uTime * 0.04;
  vec2 md = (uv - uMouse) * vec2(aspect, 1.0);
  float mDist = length(md);
  float velL = length(uVel);
  // horizon line at 80% height
  float horizon = smoothstep(0.75, 0.85, uv.y);
  // ASCII-style cell grid (8px cell)
  vec2 cell = floor(gl_FragCoord.xy / 8.0);
  vec2 cellUv = cell * 8.0 / uRes;
  // fbm noise for cloudiness
  float n = fbm(cellUv * 0.3 + t * 0.1);
  n += fbm(cellUv * 0.3 + vec2(t, -t) * 0.2);
  n += exp(-3.0 * mDist) * velL * 0.08;
  n = n * n * (3.0 - 2.0 * n);
  // quantize to 6 levels for COPS dither look
  float v = clamp(floor(n * 6.0) / 6.0, 0.0, 1.0);
  // mouse swirl
  float swirl = sin(dot(md, vec2(-1.0, 1.0)) * 6.0 + t * 3.0) * 0.5 + 0.5;
  // 4 palette colours (teal-dominant like reference)
  vec3 col;
  if (v < 0.16) col = vec3(0.02, 0.04, 0.05);
  else if (v < 0.33) col = vec3(0.07, 0.14, 0.18);
  else if (v < 0.50) col = vec3(0.18, 0.35, 0.38);
  else if (v < 0.66) col = vec3(0.35, 0.55, 0.52);
  else col = vec3(0.52, 0.68, 0.66);
  // mix in mouse swirl influence
  col = mix(col, vec3(0.10, 0.40, 0.45), swirl * 0.3);
  // rare glint
  col += step(0.97, floor(n * 7.0)) * v * vec3(0.22, 0.38, 0.33) * 0.4;
  // vignette
  col *= 1.0 - 0.35 * smoothstep(0.4, 1.02, length(uv - 0.5));
  // horizon band - dark ground at bottom
  col = mix(col, vec3(0.01, 0.02, 0.03), horizon * 0.8);
  // subtle scanline
  col *= 0.97 + 0.03 * sin(gl_FragCoord.y * 3.14159);
  gl_FragColor = vec4(col, 1.0);
}`;