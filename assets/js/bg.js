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

  // ---- Smoke particle system ----
  const PARTICLE_COUNT = reduced ? 5 : 30;
  const particles = [];
  const pPositions = new Float32Array(PARTICLE_COUNT * 3);
  const pVelocities = new Float32Array(PARTICLE_COUNT * 2);
  const pAges = new Float32Array(PARTICLE_COUNT);
  const pMaxLifetimes = new Float32Array(PARTICLE_COUNT).fill(100);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({ age: 0, vx: 0, vy: 0 });
    pPositions.set([0, 0, 1], i * 3);
    pVelocities.set([0, 0], i * 2);
    pAges[i] = 0;
  }
  const pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
  pointGeo.setAttribute("maxAge", new THREE.BufferAttribute(pMaxLifetimes, 1));
  const pointMat = new THREE.ShaderMaterial({
    uniforms: { uPalette: uni.uPalette, uMouse: uni.uMouse, uRes: uni.uRes },
    vertexShader: `
      attribute float maxAge;
      varying float vAge;
      void main(){
        vAge = 1.0 - age / maxAge;
        gl_Position = vec4(position, 1.0);
        gl_PointSize = max(2.0, 10.0 * (1.0 - vAge));
      }
    `,
    fragmentShader: `
      uniform float uPalette;
      uniform vec2 uMouse;
      uniform vec2 uRes;
      varying float vAge;
      void main(){
        vec2 uv = gl_PointCoord;
        float d = length(uv - 0.5);
        if (d > 0.5) { discard; }
        vec3 col;
        if (uPalette == 0.0) col = mix(vec3(0.01,0.02,0.03), vec3(0.20,0.45,0.40), smoothstep(0.0, 0.5, 1.0 - d));
        else if (uPalette == 1.0) col = mix(vec3(0.30,0.02,0.05), vec3(0.80,0.40,0.20), smoothstep(0.0, 0.5, 1.0 - d));
        else if (uPalette == 2.0) col = mix(vec3(0.10,0.08,0.02), vec3(0.50,0.40,0.20), smoothstep(0.0, 0.5, 1.0 - d));
        else col = mix(vec3(0.02,0.05,0.07), vec3(0.10,0.65,0.70), smoothstep(0.0, 0.5, 1.0 - d));
        gl_FragColor = vec4(col, vAge * (1.0 - d * 2.0));
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  pointMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.fragmentShader = shader.fragmentShader.replace("varying float vAge;", "varying float vAge; uniform float uTime;");
    shader.fragmentShader = shader.fragmentShader.replace("gl_FragColor = vec4(col, vAge * (1.0 - d * 2.0));", "gl_FragColor = vec4(col, vAge * (1.0 - d * 2.0) * smoothstep(0.0, 1.0, uTime * 0.01));");
  };
  scene.add(new THREE.Points(pointGeo, pointMat));

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
    // inject a burst of particles
    for (let i = 0; i < 5; i++) {
      const idx = particles.length % PARTICLE_COUNT;
      particles[idx].x = mouse.x;
      particles[idx].y = mouse.y;
      particles[idx].vx = (Math.random() - 0.5) * 0.3;
      particles[idx].vy = (Math.random() - 0.5) * 0.3;
      particles[idx].age = 0;
    }
  });

  let alive = true;
  try {
    uni.uTime.value = 1;
    renderer.render(scene, cam);
    alive = true;
  } catch { /* fallback below */ }

  if (!alive) {
    const FRAG_SAFE = `
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){ float v=0.0,a=0.5; for (int i=0;i<5;i++){ v+=a*noise(p); p=p*2.03+vec2(17.0,9.0); a*=0.55; } return v; }
float ign(vec2 p){ return fract(52.9829189*fract(dot(p,vec2(0.06711056,0.00583715)))); void main(){ vec2 uv=gl_FragCoord.xy/uRes; float aspect=uRes.x/uRes.y; float t=uTime*0.03; vec2 cell=floor(gl_FragCoord.xy/3.0); vec2 md=(uv-uMouse)*vec2(aspect,1.0); float n=fbm(p*2.2+md*0.25); float v=clamp(floor(n*6.0+(ign(cell)-0.5)*0.7)/6.0,0.0,1.0); vec3 col=mix(vec3(0.006,0.012,0.016),vec3(0.020,0.055,0.060),smoothstep(0.10,0.34,v)); col=mix(col,vec3(0.065,0.230,0.205),smoothstep(0.38,0.60,v)); col=mix(col,vec3(0.105,0.360,0.320),smoothstep(0.64,0.84,v)); col=mix(col,vec3(0.190,0.560,0.490),smoothstep(0.90,0.99,v)); col*=1.0-0.45*smoothstep(0.50,1.02,length(uv-0.5)); gl_FragColor=vec4(col,1.0); }`;
    mat.fragmentShader = FRAG_SAFE;
    mat.needsUpdate = true;
  }

  const clock = new THREE.Clock();
  const tick = () => {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    uni.uTime.value += Math.min(clock.getDelta(), 0.1);
    uni.uMouse.value.lerp(mouse, 0.05);
    uni.uVel.value.multiplyScalar(0.9);
    // update particles
    const dt = Math.min(clock.getDelta(), 0.1);
    let active = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      p.age += dt;
      if (p.age > pMaxLifetimes[i]) {
        // respawn near mouse
        p.x = mouse.x + (Math.random() - 0.5) * 0.5;
        p.y = mouse.y + (Math.random() - 0.5) * 0.5;
        p.vx = (Math.random() - 0.5) * 0.1;
        p.vy = (Math.random() - 0.5) * 0.1;
        p.age = 0;
      }
      p.vx += (mouse.x - p.x) * 0.02 * dt;
      p.vy += (mouse.y - p.y) * 0.02 * dt;
      p.vx *= 0.98; p.vy *= 0.98;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // upload position
      pPositions.set([p.x, p.y, 1], i * 3);
      pAges[i] = p.age;
      active++;
    }
    pointGeo.attributes.position.needsUpdate = true;
    pointGeo.attributes.age.needsUpdate = true; // custom attribute, but we use maxAge for fade; we'll just update a custom varying via onBeforeCompile already handled
    // palette GSAP cycle
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