import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { FRAG, VERT } from "./ocean.frag.js";

const cv = document.getElementById("bg");

const FRAG_SAFE = `
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.55; }
  return v;
}
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float t = uTime * 0.03;
  vec2 cell = floor(gl_FragCoord.xy / 3.0);
  vec2 cellUv = (cell + 0.5) * 3.0 / uRes;
  vec2 md = (uv - uMouse) * vec2(aspect, 1.0);
  vec2 flow = vec2(t * 0.35, -t * 0.12) + uMouse * 0.18;
  vec2 p = cellUv * vec2(aspect, 1.0) * 2.4;
  vec2 warp = vec2(fbm(p * 1.4 + flow), fbm(p * 1.4 - flow + 3.7));
  float n = fbm(p * 2.0 + warp * 1.8 + flow * 0.5);
  n = n * n * (3.0 - 2.0 * n);
  float v = clamp(floor(n * 7.0 + (ign(cell) - 0.5) * 0.8) / 7.0, 0.0, 1.0);
  vec3 col = mix(vec3(0.010, 0.018, 0.022), vec3(0.055, 0.110, 0.115), smoothstep(0.00, 0.38, v));
  col = mix(col, vec3(0.270, 0.360, 0.350), smoothstep(0.38, 0.72, v));
  col = mix(col, vec3(0.520, 0.640, 0.620), smoothstep(0.80, 0.97, v));
  col *= 1.0 - 0.30 * smoothstep(0.55, 1.02, length(uv - 0.5));
  gl_FragColor = vec4(col, 1.0);
}`;

if (cv) {
  try {
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

    const mouse = new THREE.Vector2(0.5, 0.5);
    addEventListener("pointermove", (e) => {
      const nx = e.clientX / innerWidth, ny = 1 - e.clientY / innerHeight;
      const v = uni.uVel.value;
      v.x = Math.max(-0.3, Math.min(0.3, v.x + (nx - mouse.x) * 1.6));
      v.y = Math.max(-0.3, Math.min(0.3, v.y + (ny - mouse.y) * 1.6));
      mouse.set(nx, ny);
    });
    addEventListener("resize", fit);
    fit();

    let alive = false;
    try {
      uni.uTime.value = 1;
      renderer.render(scene, cam);
      alive = true;
    } catch { /* creature shader rejected below */ }

    if (!alive) {
      material.fragmentShader = FRAG_SAFE;
      material.needsUpdate = true;
    }

    const clock = new THREE.Clock();
    const tick = () => {
      requestAnimationFrame(tick);
      if (document.hidden) return;
      uni.uTime.value += Math.min(clock.getDelta(), 0.1);
      uni.uMouse.value.lerp(mouse, 0.05);
      uni.uVel.value.multiplyScalar(0.9);
      renderer.render(scene, cam);
    };

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      uni.uTime.value = 30;
      renderer.render(scene, cam);
    } else {
      tick();
    }
  } catch { /* dark fallback */ }
}
