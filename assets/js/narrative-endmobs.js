// End-world mobs — box geometry, Minecraft proportions. Dragon matches official model:
// 16-wide × 8-tall hitbox, neck/jaw, wing groups (flappable), 4 legs, tapering tail.
import * as THREE from "../vendor/three.module.js";
import { M } from "./narrative-mobs.js";

function add(grp, mesh, x, y, z) {
  mesh.position.set(x, y, z); grp.add(mesh); return mesh;
}
function E(mesh, hex) { mesh.material.emissive = new THREE.Color(hex); return mesh; }

export function enderman(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  grp.userData.enderman = true;                                  // dragon-kill dance troupe
  grp.userData.baseY = y;                                        // dance bob anchors here
  add(grp, M(0.6, 1.8, 0.35, 0x0a0a0a), 0, 1.8, 0);
  add(grp, M(0.55, 0.55, 0.55, 0x0a0a0a), 0, 3.0, 0);
  E(add(grp, M(0.18, 0.1, 0.1, 0xd4a0f0), -0.12, 3.0, 0.3), 0xb560ff);   // glowing gaze
  E(add(grp, M(0.18, 0.1, 0.1, 0xd4a0f0), 0.12, 3.0, 0.3), 0xb560ff);
  add(grp, M(0.15, 1.8, 0.15, 0x0a0a0a), -0.45, 1.6, 0).userData.armL = true;
  add(grp, M(0.15, 1.8, 0.15, 0x0a0a0a), 0.45, 1.6, 0).userData.armR = true;
  add(grp, M(0.18, 1.5, 0.18, 0x0a0a0a), -0.18, 0.75, 0).userData.legL = true;
  add(grp, M(0.18, 1.5, 0.18, 0x0a0a0a), 0.18, 0.75, 0).userData.legR = true;
  g.add(grp); return grp;
}

export function shulker(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(1.0, 0.8, 1.0, 0x8a7a9a), 0, 0.4, 0);
  add(grp, M(0.9, 0.3, 0.9, 0xa89aba), 0, 0.9, 0);
  add(grp, M(0.3, 0.3, 0.1, 0x4a3a5a), 0, 0.5, 0.55);
  E(add(grp, M(0.08, 0.08, 0.05, 0xd4a0f0), -0.08, 0.5, 0.6), 0xb560ff);
  E(add(grp, M(0.08, 0.08, 0.05, 0xd4a0f0), 0.08, 0.5, 0.6), 0xb560ff);
  g.add(grp); return grp;
}

export function enderDragon(g, x, y, z) {
  var D = 0x16121f,      // scale black-violet
      D2 = 0x241d38,     // lighter plate tone
      D3 = 0x0e0b16,     // near-black underbody / jaw
      SPK = 0x3a2d55,    // horn/spike bone
      EYE = 0xe879f9;
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  // torso: tapered ribcage of offset plates (reads as segmented scale bands)
  add(grp, M(2.7, 2.3, 5.2, D), 0, 0, 0);
  add(grp, M(2.9, 0.75, 4.5, D2), 0, 1.0, 0);                   // wither plate
  add(grp, M(2.4, 0.9, 4.2, D3), 0, -0.95, 0);                  // belly shadow
  add(grp, M(2.0, 2.0, 1.3, D), 0, 0.1, -2.2);                  // hip saddle
  [[-2.0, 1.75, -0.5], [-0.7, 1.85, 0.65], [0.7, 1.85, -0.65], [2.0, 1.75, 0.5]].forEach(function (sk) {
    var sp = add(grp, M(0.4, 0.6, 0.5, SPK), 0, sk[1], sk[0]); sp.rotation.x = sk[2];   // grounded on the plate
  });
  // neck: 3 arch links rising to the look head (userlist guarded by dragonHead)
  add(grp, M(1.34, 1.25, 1.15, D), 0, 1.05, 2.9);
  add(grp, M(1.12, 1.05, 1.15, D), 0, 1.55, 4.0);
  add(grp, M(0.98, 0.95, 1.15, D2), 0, 2.0, 5.05);
  var head = add(grp, M(1.45, 1.05, 1.3, D), 0, 2.55, 5.95);     // skull (look target)
  head.userData.dragonHead = true;
  add(grp, M(1.0, 0.72, 1.1, D2), 0, 2.32, 6.95);                // snout bridge
  add(grp, M(0.66, 0.45, 0.6, D), 0, 2.36, 7.62);                // nose block
  add(grp, M(0.13, 0.12, 0.1, D3), -0.28, 2.5, 7.95);            // nostrils
  add(grp, M(0.13, 0.12, 0.1, D3), 0.28, 2.5, 7.95);
  add(grp, M(0.3, 0.2, 1.4, D2), -0.42, 2.96, 6.2);              // brow ridges
  add(grp, M(0.3, 0.2, 1.4, D2), 0.42, 2.96, 6.2);
  var jaw = add(grp, M(1.12, 0.3, 1.75, D3), 0, 1.92, 6.15);     // lower jaw hinged at the back
  jaw.geometry.translate(0, 0, 0.75);                            // pivot behind, front sweeps on roar
  jaw.userData.dragonJaw = true;
  add(grp, M(0.3, 0.24, 0.18, EYE), -0.5, 2.74, 6.6).userData.dragonEye = true;
  add(grp, M(0.3, 0.24, 0.18, EYE), 0.5, 2.74, 6.6).userData.dragonEye = true;
  [-1, 1].forEach(function (s) {
    var horn = add(grp, M(0.26, 0.26, 1.0, SPK), 0.42 * s, 3.28, 5.5);
    horn.rotation.x = -0.95;                                     // swept-back horns
    add(grp, M(0.2, 0.2, 0.6, SPK), 0.62 * s, 3.2, 4.4).rotation.x = -0.8; // nub pair
  });
  // jointed legs: thigh + shin + spread claw-tipped feet
  [[-1.05, 1.75], [1.05, 1.75], [-1.05, -1.8], [1.05, -1.8]].forEach(function (p) {
    add(grp, M(0.6, 1.15, 0.6, D2), p[0], -1.15, p[1]);
    add(grp, M(0.5, 1.05, 0.5, D), p[0], -2.05, p[1] + 0.1);
    [-0.2, 0, 0.2].forEach(function (tt) {
      add(grp, M(0.26, 0.24, 0.42, SPK), p[0] + tt, -2.58, p[1] + 0.62);
    });
  });
  // tail: 5-taper snake with spike studs each segment
  [[1.65, 1.5, 1.75, 0, -0.25, -3.6], [1.25, 1.15, 1.5, 0, -0.5, -5.05],
   [0.95, 0.9, 1.3, 0, -0.75, -6.3], [0.72, 0.68, 1.15, D2, -0.98, -7.35],
   [0.5, 0.5, 1.0, D2, -1.18, -8.3]].forEach(function (tg) {
    var seg = add(grp, M(tg[0], tg[1], tg[2], tg[3]), 0, tg[4], tg[5]);
    seg.userData.dragonTail = true;
    add(seg, M(0.2, 0.42, 0.5, SPK), 0, tg[1] * 0.65, 0);          // small kite ridge stud per segment
  });
  // wings: ONE swept assembly per side — shoulder, straight leading-edge bone,
  // two back-swept ribs, two overlapping membranes, knuckle claw on the bone tip.
  // Set up in a sub-group so every piece lines up along the same local +x axis
  // (mirror via scale.x, so the sweep mirrors for free).
  [-1, 1].forEach(function (s) {
    var w = new THREE.Group(); w.position.set(1.35 * s, 0.9, 0.35); w.scale.x = s;
    var sweep = new THREE.Group(); sweep.rotation.y = 0.62; w.add(sweep);
    add(sweep, M(0.4, 0.42, 1.4, D), 0.1, 0.05, 0);              // shoulder joint
    add(sweep, M(7.4, 0.28, 0.42, D2), 3.7, 0.1, 0);             // leading-edge bone
    add(sweep, M(2.6, 0.24, 0.3, D2), 1.6, -0.15, -1.2);         // inner rib
    add(sweep, M(2.2, 0.2, 0.28, D2), 4.3, -0.25, -1.5);         // outer rib
    add(sweep, M(3.5, 0.12, 2.2, D2), 2.3, -0.34, -0.85);        // inner membrane
    add(sweep, M(3.1, 0.1, 1.8, D2), 5.0, -0.44, -1.0);          // outer membrane
    add(sweep, M(0.34, 0.34, 0.34, SPK), 7.4, -0.18, 0);         // claw knuckle on the tip
    grp.add(w); w.userData[s < 0 ? "wingL" : "wingR"] = true;
  });
  var hit = new THREE.Mesh(new THREE.BoxGeometry(5, 4.5, 6),   // click target (forgiving on low-end)
    new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
  hit.position.set(0, 2.5, 6.3); hit.userData.dragonHit = true; grp.add(hit);
  grp.userData.dragon = true;
  g.add(grp); return grp;
}
