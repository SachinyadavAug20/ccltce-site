import * as THREE from "../vendor/three.module.js";
import { ASCII_VERT, ASCII_FRAG } from "./glsl/ascii.js";
import { buildGlyphAtlas, GLYPH_COLS, GLYPH_ROWS } from "./glyphs.js";
import { initAudio, AUDIO_BINS } from "./audio.js";

// One WebGL pass: ASCII art ocean with music visualiser — Minecraft palette.
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
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uMouseOn: { value: 0 },
    uCellW: { value: 9 },
    uCellH: { value: 14 },
    uCols: { value: GLYPH_COLS },
    uRows: { value: GLYPH_ROWS },
    uSceneH: { value: 60 },
    uSceneW: { value: 100 },
    uAtlas: { value: null },
    uSkyCol: { value: new THREE.Color(0.078, 0.078, 0.078) },
    uMidCol: { value: new THREE.Color(0.055, 0.078, 0.045) },
    uDeepCol: { value: new THREE.Color(0.045, 0.045, 0.045) },
    uInk: { value: new THREE.Color(0.30, 0.85, 0.38) },
    uHot: { value: new THREE.Color(1.0, 0.67, 0.0) },
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

  // Pointer torch: smoothed cursor target in UV space (y-up), ramped on first move.
  const mTarget = { x: 0.5, y: 0.5 };
  const draw = (t) => {
    uni.uTime.value = t;
    const m = uni.uMouse.value;
    m.x += (mTarget.x - m.x) * 0.12;
    m.y += (mTarget.y - m.y) * 0.12;
    audio.bars(spec);
    renderer.render(scene, cam);
  };

  addEventListener("pointermove", (e) => {
    mTarget.x = e.clientX / innerWidth;
    mTarget.y = 1 - e.clientY / innerHeight;
    uni.uMouseOn.value = Math.min(1, uni.uMouseOn.value + 0.25);
    if (reduced) {
      uni.uMouse.value.set(mTarget.x, mTarget.y);
      draw(24); // static scene still responds to the cursor
    }
  }, { passive: true });

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
