// End-world mobs — box geometry, Minecraft proportions. Dragon matches official model:
// 16-wide × 8-tall hitbox, neck/jaw, wing groups (flappable), 4 legs, tapering tail.
import * as THREE from "../vendor/three.module.js";
import { M } from "./narrative-mobs.js";

function add(grp, mesh, x, y, z) {
  mesh.position.set(x, y, z); grp.add(mesh); return mesh;
}

export function enderman(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(0.6, 1.8, 0.35, 0x0a0a0a), 0, 1.8, 0);
  add(grp, M(0.55, 0.55, 0.55, 0x0a0a0a), 0, 3.0, 0);
  add(grp, M(0.18, 0.1, 0.1, 0xd4a0f0), -0.12, 3.0, 0.3);
  add(grp, M(0.18, 0.1, 0.1, 0xd4a0f0), 0.12, 3.0, 0.3);
  add(grp, M(0.15, 1.8, 0.15, 0x0a0a0a), -0.45, 1.6, 0);
  add(grp, M(0.15, 1.8, 0.15, 0x0a0a0a), 0.45, 1.6, 0);
  add(grp, M(0.18, 1.5, 0.18, 0x0a0a0a), -0.18, 0.75, 0);
  add(grp, M(0.18, 1.5, 0.18, 0x0a0a0a), 0.18, 0.75, 0);
  g.add(grp); return grp;
}

export function shulker(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(1.0, 0.8, 1.0, 0x8a7a9a), 0, 0.4, 0);
  add(grp, M(0.9, 0.3, 0.9, 0xa89aba), 0, 0.9, 0);
  add(grp, M(0.3, 0.3, 0.1, 0x4a3a5a), 0, 0.5, 0.55);
  add(grp, M(0.08, 0.08, 0.05, 0xd4a0f0), -0.08, 0.5, 0.6);
  add(grp, M(0.08, 0.08, 0.05, 0xd4a0f0), 0.08, 0.5, 0.6);
  g.add(grp); return grp;
}

export function enderDragon(g, x, y, z) {
  var D = 0x16121f, D2 = 0x241d38, EYE = 0xe879f9;
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(2.6, 2.2, 5.5, D), 0, 0, 0);                       // torso
  add(grp, M(2.0, 0.5, 4.6, D2), 0, 1.2, -0.3);                 // back ridge
  add(grp, M(1.3, 1.2, 1.4, D), 0, 0.9, 3.0);                   // neck
  add(grp, M(1.1, 1.0, 1.3, D), 0, 1.5, 4.1);
  add(grp, M(0.95, 0.9, 1.2, D), 0, 2.0, 5.1);
  var head = add(grp, M(1.5, 1.15, 1.9, D), 0, 2.5, 6.3);       // head (look target)
  head.userData.dragonHead = true;
  add(grp, M(1.15, 0.35, 1.5, D2), 0, 1.85, 6.6);               // jaw
  add(grp, M(0.3, 0.22, 0.16, EYE), -0.45, 2.6, 7.25);          // purple eyes
  add(grp, M(0.3, 0.22, 0.16, EYE), 0.45, 2.6, 7.25);
  [[-1.0, 1.9], [1.0, 1.9], [-1.0, -1.9], [1.0, -1.9]].forEach(function (p) {
    add(grp, M(0.55, 1.5, 0.55, D), p[0], -1.4, p[1]);          // legs
    add(grp, M(0.7, 0.4, 1.0, D2), p[0], -2.25, p[1] + 0.15);   // feet
  });
  add(grp, M(1.7, 1.5, 1.8, D), 0, -0.2, -3.5);                 // tail
  add(grp, M(1.3, 1.1, 1.6, D), 0, -0.45, -5.0);
  add(grp, M(1.0, 0.85, 1.4, D), 0, -0.7, -6.3);
  add(grp, M(0.7, 0.6, 1.2, D2), 0, -0.95, -7.4);
  [-1, 1].forEach(function (s) {                                // wings — flap via group
    var w = new THREE.Group(); w.position.set(1.3 * s, 0.7, 0.4);
    add(w, M(5.2, 0.25, 3.6, D2), 2.7 * s, 0, 0);
    add(w, M(4.4, 0.2, 3.0, D2), 6.9 * s, 0, -0.4);
    add(w, M(0.35, 2.6, 0.35, D), 5.0 * s, -1.3, 1.4);
    grp.add(w); w.userData[s < 0 ? "wingL" : "wingR"] = true;
  });
  var hit = new THREE.Mesh(new THREE.BoxGeometry(5, 4.5, 6),   // click target (forgiving on low-end)
    new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
  hit.position.set(0, 2.5, 6.3); hit.userData.dragonHit = true; grp.add(hit);
  grp.userData.dragon = true;
  g.add(grp); return grp;
}
