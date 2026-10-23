import * as THREE from "../vendor/three.module.js";
import { ASCII_VERT, ASCII_FRAG } from "./glsl/ascii.js";
import { buildGlyphAtlas, GLYPH_COLS, GLYPH_ROWS } from "./glyphs.js";
import { initAudio, AUDIO_BINS } from "./audio.js";

// One WebGL pass: a calm ASCII ocean with fish / shark / whale drawn as ASCII art.
(async function () {
  const cv = document.getElementById("bg");
  if (!cv) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas: cv,
    antialias: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.PlaneGeometry(2, 2);

  const uni = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uCellW: { value: 9 },
    uCellH: { value: 14 },
    uCols: { value: GLYPH_COLS },
    uRows: { value: GLYPH_ROWS },
    uSceneH: { value: 60 },
    uSceneW: { value: 100 },
    uAtlas: { value: null },
    uSkyCol: { value: new THREE.Color(0.052, 0.030, 0.022) },
    uMidCol: { value: new THREE.Color(0.015, 0.075, 0.055) },
    uDeepCol: { value: new THREE.Color(0.008, 0.035, 0.028) },
    uInk: { value: new THREE.Color(0.30, 0.95, 0.68) },
    uHot: { value: new THREE.Color(1.0, 0.78, 0.32) },
    uSpec: { value: new Float32Array(AUDIO_BINS) },
  };

  const scene = new THREE.Scene();
  scene.add(
    new THREE.Mesh(
      quad,
      new THREE.ShaderMaterial({
        vertexShader: ASCII_VERT,
        fragmentShader: ASCII_FRAG,
        uniforms: uni,
        depthTest: false,
        depthWrite: false,
      })
    )
  );

  const tex = new THREE.CanvasTexture(document.createElement("canvas"));
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.NoColorSpace;
  uni.uAtlas.value = tex;
  window.CCLTCE_BG = { renderer, scene, cam, uni };

  let cellW = 0;
  let cellH = 0;

  const fit = async () => {
    renderer.setSize(innerWidth, innerHeight, false);
    const d = renderer.getDrawingBufferSize(new THREE.Vector2());
    uni.uRes.value.copy(d);
    // Fine high-density micro-ASCII character grid (small text characters)
    const dpr = Math.min(renderer.getPixelRatio(), 1.25);
    const targetCellH = 7.5;
    uni.uCellH.value = Math.max(6, Math.round(targetCellH * dpr));
    uni.uCellW.value = Math.max(4, Math.round(uni.uCellH.value * 0.54));
    uni.uSceneH.value = d.y / uni.uCellH.value;
    uni.uSceneW.value = d.x / uni.uCellH.value;
    if (uni.uCellW.value !== cellW || uni.uCellH.value !== cellH) {
      cellW = uni.uCellW.value;
      cellH = uni.uCellH.value;
      tex.image = await buildGlyphAtlas(cellW, cellH);
      tex.needsUpdate = true;
    }
  };

  await fit();
  let timer = 0;
  addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(fit, 180);
  });

  const audio = initAudio();
  const spec = uni.uSpec.value;

  const draw = (t) => {
    uni.uTime.value = t;
    audio.bars(spec);
    renderer.render(scene, cam);
  };

  if (reduced) {
    draw(24);
  } else {
    const clock = new THREE.Clock();
    const tick = () => {
      requestAnimationFrame(tick);
      if (document.hidden) return;
      draw(clock.getElapsedTime());
    };
    tick();
  }
})().catch((err) => console.error("[bg]", err));
