import { NOISE_GLSL } from "./noise.js";
import { CREATURES_GLSL } from "./creatures.js";
import { VIZ_GLSL } from "./viz.js";
import { PALETTE_GLSL } from "./palette.js";
import { SWIM_GLSL } from "./swim.js";

// One fullscreen pass: an ASCII aquarium — fish in the top 80%, music visualiser in bottom 20%.
export const ASCII_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const ASCII_FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uCellW;
uniform float uCellH;
uniform float uCols;
uniform float uRows;
uniform float uSceneH;
uniform float uSceneW;
uniform sampler2D uAtlas;
uniform vec3 uSkyCol;
uniform vec3 uMidCol;
uniform vec3 uDeepCol;
uniform vec3 uInk;
uniform vec3 uHot;
uniform float uSpec[32];
varying vec2 vUv;

const float VIZH = 0.20;   // music visualiser: bottom 20% of the page

${NOISE_GLSL}
${CREATURES_GLSL}
${VIZ_GLSL}
${PALETTE_GLSL}
${SWIM_GLSL}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 frag = vUv * uRes;
  vec2 csize = vec2(uCellW, uCellH);
  vec2 cell = floor(frag / csize);
  vec2 local = fract(frag / csize);
  vec2 cUv = (cell + 0.5) * csize / uRes;

  float t = uTime;
  vec2 p = (cUv - 0.5) * uRes / uCellH;
  float surf = 0.5 * uSceneH;                       // water surface at top of page
  float vFloor = -0.5 * uSceneH + VIZH * uSceneH;   // visualiser zone: bottom 20%
  float span = surf - vFloor;

  // ---------- water gradient ----------
  vec3 col = mix(uDeepCol, uMidCol, smoothstep(vFloor, 0.10 * uSceneH, p.y));
  col = mix(col, uSkyCol, smoothstep(0.14 * uSceneH, surf, p.y));

  // ---------- wave lines ----------
  float depth = clamp((surf - p.y) / span, 0.0, 1.0);
  float sea = 1.0 - smoothstep(0.84, 1.04, depth);
  float w1 = sin(p.x * 0.30 + t * 0.9) * 0.55;
  float w2 = sin(p.x * 0.11 - t * 0.6) * 1.10;
  float w3 = fbm(vec2(p.x * 0.05 + t * 0.03, 11.3), 3) * 1.4;
  float yw = depth * 4.2 + (w1 * 0.18 + w2 * 0.10 + w3 * 0.06);
  float f = fract(yw);
  float dl = min(f, 1.0 - f);
  float stripe = 1.0 - smoothstep(0.06, 0.30, dl);
  float wob = 0.42 + 0.58 * (fbm(vec2(p.x * 0.06, floor(yw) * 5.1 + t * 0.1), 2) * 0.5 + 0.5);
  float density = stripe * wob * sea;

  // ---------- creatures: eight swimmers across the water ----------
  vec3 cr = sceneCrit(p, t);
  float halo = 0.035 * span;
  float isCrit = 0.0;
  if (cr.x < 0.0) { density = 1.0; isCrit = 1.0; }
  else if (cr.x < halo) { density = 0.0; }
  if (isCrit > 0.5 && cr.y > 0.45) density = 0.0;

  // ---------- visualiser bars + aurora (bottom 20%) ----------
  float vBase = -0.5 * uSceneH + 0.35;
  float bval = vizBandValue(p, uSceneW);
  float vTop = vBase + bval * uSceneH * VIZH;
  float band = vizBandPos(p, uSceneW);
  float viz = step(vBase, p.y) * step(p.y, vTop) * step(0.14, band) * step(band, 0.95);
  float aur = vizAurora(p, uSceneW, uSceneH, t, vBase, bval);
  if (viz > 0.5) density = 1.0;
  else if (aur > 0.02) density = aur;

  // ---------- glyph pick ----------
  float rnd = hash21(cell + 3.7);
  float rnd2 = hash21(cell * 1.31 + 9.1);
  float setF = 1.0;
  if (isCrit > 0.5 || viz > 0.5) setF = 0.0;
  else if (rnd > 0.72) setF = 2.0 + floor(rnd2 * (uRows - 2.0));
  float idx = floor(clamp(density, 0.0, 0.999) * uCols);
  if (isCrit > 0.5 || viz > 0.5) idx = floor(hash21(cell * 1.7 + 21.3) * uCols);
  vec2 gUv = vec2((idx + local.x) / uCols, (uRows - setF - 1.0 + local.y) / uRows);
  float cov = texture2D(uAtlas, gUv).r;

  // ---------- compose ----------
  vec3 ink = ramp3(fract(floor(yw) * 0.11 + p.x * 0.012 + t * 0.02));
  float alpha = cov * 0.62;
  if (isCrit > 0.5) { ink = critColor(mod(cr.z, 5.0)); alpha = cov; }
  if (viz > 0.5) {
    ink = ramp3(clamp((p.y - vBase) / max(0.001, vTop - vBase), 0.0, 1.0));
    alpha = cov * 0.95;
  } else if (aur > 0.02) {
    ink = ramp3(clamp(bval * 0.85, 0.0, 1.0));
    alpha = cov * aur * 0.9;
  }
  col = mix(col, ink, alpha);
  col += ink * (density * 0.035 + (isCrit > 0.5 ? 0.10 : 0.0));

  // aurora glow + warm surface light
  col += mix(uInk, ramp3(clamp(bval, 0.0, 1.0)), 0.6) * aur * 0.18;
  col += uHot * 0.07 * exp(-abs(p.y - surf) * 26.0);

  // vignette
  vec2 v = vUv - 0.5;
  col *= 1.0 - dot(v, v) * 0.55;

  gl_FragColor = vec4(col, 1.0);
}
`;