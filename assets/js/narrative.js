// Narrative scroll — pin+scrub via native scroll listener, drives camera + overlays.
import * as THREE from "../vendor/three.module.js";
import { buildScene } from "./narrative-scene.js";
import { createCameraPath, updateCamera, phaseAt } from "./narrative-camera.js";

(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;

  var camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 400);
  var built = buildScene();
  var scene = built.scene;
  var curve = createCameraPath();
  var stations = built.stations;

  var progress = { t: 0 };
  var overlays = {
    surface: wrapper.querySelector(".narrative-overlay.surface"),
    station1: wrapper.querySelector(".narrative-overlay.station-1"),
    station2: wrapper.querySelector(".narrative-overlay.station-2"),
    station3: wrapper.querySelector(".narrative-overlay.station-3"),
    bedrock: wrapper.querySelector(".narrative-overlay.bedrock"),
  };
  var heroOverlay = document.querySelector(".hero-overlay");

  function clamp01(v) { return Math.min(1, Math.max(0, v)); }

  function updateOverlays(t) {
    var phase = phaseAt(t);
    for (var key in overlays) {
      var el = overlays[key];
      if (!el) continue;
      el.classList.toggle("on", key === phase);
    }
    if (heroOverlay) {
      var hf = clamp01(t / 0.12);
      heroOverlay.style.opacity = 1 - hf;
      heroOverlay.style.transform = "translateY(" + (-60 * hf) + "px)";
    }
  }

  // animate stations gently
  var clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden) return;
    var el = clock.getElapsedTime();
    if (stations.s1) stations.s1.rotation.y = Math.sin(el * 0.3) * 0.1;
    if (stations.s2) stations.s2.rotation.y = el * 0.15;
    if (stations.s3) stations.s3.rotation.y = el * 0.2;
    // spin sparks
    if (stations.s3) {
      stations.s3.children.forEach(function (c) {
        if (c.userData.spin !== undefined) {
          var a = el + c.userData.spin;
          c.position.x = Math.cos(a) * 5;
          c.position.z = Math.sin(a) * 5;
        }
      });
    }
    renderer.render(scene, camera);
  }

  function onScroll() {
    var rect = wrapper.getBoundingClientRect();
    var total = wrapper.offsetHeight - innerHeight;
    var scrolled = -rect.top;
    progress.t = clamp01(scrolled / total);
    updateCamera(camera, curve, progress.t);
    updateOverlays(progress.t);
  }

  function onResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
  }

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onResize);

  // initial
  updateCamera(camera, curve, 0);
  updateOverlays(0);
  animate();
  onScroll();
})();
