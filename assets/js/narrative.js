// Narrative scroll — pin+scrub native scroll, smoothed cinematic camera + overlays + skybox + lights + music phase.
import * as THREE from "../vendor/three.module.js";
import { buildScene } from "./narrative-scene.js";
import { createCameraPath, phaseAt, dimAt } from "./narrative-camera.js";
import { initDragon } from "./narrative-dragon.js";
import { createLighting } from "./narrative-light.js";

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
  var viewport = wrapper.querySelector(".narrative-viewport");
  var dragon = initDragon(scene, camera, viewport);
  window.CCLTCE_DRAGON = dragon;
  var hint = wrapper.querySelector(".narrative-hint");
  var lookV = new THREE.Vector3(), lookA = new THREE.Vector3(), tg1 = new THREE.Vector3(), tg2 = new THREE.Vector3();
  var light = createLighting(scene, L);
  var progress = { t: 0, s: 0, dim: "overworld" };
  var overlays = {
    surface: wrapper.querySelector(".narrative-overlay.surface"),
    station1: wrapper.querySelector(".narrative-overlay.station-1"),
    station2: wrapper.querySelector(".narrative-overlay.station-2"),
    station3: wrapper.querySelector(".narrative-overlay.station-3"),
    bedrock: wrapper.querySelector(".narrative-overlay.bedrock"),
  };
  var heroOverlay = document.querySelector(".hero-overlay");
  var lastDim = "";
  function clamp01(v) { return Math.min(1, Math.max(0, v)); }
  function updateOverlays(t) {
    var phase = phaseAt(t);
    for (var key in overlays) { var el = overlays[key]; if (el) el.classList.toggle("on", key === phase); }
    if (heroOverlay) {
      var hf = clamp01(t / 0.12);
      heroOverlay.style.opacity = 1 - hf;
      heroOverlay.style.transform = "translateY(" + (-60 * hf) + "px)";
    }
    if (hint) hint.style.opacity = t > 0.06 ? "0" : "1";
  }
  // lean into the turn: heading delta between two points on the spline
  function bank(u) {
    curve.getTangentAt(u, tg1); curve.getTangentAt(Math.min(u + 0.02, 1), tg2);
    var d = Math.atan2(tg2.x, tg2.z) - Math.atan2(tg1.x, tg1.z);
    if (d > Math.PI) d -= Math.PI * 2; else if (d < -Math.PI) d += Math.PI * 2;
    return Math.max(-0.09, Math.min(0.09, d * 2.5));
  }
  var clock = new THREE.Clock(), lastEl = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden) return;
    var el = clock.getElapsedTime(), dt = Math.min(0.1, Math.max(0.001, el - lastEl));
    lastEl = el;
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
    });
    // damped scroll follow — the frame loop owns the camera so nothing drifts off-screen
    progress.s += (progress.t - progress.s) * (1 - Math.pow(0.0004, dt));
    if (Math.abs(progress.t - progress.s) < 0.0002) progress.s = progress.t;
    var u = Math.min(Math.max(progress.s, 0), 1);
    camera.position.copy(curve.getPointAt(u));
    var fov = 45 + Math.min(7, Math.abs(progress.t - progress.s) * 90);   // speed = wider lens
    if (Math.abs(camera.fov - fov) > 0.02) { camera.fov = fov; camera.updateProjectionMatrix(); }
    var look = lookA.copy(curve.getPointAt(Math.min(u + 0.04, 1))), shake = 0;
    if (dragon) {
      dragon.update(el);
      var w = u > 0.84 ? clamp01((u - 0.84) / 0.08) : 0;   // finale — keep the boss framed
      if (w > 0) look.lerp(dragon.look(lookV), w);
      shake = dragon.shake();
    }
    camera.lookAt(look);
    camera.rotateZ(bank(u));
    if (shake > 0) {
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
      camera.rotateZ((Math.random() - 0.5) * shake * 0.12);
    }
    light.tick(progress.dim, camera);
    renderer.render(scene, camera);
  }
  function onScroll() {
    var rect = wrapper.getBoundingClientRect();
    progress.t = clamp01(-rect.top / (wrapper.offsetHeight - innerHeight));
    updateOverlays(progress.t);
    var dim = dimAt(progress.t);
    if (dim !== lastDim) {
      lastDim = dim; progress.dim = dim; light.sky(dim); light.lights(dim);
      if (dragon) dragon.armed = dim === "end";
      window.CCLTCE_DIM = dim;
      document.documentElement.setAttribute("data-dim", dim);
      if (window.CCLTCE_SFX && window.CCLTCE_SFX.setPhase) window.CCLTCE_SFX.setPhase(dim);
    }
  }
  addEventListener("scroll", onScroll, { passive: true });
  viewport.addEventListener("pointermove", function (e) { if (dragon) dragon.hover(e); }, { passive: true });
  viewport.addEventListener("click", function (e) { if (dragon) dragon.click(e); });
  addEventListener("resize", function () {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
  });
  light.sky("overworld"); light.lights("overworld");
  updateOverlays(0);
  animate(); onScroll();
})();
