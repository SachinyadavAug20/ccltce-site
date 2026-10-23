import { NOISE_GLSL } from "./noise.js";
import { PALETTE_GLSL } from "./palette.js";
import { CREATURES_GLSL } from "./creatures.js";
import { VIZ_GLSL } from "./viz.js";
import { SWIM_GLSL } from "./swim.js";

// One fullscreen pass: an ASCII aquarium — 3D shaded fish in top 80%, music visualiser in bottom 20%.
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

const float VIZH = 0.18;   // music visualiser: bottom 18% of page

${NOISE_GLSL}
${PALETTE_GLSL}
${CREATURES_GLSL}
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
  float surf = 0.5 * uSceneH;                       // water surface at top of page
  float vFloor = -0.5 * uSceneH + VIZH * uSceneH;   // visualiser zone: bottom 18%
  float span = surf - vFloor;

  // ---------- 1. Serene deep ocean background gradient ----------
  float depthRatio = clamp((surf - p.y) / span, 0.0, 1.0);
  vec3 deepOcean = vec3(0.003, 0.012, 0.022);   // abyssal deep
  vec3 midOcean  = vec3(0.006, 0.038, 0.048);   // rich dark teal
  vec3 surfOcean = vec3(0.015, 0.065, 0.080);   // illuminated surface
  vec3 col = mix(surfOcean, midOcean, smoothstep(0.0, 0.45, depthRatio));
  col = mix(col, deepOcean, smoothstep(0.40, 1.0, depthRatio));

  // Subtle sunlight shafts & gentle water caustics
  float caustic1 = snoise(vec2(p.x * 0.06 + t * 0.10, p.y * 0.04 - t * 0.06)) * 0.5 + 0.5;
  float caustic2 = snoise(vec2(p.x * 0.12 - t * 0.08, p.y * 0.08 + t * 0.04)) * 0.5 + 0.5;
  float sunRay = exp(-abs(p.y - surf) * 0.09) * (caustic1 * 0.65 + caustic2 * 0.35);
  col += vec3(0.08, 0.28, 0.32) * (sunRay * 0.25);

  // ---------- 2. 3D Swimmers (Fish, Shark, Jellyfish) ----------
  vec3 critColor = vec3(0.0);
  vec4 critHit = evalMarineLife(p, t, critColor);
  float isCrit   = critHit.x;
  float critLum  = critHit.y;
  float critHalo = critHit.z;
  float isEye    = critHit.w;

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
    ink = mix(vec3(0.35, 0.88, 0.95), vec3(0.85, 0.98, 1.0), bubbles);
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
    ink = vec3(0.25, 0.85, 0.78);
    alpha = critHalo * 0.40;
  } else {
    // Ambient ocean ASCII texture: gentle plankton, currents, and shimmering matrix runes
    float pHash = hash21(cell + 9.17);
    float waveN = snoise(vec2(p.x * 0.045 + t * 0.05, p.y * 0.035 - t * 0.025));
    float causticN = snoise(vec2(p.x * 0.09 - t * 0.06, p.y * 0.07 + t * 0.04));
    float ambientActivity = waveN * 0.5 + causticN * 0.5 + (1.0 - depthRatio) * 0.25;

    if (pHash > 0.60 && ambientActivity > 0.02) {
      setF = (pHash > 0.84) ? 3.0 : 2.0; // Mix of tech runes and caustic dots
      idx = floor(fract(pHash * 7.13) * uCols);
      float sparkle = smoothstep(0.60, 0.98, pHash);
      float depthFade = mix(0.48, 0.22, depthRatio);
      ink = mix(vec3(0.12, 0.55, 0.62), vec3(0.28, 0.82, 0.92), pHash);
      alpha = sparkle * depthFade * clamp(ambientActivity * 1.5, 0.25, 1.0);
    }
  }

  // Sample the glyph atlas texture
  vec2 gUv = vec2((idx + local.x) / uCols, (uRows - setF - 1.0 + local.y) / uRows);
  float cov = texture2D(uAtlas, gUv).r;

  // Composite glyph ink onto background
  col = mix(col, ink, cov * alpha);

  // Creature ambient self-illumination & specular bloom
  if (isCrit > 0.5) {
    col += ink * (critLum * 0.24);
  } else if (bubbles > 0.15) {
    col += ink * (bubbles * 0.15);
  } else if (critHalo > 0.01) {
    col += ink * (critHalo * 0.08);
  }

  // Visualizer glow
  if (viz > 0.5 || aur > 0.02) {
    col += ink * 0.12;
  }

  // Subtle cinematic corner vignette
  vec2 v = vUv - 0.5;
  col *= 1.0 - dot(v, v) * 0.42;

  gl_FragColor = vec4(col, 1.0);
}
`;