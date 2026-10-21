import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const cv = document.getElementById("bg");
if (cv) {
  const VERT = `void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`;

  const FRAG = `
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
  void main(){
    vec2 uv = gl_FragCoord.xy / uRes;
    float aspect = uRes.x / uRes.y;
    vec2 p = uv * vec2(aspect, 1.0);
    float t = uTime * 0.045;
    vec2 warp = vec2(fbm(p * 1.6 + t), fbm(p * 1.6 - t + 4.0));
    float n = fbm(p * 2.2 + warp * 1.6 + uMouse * 0.25);
    float glow = exp(-5.0 * length((uv - uMouse) * vec2(aspect, 1.0))) * 0.22;
    float dither = hash(gl_FragCoord.xy) - 0.5;
    float v = clamp(n + glow + dither * 0.13, 0.0, 1.0);
    vec3 col = mix(vec3(0.008, 0.016, 0.020), vec3(0.030, 0.070, 0.075), smoothstep(0.16, 0.38, v));
    col = mix(col, vec3(0.080, 0.270, 0.245), smoothstep(0.42, 0.62, v));
    col = mix(col, vec3(0.180, 0.550, 0.500), smoothstep(0.66, 0.86, v));
    col = mix(col, vec3(0.350, 0.800, 0.720), smoothstep(0.90, 0.99, v));
    col *= 1.0 - 0.38 * smoothstep(0.55, 1.05, length(uv - 0.5));
    col *= 0.94 + 0.06 * sin(gl_FragCoord.y * 3.14159);
    gl_FragColor = vec4(col, 1.0);
  }`;

  function staticFallback() {
    const ctx = cv.getContext("2d");
    cv.width = innerWidth;
    cv.height = innerHeight;
    const PAL = ["#04070a", "#0b1416", "#13302d", "#1d4a44", "#2c6e60"];
    for (let y = 0; y < cv.height; y += 7) {
      for (let x = 0; x < cv.width; x += 7) {
        ctx.fillStyle = PAL[(Math.random() * PAL.length) | 0];
        ctx.fillRect(x, y, 7, 7);
      }
    }
  }

  try {
    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, powerPreference: "low-power" });
    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uni = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
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

    const target = new THREE.Vector2(0.5, 0.5);
    addEventListener("pointermove", (e) =>
      target.set(e.clientX / innerWidth, 1 - e.clientY / innerHeight)
    );
    addEventListener("resize", fit);
    fit();

    const clock = new THREE.Clock();
    const tick = () => {
      requestAnimationFrame(tick);
      if (document.hidden) return;
      uni.uTime.value += Math.min(clock.getDelta(), 0.1);
      uni.uMouse.value.lerp(target, 0.045);
      renderer.render(scene, cam);
    };

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      uni.uTime.value = 30;
      renderer.render(scene, cam);
    } else {
      tick();
    }
  } catch {
    staticFallback();
  }
}
