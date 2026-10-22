import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { FRAG, VERT } from "./ocean.frag.js";

let gsap = null;
try { ({ gsap } = await import("https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.module.js")); } catch {}

const cv = document.getElementById("bg");

if (cv) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, powerPreference: "low-power" });
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uni = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uVel: { value: new THREE.Vector2(0, 0) },
    uPalette: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: uni });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  // ---- Three.js overlay cubes ----
  const cubes = [];
  const paletteColors = [
    new THREE.Color(0x0a1a1e),
    new THREE.Color(0x3d0f17),
    new THREE.Color(0x212a0d),
    new THREE.Color(0x0d1b2a)
  ];
  for (let i = 0; i < 4; i++) {
    const geo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const cubeMat = new THREE.MeshBasicMaterial({ color: paletteColors[i], transparent: true, opacity: 0.8 });
    const cube = new THREE.Mesh(geo, cubeMat);
    cube.userData.baseZ = -10 - i * 3;
    cube.position.z = cube.userData.baseZ;
    cube.userData.orbit = i % 2 === 0 ? -0.3 : 0.3;
    cube.userData.speed = i % 2 === 0 ? 0.8 : -0.8;
    scene.add(cube);
    cubes.push(cube);
  }

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
    cubes.forEach((c, idx) => {
      const factor = reduced ? 0 : (idx % 2 === 0 ? 1 : -1);
      c.userData.orbit = factor * (Math.abs(nx - 0.5) * 0.5 + Math.abs(ny - 0.5) * 0.5);
    });
  });

  // initial render test
  let alive = true;
  uni.uTime.value = 1;
  renderer.render(scene, cam);

  const clock = new THREE.Clock();
  const tick = () => {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    uni.uTime.value += Math.min(clock.getDelta(), 0.1);
    uni.uMouse.value.lerp(mouse, 0.05);
    uni.uVel.value.multiplyScalar(0.9);
    if (gsap) {
      cubes.forEach((c, i) => {
        const targetRot = (uni.uTime.value + i) * (c.userData.speed || 1);
        gsap.to(c.rotation, { y: targetRot, duration: 2, ease: "power2.inOut" });
        const ox = mouse.x - 0.5, oy = mouse.y - 0.5;
        const orbitAmt = c.userData.orbit || 0;
        c.position.x = ox * orbitAmt * 1.5;
        c.position.y = oy * orbitAmt * 1.5;
      });
    } else {
      cubes.forEach((c, i) => {
        c.rotation.y += (uni.uTime.value + i) * (c.userData.speed || 1) * 0.016;
        const ox = mouse.x - 0.5, oy = mouse.y - 0.5;
        c.position.x = ox * (c.userData.orbit || 0) * 1.5;
        c.position.y = oy * (c.userData.orbit || 0) * 1.5;
      });
    }
    if (gsap) {
      gsap.to({p: uni.uPalette.value}, { duration: 6, p: (uni.uPalette.value + 1) % 4, onUpdate: () => { uni.uPalette.value = Math.round(p); }, repeat: -1, ease: "power2.inOut" });
    }
    renderer.render(scene, cam);
  };

  if (reduced) {
    uni.uTime.value = 30;
    renderer.render(scene, cam);
  } else {
    tick();
  }
}