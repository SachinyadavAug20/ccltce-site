import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
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
  // particle state stored in both a JS array and GPU buffers
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
  pointGeo.setAttribute("age", new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT), 1)); // <-- added
  const pointMat = new THREE.ShaderMaterial({
    uniforms: { uPalette: uni.uPalette, uMouse: uni.uMouse, uRes: uni.uRes },
    vertexShader: `
      attribute float maxAge;
      attribute float age;
      varying float vAge;
      void main(){
        vAge = 1.0 - age / maxAge;
        gl_Position = vec4(position, 1.0);
        gl_PointSize = max(2.0, 10.0 * vAge);
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
    // inject a burst of particles at the cursor
    for (let i = 0; i < 5; i++) {
      const idx = particles.length % PARTICLE_COUNT;
      particles[idx].x = mouse.x;
      particles[idx].y = mouse.y;
      particles[idx].vx = (Math.random() - 0.5) * 0.3;
      particles[idx].vy = (Math.random() - 0.5) * 0.3;
      particles[idx].age = 0;
    }
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
    // update particles
    const dt = Math.min(clock.getDelta(), 0.1);
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
      // steer toward mouse
      p.vx += (mouse.x - p.x) * 0.02 * dt;
      p.vy += (mouse.y - p.y) * 0.02 * dt;
      p.vx *= 0.98; p.vy *= 0.98;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // upload position and age to GPU
      pPositions.set([p.x, p.y, 1], i * 3);
      pAges[i] = p.age;
    }
    pointGeo.attributes.position.needsUpdate = true;
    pointGeo.attributes.age.needsUpdate = true; // newly added attribute
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