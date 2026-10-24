// Minecraft-style mobs — pure box geometry (overworld + nether).
import * as THREE from "../vendor/three.module.js";

export function M(w, h, d, color) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: color }));
}
function add(grp, mesh, x, y, z) { mesh.position.set(x, y, z); grp.add(mesh); return mesh; }
function part(p, w, h, d, color, x, y, z) { var m = M(w, h, d, color); m.position.set(x, y, z); p.add(m); return m; }
function pair(p, w, h, d, color, sx, y, z) { [-1, 1].forEach(function (s) { part(p, w, h, d, color, s * sx, y, z); }); }
// Hinged parts keep their world box and only move the origin — neck for heads, hip for legs,
// root for tails — so narrative-mobanim.js can swing them from where a real body hinges.
export function head(grp, w, h, d, color, x, y, z, phase) {
  var m = M(w, h, d, color); m.geometry.translate(0, h / 2, 0);
  m.position.set(x, y - h / 2, z); m.userData.head = phase; grp.add(m); return m;
}
export function legs(grp, list, w, h, d, color, phase) {
  list.forEach(function (p, i) {
    var m = M(w, h, d, color); m.geometry.translate(0, -h / 2, 0);
    m.position.set(p[0], p[1] + h / 2, p[2]);
    m.userData.leg = (phase || 0) + (i % 2 ? Math.PI : 0) + (i >> 1) * 1.1;   // diagonal gait
    grp.add(m);
  });
}
export function tail(grp, w, h, d, color, x, y, z, phase) {
  var m = M(w, h, d, color); m.geometry.translate(0, -h / 2, 0);
  m.position.set(x, y + h / 2, z); m.userData.tail = phase; grp.add(m); return m;
}

export function cow(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(1.2, 0.9, 2.0, 0x6b4a33), 0, 0.9, 0); add(grp, M(1.24, 0.42, 1.1, 0x3f2c1f), 0, 1.1, -0.2);   // saddle patch
  add(grp, M(0.5, 0.36, 0.5, 0xe8b8b8), 0, 0.5, -0.62);                                                        // udder
  tail(grp, 0.1, 0.55, 0.1, 0x3f2c1f, 0, 1.2, -1.0, 0.7);
  var h = head(grp, 0.7, 0.7, 0.7, 0x6b4a33, 0, 1.3, 1.1, 0.4);
  part(h, 0.4, 0.26, 0.2, 0xd8a878, 0, 0.3, 0.42); pair(h, 0.15, 0.15, 0.08, 0x141414, 0.17, 0.52, 0.36);   // muzzle + eyes
  pair(h, 0.12, 0.2, 0.1, 0x4a3328, 0.4, 0.58, 0.02); pair(h, 0.12, 0.24, 0.12, 0xe8dcc0, 0.24, 0.78, 0);    // ears + horns
  legs(grp, [[-0.4, 0.35, -0.7], [0.4, 0.35, -0.7], [-0.4, 0.35, 0.7], [0.4, 0.35, 0.7]], 0.25, 0.7, 0.25, 0x3a2820, 0);
  g.add(grp); return grp;
}
export function pig(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(1.0, 0.8, 1.6, 0xe8a0a0), 0, 0.7, 0); add(grp, M(1.04, 0.3, 0.9, 0xd48888), 0, 0.85, -0.1);
  tail(grp, 0.12, 0.3, 0.12, 0xd48080, 0, 1.0, -0.8, 1.4);
  var h = head(grp, 0.7, 0.6, 0.6, 0xe8a0a0, 0, 1.0, 0.9, 2.1);
  part(h, 0.34, 0.26, 0.16, 0xd48080, 0, 0.26, 0.34); pair(h, 0.1, 0.1, 0.06, 0x141414, 0.2, 0.45, 0.31);   // snout + eyes
  [-1, 1].forEach(function (s) { part(h, 0.16, 0.22, 0.1, 0xd48080, s * 0.3, 0.5, 0.1); });                   // ears
  legs(grp, [[-0.35, 0.3, -0.5], [0.35, 0.3, -0.5], [-0.35, 0.3, 0.5], [0.35, 0.3, 0.5]], 0.2, 0.6, 0.2, 0xd48080, 0.5);
  g.add(grp); return grp;
}
export function sheep(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(1.1, 1.0, 1.8, 0xeeeeee), 0, 1.0, 0); add(grp, M(1.24, 0.5, 1.9, 0xf8f8f8), 0, 1.3, -0.05);    // wool topper
  add(grp, M(0.9, 0.4, 0.5, 0xf8f8f8), 0, 1.35, 0.75); add(grp, M(0.54, 0.3, 0.34, 0xf4f4f4), 0, 1.42, 0.98);
  var h = head(grp, 0.5, 0.5, 0.5, 0xd9c2a6, 0, 1.2, 1.0, 3.4);
  pair(h, 0.12, 0.12, 0.07, 0x141414, 0.14, 0.36, 0.27);                                                    // eyes
  [-1, 1].forEach(function (s) { part(h, 0.1, 0.16, 0.08, 0xd9c2a6, s * 0.27, 0.3, 0); });                    // ears
  legs(grp, [[-0.4, 0.3, -0.6], [0.4, 0.3, -0.6], [-0.4, 0.3, 0.6], [0.4, 0.3, 0.6]], 0.2, 0.6, 0.2, 0xd9c2a6, 1.6);
  g.add(grp); return grp;
}
export function chicken(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(0.6, 0.5, 0.8, 0xeeeeee), 0, 0.5, 0); add(grp, M(0.5, 0.3, 0.3, 0xf8f8f8), 0, 0.72, -0.34);    // tail feathers
  [-1, 1].forEach(function (s) { var w = part(grp, 0.12, 0.4, 0.66, 0xe4e4e4, s * 0.35, 0.52, 0);             // wings
    w.geometry.translate(0, -0.2, 0); w.position.y = 0.72; w.userData.wing = s > 0 ? 0 : Math.PI; });           // pivot at shoulder
  var h = head(grp, 0.35, 0.4, 0.35, 0xeeeeee, 0, 0.9, 0.35, 4.2);
  part(h, 0.16, 0.1, 0.2, 0xe8a030, 0, 0.2, 0.24); part(h, 0.1, 0.14, 0.1, 0xd42020, 0, 0.06, 0.2);           // beak + wattle
  part(h, 0.14, 0.14, 0.34, 0xd42020, 0, 0.42, 0); pair(h, 0.08, 0.08, 0.06, 0x141414, 0.13, 0.28, 0.17);     // comb + eyes
  legs(grp, [[-0.15, 0.15, 0], [0.15, 0.15, 0]], 0.08, 0.3, 0.08, 0xe8a030, 2.7);
  g.add(grp); return grp;
}
export function villager(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(0.8, 1.2, 0.5, 0x8b6b4a), 0, 0.6, 0); add(grp, M(0.86, 0.5, 0.56, 0x7a5c40), 0, 1.05, 0);       // robe hem
  [-1, 1].forEach(function (s) { var a = part(grp, 0.2, 0.6, 0.24, 0x8b6b4a, s * 0.5, 0.95, 0.06); a.rotation.x = -0.5; });
  var h = head(grp, 0.55, 0.55, 0.55, 0xc4956a, 0, 1.5, 0, 5.1);
  part(h, 0.16, 0.3, 0.18, 0xb4855a, 0, 0.28, 0.3); pair(h, 0.16, 0.1, 0.1, 0x6a4a2a, 0.17, 0.44, 0.24);      // nose + brow
  pair(h, 0.1, 0.1, 0.06, 0x17dd62, 0.14, 0.34, 0.26); add(grp, M(0.4, 0.08, 0.08, 0x4a3328), 0, 1.55, 0.3);  // eyes + mouth
  legs(grp, [[-0.2, 0.3, -0.1], [0.2, 0.3, -0.1], [-0.2, 0.3, 0.12], [0.2, 0.3, 0.12]], 0.2, 0.6, 0.2, 0x5a4030, 0.9);
  g.add(grp); return grp;
}
export function piglin(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(0.8, 1.0, 0.5, 0xc4956a), 0, 1.0, 0); add(grp, M(0.84, 0.4, 0.54, 0x6a4a30), 0, 0.7, 0);        // trousers
  var h = head(grp, 0.6, 0.55, 0.55, 0xc4956a, 0, 1.8, 0, 6.3);
  part(h, 0.3, 0.2, 0.2, 0xa07050, 0, 0.2, 0.34); pair(h, 0.1, 0.1, 0.06, 0x141414, 0.16, 0.42, 0.28);       // snout + eyes
  pair(h, 0.3, 0.34, 0.12, 0xd4a574, 0.42, 0.34, 0); pair(h, 0.08, 0.16, 0.1, 0xe8c878, 0.4, 0.06, 0.1);      // ears + gold cuffs
  [-1, 1].forEach(function (s) { var a = part(grp, 0.2, 0.8, 0.2, 0xc4956a, s * 0.55, 1.3, 0); a.rotation.x = s > 0 ? -0.4 : -0.6; });
  legs(grp, [[-0.2, 0.3, 0], [0.2, 0.3, 0]], 0.22, 0.6, 0.22, 0x4a3328, 1.7);
  g.add(grp); return grp;
}
export function hoglin(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(1.4, 1.0, 2.2, 0x8b4a3a), 0, 1.0, 0); add(grp, M(1.44, 0.36, 1.4, 0x6b3a2a), 0, 1.3, -0.3);     // mane ridge
  add(grp, M(0.3, 0.5, 1.5, 0x6b3a2a), 0, 1.6, 0);                                                              // back crest
  var h = head(grp, 0.9, 0.8, 0.7, 0x8b4a3a, 0, 1.3, 1.3, 7.1);
  pair(h, 0.1, 0.3, 0.1, 0xeeeeee, 0.3, 0.05, 0.3); pair(h, 0.14, 0.14, 0.08, 0x141414, 0.24, 0.5, 0.33);     // tusks + eyes
  pair(h, 0.14, 0.34, 0.1, 0x6b3a2a, 0.5, 0.5, 0.02);                                                            // ears
  legs(grp, [[-0.5, 0.4, -0.8], [0.5, 0.4, -0.8], [-0.5, 0.4, 0.8], [0.5, 0.4, 0.8]], 0.3, 0.8, 0.3, 0x6b3a2a, 2.3);
  g.add(grp); return grp;
}
export function ghast(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(2.5, 2.5, 2.5, 0xeeeeee), 0, 0, 0);
  pair(grp, 0.3, 0.3, 0.2, 0xd42020, 0.5, 0.3, 1.3); pair(grp, 0.16, 0.16, 0.1, 0x1a1a1a, 0.5, 0.3, 1.42);   // eyes
  add(grp, M(0.8, 0.4, 0.2, 0x4a4a4a), 0, -0.5, 1.3);                                                            // mouth
  for (var t = 0; t < 8; t++) { var tn = M(0.15, 1.5 + (t % 3) * 0.5, 0.15, 0xeeeeee);
    tn.position.set((t % 4 - 1.5) * 0.6, -1.5 - (t % 3) * 0.3, t < 4 ? -0.5 : 0.5); tn.userData.leg = t * 0.7; grp.add(tn); }
  grp.userData.float = Math.random() * Math.PI * 2;
  g.add(grp); return grp;
}
export function magmaCube(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(1.5, 1.5, 1.5, 0x3a0a0a), 0, 0.75, 0); add(grp, M(1.0, 1.0, 1.0, 0xff4400), 0, 0.75, 0);
  add(grp, M(0.5, 0.5, 0.5, 0xffaa00), 0, 0.75, 0); grp.userData.pulse = Math.random() * 6;
  g.add(grp); return grp;
}
export function blaze(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(0.6, 0.6, 0.6, 0xffaa00), 0, 1.8, 0); add(grp, M(0.5, 0.8, 0.5, 0x4a3a1a), 0, 1.2, 0);
  for (var r = 0; r < 3; r++) for (var rod = 0; rod < 4; rod++) { var a = rod * Math.PI / 2 + r * 0.5;
    var rb = M(0.12, 0.8, 0.12, 0xffaa00); rb.position.set(Math.cos(a) * (0.5 + r * 0.25), 0.8 + r * 0.35, Math.sin(a) * (0.5 + r * 0.25));
    rb.userData.tail = a + r; grp.add(rb); }                                                                        // rods drift
  grp.userData.float = Math.random() * Math.PI * 2;
  g.add(grp); return grp;
}
export function witherSkeleton(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(0.6, 1.0, 0.35, 0x2a2a2a), 0, 1.2, 0);
  var h = head(grp, 0.5, 0.5, 0.5, 0x1a1a1a, 0, 2.0, 0, 8.2);
  pair(h, 0.14, 0.1, 0.08, 0xd42020, 0.14, 0.34, 0.25);                                                            // ember eyes
  add(grp, M(0.7, 0.08, 0.08, 0x3a3a3a), 0, 1.5, 0); add(grp, M(0.7, 0.08, 0.08, 0x3a3a3a), 0, 1.2, 0);           // ribs
  var sword = M(0.08, 1.2, 0.08, 0x4a4a4a); sword.position.set(0.5, 1.2, 0.2); sword.rotation.z = -0.3; grp.add(sword);
  legs(grp, [[-0.18, 0.5, 0], [0.18, 0.5, 0]], 0.15, 1.0, 0.15, 0x2a2a2a, 3.3);
  [-1, 1].forEach(function (s) { var a = part(grp, 0.14, 0.8, 0.14, 0x2a2a2a, s * 0.42, 1.4, 0); a.rotation.z = s * 0.2; });
  g.add(grp); return grp;
}
