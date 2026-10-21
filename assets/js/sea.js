import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { buildTextures } from "./sprites.js";
import { buildLife } from "./sea-life.js";

let gsap = null;
try { ({ gsap } = await import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.module.js")); } catch {}

const cv = document.getElementById("sea");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

if (cv) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(innerWidth, innerHeight, false);
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(0, innerWidth, 0, -innerHeight, 1, 200);
  cam.position.z = 100;

  const m = { x: innerWidth / 2, y: innerHeight * 0.55, vx: 0, vy: 0 };
  const life = buildLife(THREE, scene, buildTextures(THREE), m, gsap);

  const fit = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    cam.left = 0; cam.right = innerWidth; cam.top = 0; cam.bottom = -innerHeight;
    cam.updateProjectionMatrix();
  };
  addEventListener("resize", fit);
  fit();

  addEventListener("pointermove", (e) => {
    m.vx += (e.clientX - m.x) * 0.5;
    m.vy += (e.clientY - m.y) * 0.5;
    m.x = e.clientX; m.y = e.clientY;
    m.vx *= 0.5; m.vy *= 0.5;
  });

  addEventListener("pointerdown", (e) => {
    m.x = e.clientX; m.y = e.clientY;
    life.toss(e.clientX, e.clientY);
  });

  const tick = (dt, t) => {
    life.update(dt, t);
    renderer.render(scene, cam);
  };

  if (reduced) {
    tick(0.016, 2);
  } else if (gsap) {
    gsap.ticker.add((time, dtMs) => tick(Math.min(dtMs / 1000, 0.05), time));
  } else {
    let last = performance.now();
    const gap = (now) => {
      requestAnimationFrame(gap);
      tick(clamp(now - last, 0, 50) / 1000, now / 1000);
      last = now;
    };
    requestAnimationFrame(gap);
  }
}
