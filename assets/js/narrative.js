// Narrative scroll — pin+scrub native scroll, camera + overlays + skybox + day/night lights + music phase.
import * as THREE from "../vendor/three.module.js";
import { buildScene } from "./narrative-scene.js";
import { createCameraPath, updateCamera, phaseAt, dimAt } from "./narrative-camera.js";

var TOD = {
  night:   { sky: 0x0a0e1a, fog: 0x0a0e1a, d: 0.0035, sun: 0x8899cc, sunI: 0.35, amb: 0x253044, ambI: 0.42, hemiS: 0x334466, hemiG: 0x111122, pos: [-40, 50, 20] },
  dawn:    { sky: 0xee9966, fog: 0xcc8866, d: 0.003,  sun: 0xffaa66, sunI: 0.75, amb: 0x556688, ambI: 0.5,  hemiS: 0x7788aa, hemiG: 0x334422, pos: [-80, 20, 10] },
  morning: { sky: 0xaaccff, fog: 0xaaccff, d: 0.0026, sun: 0xffeecc, sunI: 0.9,  amb: 0x8899bb, ambI: 0.55, hemiS: 0xaaccff, hemiG: 0x554433, pos: [-50, 60, 20] },
  noon:    { sky: 0x78a7ff, fog: 0xbdd5ff, d: 0.0022, sun: 0xffffff, sunI: 1.05, amb: 0xaabbcc, ambI: 0.6,  hemiS: 0xbdd5ff, hemiG: 0x665544, pos: [0, 90, 30] },
  aftern:  { sky: 0x99bbff, fog: 0xaaccff, d: 0.0026, sun: 0xffeecc, sunI: 0.95, amb: 0x99aabb, ambI: 0.55, hemiS: 0xaaccff, hemiG: 0x554433, pos: [50, 60, 20] },
  sunset:  { sky: 0xff9966, fog: 0xcc8866, d: 0.0034, sun: 0xff8844, sunI: 0.8,  amb: 0x776688, ambI: 0.5,  hemiS: 0xaa88bb, hemiG: 0x443322, pos: [80, 25, 10] },
  dusk:    { sky: 0x554466, fog: 0x554466, d: 0.004,  sun: 0xcc6644, sunI: 0.5,  amb: 0x445577, ambI: 0.45, hemiS: 0x667799, hemiG: 0x222211, pos: [90, 10, 10] },
};
var DIM_L = { overworld: 1, nether: 0.22, end: 0.14, bedrock: 0.08 };
function getTOD() {
  var h = new Date().getHours() + new Date().getMinutes() / 60;
  if (h >= 5 && h < 6.5) return TOD.dawn;
  if (h >= 6.5 && h < 11) return TOD.morning;
  if (h >= 11 && h < 15) return TOD.noon;
  if (h >= 15 && h < 17.5) return TOD.aftern;
  if (h >= 17.5 && h < 19.5) return TOD.sunset;
  if (h >= 19.5 && h < 21) return TOD.dusk;
  return TOD.night;
}

(function () {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var wrapper = document.getElementById("narrative-scroll");
  if (!wrapper) return;
  var canvas = document.getElementById("narrative-webgl");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "narrative-webgl";
    canvas.setAttribute("aria-hidden", "true");
    wrapper.prepend(canvas);
  }
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight, false);
  var camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 500);
  var built = buildScene(), scene = built.scene, L = built.lights;
  var curve = createCameraPath(), stations = built.stations;
  var skyPresets = scene.userData.skyPresets || {};
  var progress = { t: 0, dim: "overworld" };
  var overlays = {
    surface: wrapper.querySelector(".narrative-overlay.surface"),
    station1: wrapper.querySelector(".narrative-overlay.station-1"),
    station2: wrapper.querySelector(".narrative-overlay.station-2"),
    station3: wrapper.querySelector(".narrative-overlay.station-3"),
    bedrock: wrapper.querySelector(".narrative-overlay.bedrock"),
  };
  var heroOverlay = document.querySelector(".hero-overlay");
  var skyTarget = { sky: new THREE.Color(0x78a7ff), fog: new THREE.Color(0xbdd5ff), d: 0.0026 };
  var lastDim = "", tod = getTOD(), lastHour = -1;
  function clamp01(v) { return Math.min(1, Math.max(0, v)); }
  function updateSky(dim) {
    var p = dim === "overworld" ? tod : skyPresets[dim];
    if (!p) return;
    skyTarget.sky.setHex(p.sky); skyTarget.fog.setHex(p.fog); skyTarget.d = p.d;
  }
  function updateLights() {
    var k = DIM_L[progress.dim] || 1;
    if (L.sun) { L.sun.color.setHex(tod.sun); L.sun.intensity = tod.sunI * k; L.sun.position.set(tod.pos[0], tod.pos[1], tod.pos[2]); }
    if (L.amb) { L.amb.color.setHex(tod.amb); L.amb.intensity = tod.ambI * (0.6 + 0.4 * k); }
    if (L.fill) { L.fill.color.setHex(tod.sun); L.fill.intensity = 0.3 * k; L.fill.position.set(-tod.pos[0] * 0.5, 25, -40); }
    if (L.hemi) { L.hemi.color.setHex(tod.hemiS); L.hemi.groundColor.setHex(tod.hemiG); L.hemi.intensity = 0.5 * (0.4 + 0.6 * k); }
  }
  function updateOverlays(t) {
    var phase = phaseAt(t);
    for (var key in overlays) { var el = overlays[key]; if (el) el.classList.toggle("on", key === phase); }
    if (heroOverlay) {
      var hf = clamp01(t / 0.12);
      heroOverlay.style.opacity = 1 - hf;
      heroOverlay.style.transform = "translateY(" + (-60 * hf) + "px)";
    }
  }
  var clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden) return;
    var el = clock.getElapsedTime();
    if (stations.s1) stations.s1.rotation.y = Math.sin(el * 0.3) * 0.12;
    if (stations.s2) stations.s2.rotation.y = el * 0.15;
    if (stations.s3) stations.s3.rotation.y = el * 0.2;
    scene.traverse(function (o) {
      var u = o.userData;
      if (u.float !== undefined) { o.position.y += Math.sin(el * 1.2 + u.float) * 0.004; o.rotation.y = Math.sin(el * 0.6 + u.float) * 0.3; }
      if (u.blink !== undefined) o.visible = Math.sin(el * 4 + u.blink * 1.7) > -0.3;
      if (u.pulse !== undefined) { var s = 1 + Math.sin(el * 2 + u.pulse) * 0.12; o.scale.set(s, s, s); }
      if (u.orbit !== undefined) {
        var a = el * u.speed + u.orbit, r = u.radius;
        o.position.x = Math.cos(a) * r; o.position.z = Math.sin(a) * r; o.position.y = 4 + Math.sin(el + u.orbit) * 2;
      }
      if (u.cart) { o.position.x = 40 + ((el * 6) % 160); o.position.y = 5.5 + Math.sin(el * 3) * 0.1; }
      if (u.cloud !== undefined) o.position.x = u.baseX + Math.sin(el * 0.02 + u.cloud) * 10;
      if (u.dragonOrbit) {
        var da = el * 0.15;
        o.position.x = 200 + Math.cos(da) * 35; o.position.z = 20 + Math.sin(da) * 35;
        o.position.y = -5 + Math.sin(el * 0.4) * 4; o.rotation.y = -da + Math.PI / 2;
      }
    });
    var hr = new Date().getHours();
    if (hr !== lastHour) { lastHour = hr; tod = getTOD(); updateSky(progress.dim); updateLights(); }
    if (scene.fog) {
      scene.fog.color.lerp(skyTarget.fog, 0.05);
      scene.fog.density += (skyTarget.d - scene.fog.density) * 0.05;
    }
    if (scene.background && scene.background.isColor) scene.background.lerp(skyTarget.sky, 0.05);
    renderer.render(scene, camera);
  }
  function onScroll() {
    var rect = wrapper.getBoundingClientRect();
    progress.t = clamp01(-rect.top / (wrapper.offsetHeight - innerHeight));
    updateCamera(camera, curve, progress.t);
    updateOverlays(progress.t);
    var dim = dimAt(progress.t);
    if (dim !== lastDim) {
      lastDim = dim; progress.dim = dim; updateSky(dim); updateLights();
      window.CCLTCE_DIM = dim;
      document.documentElement.setAttribute("data-dim", dim);
      if (window.CCLTCE_SFX && window.CCLTCE_SFX.setPhase) window.CCLTCE_SFX.setPhase(dim);
    }
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", function () {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
  });
  updateSky("overworld"); updateLights();
  updateCamera(camera, curve, 0);
  updateOverlays(0);
  animate(); onScroll();
})();
