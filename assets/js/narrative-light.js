// Day/night presets, dimension light damping, camera follow-light, fog/sky lerp.
import * as THREE from "../vendor/three.module.js";

export var DIM_L = { overworld: 1, nether: 0.5, end: 0.66, bedrock: 0.42 };

var TOD = {
  night:   { sky: 0x0a0e1a, fog: 0x0a0e1a, d: 0.0035, sun: 0x8899cc, sunI: 0.5,  amb: 0x2c3a52, ambI: 0.52, hemiS: 0x334466, hemiG: 0x141422, pos: [-40, 50, 20] },
  dawn:    { sky: 0xee9966, fog: 0xcc8866, d: 0.003,  sun: 0xffaa66, sunI: 0.75, amb: 0x556688, ambI: 0.5,  hemiS: 0x7788aa, hemiG: 0x334422, pos: [-80, 20, 10] },
  morning: { sky: 0xaaccff, fog: 0xaaccff, d: 0.0026, sun: 0xffeecc, sunI: 0.9,  amb: 0x8899bb, ambI: 0.55, hemiS: 0xaaccff, hemiG: 0x554433, pos: [-50, 60, 20] },
  noon:    { sky: 0x78a7ff, fog: 0xbdd5ff, d: 0.0022, sun: 0xffffff, sunI: 1.05, amb: 0xaabbcc, ambI: 0.6,  hemiS: 0xbdd5ff, hemiG: 0x665544, pos: [0, 90, 30] },
  aftern:  { sky: 0x99bbff, fog: 0xaaccff, d: 0.0026, sun: 0xffeecc, sunI: 0.95, amb: 0x99aabb, ambI: 0.55, hemiS: 0xaaccff, hemiG: 0x554433, pos: [50, 60, 20] },
  sunset:  { sky: 0xff9966, fog: 0xcc8866, d: 0.0034, sun: 0xff8844, sunI: 0.8,  amb: 0x776688, ambI: 0.5,  hemiS: 0xaa88bb, hemiG: 0x443322, pos: [80, 25, 10] },
  dusk:    { sky: 0x554466, fog: 0x554466, d: 0.004,  sun: 0xcc6644, sunI: 0.6,  amb: 0x4a5c80, ambI: 0.5,  hemiS: 0x667799, hemiG: 0x222211, pos: [90, 10, 10] },
};

export function getTOD() {
  var h = new Date().getHours() + new Date().getMinutes() / 60;
  if (h >= 5 && h < 6.5) return TOD.dawn;
  if (h >= 6.5 && h < 11) return TOD.morning;
  if (h >= 11 && h < 15) return TOD.noon;
  if (h >= 15 && h < 17.5) return TOD.aftern;
  if (h >= 17.5 && h < 19.5) return TOD.sunset;
  if (h >= 19.5 && h < 21) return TOD.dusk;
  return TOD.night;
}

export function createLighting(scene, L) {
  var presets = scene.userData.skyPresets || {};
  var t = { sky: new THREE.Color(0x78a7ff), fog: new THREE.Color(0xbdd5ff), d: 0.0026 };
  var tod = getTOD(), lastHour = -1;
  var follow = new THREE.PointLight(0xffd9a8, 45, 60);
  follow.position.set(0, 14, 0);
  scene.add(follow);
  function sky(dim) {
    var p = dim === "overworld" ? tod : presets[dim];
    if (!p) return;
    t.sky.setHex(p.sky); t.fog.setHex(p.fog); t.d = p.d;
  }
  function lights(dim) {
    var k = DIM_L[dim] || 1;
    if (L.sun) { L.sun.color.setHex(tod.sun); L.sun.intensity = tod.sunI * k; L.sun.position.set(tod.pos[0], tod.pos[1], tod.pos[2]); }
    if (L.amb) { L.amb.color.setHex(tod.amb); L.amb.intensity = tod.ambI * (0.6 + 0.4 * k); }
    if (L.fill) { L.fill.color.setHex(tod.sun); L.fill.intensity = 0.3 * k; L.fill.position.set(-tod.pos[0] * 0.5, 25, -40); }
    if (L.hemi) { L.hemi.color.setHex(tod.hemiS); L.hemi.groundColor.setHex(tod.hemiG); L.hemi.intensity = 0.5 * (0.4 + 0.6 * k); }
    follow.intensity = dim === "overworld" ? 0 : 55;
    follow.color.setHex(dim === "end" ? 0xd8c0ff : 0xffd9a8);
  }
  function tick(dim, cam) {
    var hr = new Date().getHours();
    if (hr !== lastHour) { lastHour = hr; tod = getTOD(); sky(dim); lights(dim); }
    follow.position.copy(cam.position);
    if (scene.fog) {
      scene.fog.color.lerp(t.fog, 0.09);
      scene.fog.density += (t.d - scene.fog.density) * 0.09;
    }
    if (scene.background && scene.background.isColor) scene.background.lerp(t.sky, 0.09);
  }
  return { sky: sky, lights: lights, tick: tick };
}
