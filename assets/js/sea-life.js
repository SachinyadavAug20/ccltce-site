const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function buildLife(THREE, scene, tex, m, gsap) {
  function make(name, px, opacity, z) {
    const d = tex[name];
    const mat = new THREE.SpriteMaterial({ map: d.tex, transparent: true, opacity, depthWrite: false });
    const s = new THREE.Sprite(mat);
    s.userData.bw = d.w * px;
    s.userData.bh = d.h * px;
    s.scale.set(s.userData.bw, s.userData.bh, 1);
    s.position.z = z;
    scene.add(s);
    return s;
  }

  const bird = (s, vx, vy) => {
    const a = Math.atan2(vy, vx);
    if (Math.abs(a) > Math.PI / 2) {
      s.material.rotation = a - Math.sign(a) * Math.PI;
      s.scale.y = -s.userData.bh;
    } else {
      s.material.rotation = a;
      s.scale.y = s.userData.bh;
    }
  };

  const fish = Array.from({ length: 9 }, () => ({
    s: make("fish", rnd(2.6, 3.8), rnd(0.7, 0.95), rnd(0, 8)),
    vx: rnd(-40, 40), vy: rnd(-10, 10), ph: rnd(0, 7),
  }));

  const whale = { s: make("whale", 5, 0.95, 4), vx: 0, vy: 0 };
  whale.s.position.set(innerWidth * 0.3, -innerHeight * 0.3, 4);

  const sharks = [
    { s: make("shark", 4.5, 0.6, -10), dir: 1, sp: 34, yo: 0.62 },
    { s: make("shark", 4, 0.5, -12), dir: -1, sp: 27, yo: 0.8 },
  ];

  const boat = { s: make("boat", 4, 0.92, -4), x: innerWidth * 0.72, dir: 1 };
  boat.s.position.set(boat.x, -innerHeight * 0.78, -4);

  const bubbles = Array.from({ length: 10 }, () => ({
    s: make("bubble", 4, rnd(0.3, 0.6), rnd(2, 12)),
    x: rnd(0, innerWidth), y: rnd(0.2, 1) * innerHeight, sp: rnd(16, 40), ph: rnd(0, 7),
  }));

  const rings = [0, 1, 2].map(() => ({ s: make("ring", 3, 0, 10), t: 10 }));
  let ringI = 0;

  fish.forEach((f) => f.s.position.set(rnd(0, innerWidth), -rnd(0.15, 0.8) * innerHeight, f.s.position.z));

  function toss(cx, cy) {
    fish.forEach((f) => {
      const dx = f.s.position.x - cx, dy = -f.s.position.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.max(0, 1 - d / 420);
      f.vx += (dx / d) * 320 * k;
      f.vy += (dy / d) * 320 * k;
    });
    const r = rings[ringI++ % 3];
    r.t = 0;
    r.s.position.set(cx, -cy, 10);
    if (gsap) {
      gsap.fromTo(r.s.scale, { x: 20, y: 20 }, { x: 280, y: 280, duration: 0.7, ease: "power2.out", overwrite: true });
      gsap.fromTo(r.s.material, { opacity: 0.9 }, { opacity: 0, duration: 0.7, ease: "power2.out", overwrite: true });
    } else {
      r.s.material.opacity = 0.9;
    }
  }

  function update(dt, t) {
    fish.forEach((f) => {
      const s = f.s;
      const fx = s.position.x, fy = -s.position.y;
      const dx = fx - m.x, dy = fy - m.y;
      const d = Math.hypot(dx, dy) || 1;
      f.vx += Math.sin(t * 0.5 + f.ph) * 16 * dt;
      f.vy += Math.cos(t * 0.4 + f.ph) * 9 * dt;
      if (d < 150) {
        const k = (1 - d / 150) * 800 * dt;
        f.vx += (dx / d) * k; f.vy += (dy / d) * k;
      }
      const sp = Math.hypot(f.vx, f.vy) || 1;
      f.vx = (f.vx / sp) * 120; f.vy = (f.vy / sp) * 120;
      let nx = fx + f.vx * dt, ny = fy + f.vy * dt;
      if (nx > innerWidth + 50) nx = -50;
      if (nx < -50) nx = innerWidth + 50;
      s.position.x = nx;
      s.position.y = -clamp(ny, innerHeight * 0.08, innerHeight * 0.88);
      bird(s, f.vx, f.vy);
    });

    const w = whale.s;
    const wpx = w.position.x, wpy = -w.position.y;
    const wtx = clamp(m.x, innerWidth * 0.15, innerWidth * 0.85) + Math.sin(t * 0.16) * 40;
    const wty = clamp(m.y * 0.5 + innerHeight * 0.28, innerHeight * 0.15, innerHeight * 0.42) + Math.sin(t * 0.23) * 18;
    whale.vx += ((wtx - wpx) * 0.6 - whale.vx) * Math.min(1, dt * 2);
    whale.vy += ((wty - wpy) * 0.6 - whale.vy) * Math.min(1, dt * 2);
    w.position.x = wpx + whale.vx * dt;
    w.position.y = -(wpy + whale.vy * dt);
    bird(w, whale.vx, whale.vy);

    sharks.forEach((sh) => {
      sh.s.position.x += sh.dir * sh.sp * dt;
      if (sh.s.position.x > innerWidth + 60) sh.s.position.x = -60;
      if (sh.s.position.x < -60) sh.s.position.x = innerWidth + 60;
      sh.s.position.y = -innerHeight * sh.yo + Math.sin(t * 0.5 + sh.sp) * 12;
      bird(sh.s, sh.dir, 0);
    });

    boat.x += boat.dir * 11 * dt;
    if (boat.x > innerWidth * 0.85) boat.dir = -1;
    if (boat.x < innerWidth * 0.15) boat.dir = 1;
    boat.s.position.x += (boat.x - boat.s.position.x) * Math.min(1, dt * 1.4);
    const bd = Math.hypot(boat.s.position.x - m.x, innerHeight * 0.78 - m.y);
    const dip = Math.exp(-bd / 130) * Math.min(Math.hypot(m.vx, m.vy) * 0.6, 14);
    boat.s.position.y = -(innerHeight * 0.78 + dip);
    boat.s.material.rotation = Math.sin(t * 0.9) * 0.08 + dip * 0.015 * Math.sin(t * 3);

    bubbles.forEach((b) => {
      b.y -= b.sp * dt;
      if (b.y < innerHeight * 0.14) { b.y = innerHeight; b.x = rnd(0, innerWidth); }
      b.s.position.x = b.x + Math.sin(t * 0.8 + b.ph) * 6;
      b.s.position.y = -b.y;
    });

    rings.forEach((r) => {
      if (r.t < 3) {
        r.t += dt;
        if (!gsap) {
          const k = 20 + r.t * 320;
          r.s.scale.set(k, k, 1);
          r.s.material.opacity = Math.max(0, 1 - r.t * 2.2);
        }
        if (r.t > 0.85) r.s.material.opacity = 0;
      }
    });
  }

  return { toss, update };
}
