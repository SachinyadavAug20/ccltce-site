import { NOISE_GLSL } from "./noise.js";
import { PALETTE_GLSL } from "./palette.js";
import { CREATURES_GLSL } from "./creatures.js";
import { MOBS_GLSL } from "./mobs.js";
import { VIZ_GLSL } from "./viz.js";
import { SWIM_GLSL } from "./swim.js";

// One fullscreen pass: an ASCII aquarium — 3D shaded fish in top 80%, music visualiser in bottom 20%.
export const ASCII_VERT = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const ASCII_FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uCellW; uniform float uCellH;
uniform float uCols; uniform float uRows; uniform float uSceneH; uniform float uSceneW;
uniform sampler2D uAtlas; uniform float uSpec[32]; uniform vec2 uMouse; uniform float uMouseOn;
uniform vec3 uSkyCol; uniform vec3 uMidCol; uniform vec3 uDeepCol; uniform vec3 uInk; uniform vec3 uHot;
varying vec2 vUv;

const float VIZH = 0.18;   // music visualiser: bottom 18% of page

${NOISE_GLSL}
${PALETTE_GLSL}
${CREATURES_GLSL}
${MOBS_GLSL}
${VIZ_GLSL}
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
  vec2 mp = (uMouse - 0.5) * uRes / uCellH;   // cursor in the same cell space
  float mDist = length(p - mp);
  float torch = exp(-mDist * mDist * 0.006) * uMouseOn;
  float surf = 0.5 * uSceneH;                       // water surface at top of page
  float vFloor = -0.5 * uSceneH + VIZH * uSceneH;   // visualiser zone: bottom 18%
  float span = surf - vFloor;

  // ---------- 1. Minecraft stone/bedrock background gradient ----------
  float depthRatio = clamp((surf - p.y) / span, 0.0, 1.0);
  vec3 deepStone = vec3(0.052, 0.050, 0.048);   // bedrock
  vec3 midStone  = vec3(0.072, 0.070, 0.064);   // stone
  vec3 surfStone = vec3(0.094, 0.090, 0.078);   // light stone
  vec3 col = mix(surfStone, midStone, smoothstep(0.0, 0.45, depthRatio));
  col = mix(col, deepStone, smoothstep(0.40, 1.0, depthRatio));

  // Subtle torchlight flicker
  float caustic1 = snoise(vec2(p.x * 0.06 + t * 0.10, p.y * 0.04 - t * 0.06)) * 0.5 + 0.5;
  float caustic2 = snoise(vec2(p.x * 0.12 - t * 0.08, p.y * 0.08 + t * 0.04)) * 0.5 + 0.5;
  float sunRay = exp(-abs(p.y - surf) * 0.09) * (caustic1 * 0.65 + caustic2 * 0.35);
  col += vec3(0.16, 0.11, 0.03) * (sunRay * 0.40);
  // Warm gold shaft down the middle of the surface
  col += vec3(0.14, 0.10, 0.02) * exp(-abs(p.x) * 0.03) * sunRay * 0.5;

  // ---------- 2. 3D Swimmers (Fish, Shark, Jellyfish) ----------
  vec3 critColor = vec3(0.0);
  vec4 critHit = evalMarineLife(p, t, critColor);
  float isCrit = critHit.x, critLum = critHit.y, critHalo = critHit.z, isEye = critHit.w;

  // ---------- 3. Visualiser bars + aurora (bottom 18%) + 3D bubbles ----------
  float vBase = -0.5 * uSceneH + 0.30;
  float bval = vizBandValue(p, uSceneW);
  float vTop = vBase + bval * uSceneH * VIZH;
  float band = vizBandPos(p, uSceneW);
  float viz = step(vBase, p.y) * step(p.y, vTop) * step(0.12, band) * step(band, 0.88);
  float aur = vizAurora(p, uSceneW, uSceneH, t, vBase, bval);
  float bubbles = eval3DBubbles(p, t);

  // ---------- 4. Glyph picking & 3D Shading ----------
  float setF = 2.0; // default: subtle caustics (Row 2)
  float idx  = 0.0;
  vec3 ink   = vec3(0.0);
  float alpha = 0.0;

  if (isCrit > 0.5) {
    // 3D Marine Life hit: Use Row 0 (genuine 3D luminance ramp)
    setF = 0.0;
    idx = floor(clamp(critLum, 0.05, 0.999) * uCols);
    ink = critColor;
    alpha = 0.98;
  } else if (viz > 0.5) {
    // Music visualizer bar: Row 3 (clean tech / block glyphs)
    setF = 3.0;
    float normH = clamp((p.y - vBase) / max(0.001, vTop - vBase), 0.0, 1.0);
    idx = floor(normH * (uCols - 1.0));
    ink = ramp3(normH);
    alpha = 0.95;
  } else if (bubbles > 0.15) {
    // Buoyant rising 3D bubble streams: Row 5
    setF = 5.0;
    idx = floor(clamp(bubbles * 1.4, 0.0, 0.95) * (uCols - 1.0));
    ink = mix(vec3(0.55, 0.42, 0.05), vec3(1.0, 0.85, 0.30), bubbles);
    alpha = clamp(bubbles * 0.92, 0.0, 0.95);
  } else if (aur > 0.02) {
    // Shimmering aurora above visualizer
    setF = 2.0;
    idx = floor(clamp(aur * 1.5, 0.0, 1.0) * (uCols - 1.0));
    ink = ramp3(clamp(bval * 0.9, 0.0, 1.0));
    alpha = aur * 0.75;
  } else if (critHalo > 0.02) {
    // Ambient bioluminescent halo around swimming creatures
    setF = 2.0;
    idx = floor(clamp(critHalo * 2.0, 0.0, 0.6) * uCols);
    ink = vec3(0.10, 0.35, 0.15);
    alpha = critHalo * 0.40;
  } else {
    // Ambient ocean ASCII texture: gentle plankton, currents, and shimmering matrix runes
    float pHash = hash21(cell + 9.17);
    float waveN = snoise(vec2(p.x * 0.045 + t * 0.05, p.y * 0.035 - t * 0.025));
    float causticN = snoise(vec2(p.x * 0.09 - t * 0.06, p.y * 0.07 + t * 0.04));
    float ambientActivity = waveN * 0.5 + causticN * 0.5 + (1.0 - depthRatio) * 0.25 + torch * 1.1;

    if (pHash > 0.55 - torch * 0.38 && ambientActivity > 0.02) {
      setF = (pHash > 0.84) ? 3.0 : 2.0; // Mix of tech runes and caustic dots
      idx = floor(fract(pHash * 7.13) * uCols);
      float sparkle = smoothstep(0.55, 0.98, pHash);
      float depthFade = mix(0.60, 0.30, depthRatio);
      // Emerald currents, with rare gold + amethyst motes for colour variety
      vec3 amb = pHash > 0.94 ? vec3(0.66, 0.42, 0.05)
        : pHash > 0.88 ? vec3(0.50, 0.06, 0.50)
        : mix(vec3(0.10, 0.35, 0.15), vec3(0.20, 0.68, 0.30), pHash);
      ink = mix(amb, vec3(0.85, 0.62, 0.12), torch * 0.85);
      alpha = max(sparkle * depthFade * clamp(ambientActivity * 1.5, 0.25, 1.0), torch * 0.7);
    }
  }

  // Sample the glyph atlas texture
  vec2 gUv = vec2((idx + local.x) / uCols, (uRows - setF - 1.0 + local.y) / uRows);
  float cov = texture2D(uAtlas, gUv).r;

  // Composite glyph ink onto background
  col = mix(col, ink, cov * alpha);

  // Creature ambient self-illumination & specular bloom
  if (isCrit > 0.5) {
    col += ink * (critLum * 0.40);
  } else if (bubbles > 0.15) {
    col += ink * (bubbles * 0.15);
  } else if (critHalo > 0.01) {
    col += ink * (critHalo * 0.08);
  }

  // Visualizer glow
  if (viz > 0.5 || aur > 0.02) {
    col += ink * 0.12;
  }

  // Cursor torchlight: warm flickering glow + expanding ripple rings
  float flick = 0.90 + 0.10 * snoise(vec2(t * 2.4, 7.3));
  float ring = exp(-abs(mDist - mod(t * 13.0, 46.0)) * 0.30) * exp(-mDist * 0.05) * uMouseOn;
  float ring2 = exp(-abs(mDist - mod(t * 13.0 + 23.0, 46.0)) * 0.30) * exp(-mDist * 0.05) * uMouseOn;
  col += vec3(0.55, 0.36, 0.07) * torch * 0.85 * flick;
  col += vec3(0.34, 0.58, 0.10) * (ring + ring2) * 0.14;

  // Subtle cinematic corner vignette
  vec2 v = vUv - 0.5;
  col *= 1.0 - dot(v, v) * 0.34;

  gl_FragColor = vec4(col, 1.0);
}
`;