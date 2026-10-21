import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const cv = document.getElementById("bg");

if (cv) {
  const VERT = `void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`;

  const FRAG = `
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform vec2 uVel;
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
  float sdEll(vec2 p, vec2 r){ float k = length(p / r); return (k - 1.0) * min(r.x, r.y); }
  float whale(vec2 p, float t){
    float s = sin(t * 1.4);
    float body = sdEll(p, vec2(0.58, 0.20));
    float stem = sdEll(p - vec2(0.55, 0.10 * s), vec2(0.14, 0.045));
    vec2 q = mat2(1.0, -s, s, 1.0) * (p - vec2(0.66, 0.10 * s));
    float flukes = min(sdEll(q - vec2(0.10, 0.10), vec2(0.16, 0.055)), sdEll(q - vec2(0.10, -0.10), vec2(0.16, 0.055)));
    return min(body, min(stem, flukes));
  }
  float fish(vec2 p, float t, float ph){
    float body = sdEll(p, vec2(0.085, 0.036));
    vec2 q = p - vec2(0.10, sin(t * 7.0 + ph) * 0.05);
    return min(body, sdEll(q, vec2(0.05, 0.028)));
  }
  void main(){
    vec2 uv = gl_FragCoord.xy / uRes;
    float aspect = uRes.x / uRes.y;
    float t = uTime * 0.045;

    vec2 cell = floor(gl_FragCoord.xy / 3.0);
    vec2 cellUv = (cell + 0.5) * 3.0 / uRes;
    vec2 dim = cellUv * vec2(aspect, 1.0);

    vec2 md = (uv - uMouse) * vec2(aspect, 1.0);
    float mDist = length(md);
    float wake = exp(-3.5 * mDist) * length(uVel);
    vec2 swirl = vec2(-md.y, md.x) * exp(-3.5 * mDist) * 10.0 * uVel;

    vec2 p = dim * (2.2 + 0.12 * sin(t * 0.7)) + swirl;
    vec2 warp = vec2(fbm(p * 1.6 + t), fbm(p * 1.6 - t + 4.0));
    float n = smoothstep(0.12, 0.9, fbm(p * 2.2 + warp * 1.6 + uMouse * 0.25));
    float glow = exp(-5.0 * mDist) * (0.20 + 0.06 * sin(uTime * 1.7));
    float rip = sin(26.0 * mDist - uTime * 4.0);
    float v = clamp(n + glow + wake * (0.08 + 0.1 * rip), 0.0, 1.0);
    v = clamp(floor(v * 6.0 + (ign(cell) - 0.5) * 0.9) / 6.0, 0.0, 1.0);

    vec3 col = mix(vec3(0.006, 0.012, 0.016), vec3(0.020, 0.055, 0.060), smoothstep(0.10, 0.34, v));
    col = mix(col, vec3(0.065, 0.230, 0.205), smoothstep(0.38, 0.60, v));
    col = mix(col, vec3(0.130, 0.450, 0.400), smoothstep(0.64, 0.84, v));
    col = mix(col, vec3(0.240, 0.680, 0.600), smoothstep(0.90, 0.99, v));
    col += step(0.992, ign(cell + floor(uTime * 2.0) * 11.0)) * v * vec3(0.30, 0.50, 0.45);

    for (int i = 0; i < 4; i++){
      float fi = float(i);
      float span = aspect + 1.2;
      float fx = mod(t * (0.9 + 0.12 * fi) + fi * 2.4, span) - span * 0.5;
      float fy = -0.44 + 0.26 * fi + 0.05 * sin(uTime * 0.5 + fi * 1.7);
      vec2 fp = (vec2(fx, fy) - dim) / (0.55 + 0.15 * fi);
      float df = fish(fp, uTime, fi * 2.0);
      col = mix(col, vec3(0.02, 0.06, 0.06), smoothstep(1.6, 0.9, abs(df)) * 0.8);
      col = mix(col, vec3(0.14, 0.42, 0.37) * (0.8 + 0.2 * ign(cell)), smoothstep(0.5, 0.1, df) * 0.9);
    }

    vec2 wPos = uMouse * vec2(aspect, 1.0) * 0.5 + vec2(-0.15, 0.05) + vec2(0.12 * sin(uTime * 0.16), 0.08 * sin(uTime * 0.23));
    float dw = whale((wPos - dim) / 0.9, uTime);
    col = mix(col, vec3(0.018, 0.05, 0.05), smoothstep(1.8, 1.0, abs(dw)) * 0.85);
    col = mix(col, vec3(0.10, 0.33, 0.29) * (0.85 + 0.15 * ign(cell + 7.0)), smoothstep(0.5, 0.05, dw) * 0.92);

    col *= 1.0 - 0.55 * smoothstep(0.45, 1.02, length(uv - 0.5));
    col *= 0.96 + 0.04 * sin(gl_FragCoord.y * 3.14159);
    gl_FragColor = vec4(col, 1.0);
  }`;

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
    scene.add(
      new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: uni })
      )
    );

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
