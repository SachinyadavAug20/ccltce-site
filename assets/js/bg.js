import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { FRAG, VERT } from "./ocean.frag.js";

const cv = document.getElementById("bg");

if (cv) {
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, powerPreference: "low-power" });
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uni = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uVel: { value: new THREE.Vector2(0, 0) },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: uni });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  const fit = () => {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.getDrawingBufferSize(uni.uRes.value);
  };
  addEventListener("resize", fit);
  fit();

  const mouse = new THREE.Vector2(0.5, 0.5);
  addEventListener("pointermove", (e) => {
    const nx = e.clientX / innerWidth, ny = 1 - e.clientY / innerHeight;
    const v = uni.uVel.value;
    v.x = Math.max(-0.3, Math.min(0.3, v.x + (nx - mouse.x) * 1.6));
    v.y = Math.max(-0.3, Math.min(0.3, v.y + (ny - mouse.y) * 1.6));
    mouse.set(nx, ny);
  });

  // initial render test
  uni.uTime.value = 1;
  renderer.render(scene, cam);

  const clock = new THREE.Clock();
  const tick = () => {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    uni.uTime.value += Math.min(clock.getDelta(), 0.05);
    uni.uMouse.value.lerp(mouse, 0.1);
    uni.uVel.value.multiplyScalar(0.95);
    renderer.render(scene, cam);
  };

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    uni.uTime.value = 30;
    renderer.render(scene, cam);
  } else {
    tick();
  }
}