// Minecraft-style mobs — pure box geometry (overworld + nether).
import * as THREE from "../vendor/three.module.js";

export function M(w, h, d, color) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: color }));
}

function add(grp, mesh, x, y, z) { mesh.position.set(x, y, z); grp.add(mesh); return mesh; }

export function cow(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(1.2, 0.9, 2.0, 0x4a3328), 0, 0.9, 0);
  add(grp, M(0.7, 0.7, 0.7, 0x4a3328), 0, 1.3, 1.1);
  add(grp, M(0.4, 0.3, 0.2, 0xd4a574), 0, 1.15, 1.5);
  add(grp, M(0.5, 0.4, 0.3, 0x1a1a1a), 0.3, 1.0, 0.5);
  [[-0.4, 0.35, -0.7], [0.4, 0.35, -0.7], [-0.4, 0.35, 0.7], [0.4, 0.35, 0.7]].forEach(function (p) {
    add(grp, M(0.25, 0.7, 0.25, 0x3a2820), p[0], p[1], p[2]);
  });
  g.add(grp); return grp;
}

export function pig(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(1.0, 0.8, 1.6, 0xe8a0a0), 0, 0.7, 0);
  add(grp, M(0.7, 0.6, 0.6, 0xe8a0a0), 0, 1.0, 0.9);
  add(grp, M(0.35, 0.25, 0.15, 0xd48080), 0, 0.9, 1.3);
  [[-0.35, 0.3, -0.5], [0.35, 0.3, -0.5], [-0.35, 0.3, 0.5], [0.35, 0.3, 0.5]].forEach(function (p) {
    add(grp, M(0.2, 0.6, 0.2, 0xd48080), p[0], p[1], p[2]);
  });
  g.add(grp); return grp;
}

export function sheep(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(1.1, 1.0, 1.8, 0xeeeeee), 0, 1.0, 0);
  add(grp, M(0.5, 0.5, 0.5, 0xd4a080), 0, 1.2, 1.0);
  [[-0.4, 0.3, -0.6], [0.4, 0.3, -0.6], [-0.4, 0.3, 0.6], [0.4, 0.3, 0.6]].forEach(function (p) {
    add(grp, M(0.2, 0.6, 0.2, 0xd4a080), p[0], p[1], p[2]);
  });
  g.add(grp); return grp;
}

export function chicken(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(0.6, 0.5, 0.8, 0xeeeeee), 0, 0.5, 0);
  add(grp, M(0.35, 0.4, 0.35, 0xeeeeee), 0, 0.9, 0.35);
  add(grp, M(0.15, 0.1, 0.2, 0xe8a030), 0, 0.85, 0.6);
  add(grp, M(0.1, 0.15, 0.1, 0xd42020), 0, 1.15, 0.3);
  [[-0.15, 0.15, 0], [0.15, 0.15, 0]].forEach(function (p) {
    add(grp, M(0.08, 0.3, 0.08, 0xe8a030), p[0], p[1], p[2]);
  });
  g.add(grp); return grp;
}

export function villager(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(0.8, 1.2, 0.5, 0x8b6b4a), 0, 0.6, 0);
  add(grp, M(0.55, 0.55, 0.55, 0xc4956a), 0, 1.5, 0);
  add(grp, M(0.12, 0.25, 0.15, 0xb4855a), 0, 1.45, 0.32);
  add(grp, M(0.4, 0.08, 0.08, 0x4a3328), 0, 1.55, 0.3);
  [[-0.2, 0.3, -0.1], [0.2, 0.3, -0.1]].forEach(function (p) {
    add(grp, M(0.2, 0.6, 0.2, 0x5a4030), p[0], p[1], p[2]);
  });
  g.add(grp); return grp;
}

export function piglin(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(0.8, 1.0, 0.5, 0xc4956a), 0, 1.0, 0);
  add(grp, M(0.6, 0.55, 0.55, 0xc4956a), 0, 1.8, 0);
  add(grp, M(0.3, 0.2, 0.2, 0xa07050), 0, 1.7, 0.35);
  add(grp, M(0.12, 0.25, 0.08, 0xa07050), -0.25, 2.0, 0);
  add(grp, M(0.12, 0.25, 0.08, 0xa07050), 0.25, 2.0, 0);
  add(grp, M(0.2, 0.8, 0.2, 0xc4956a), -0.55, 1.0, 0);
  add(grp, M(0.2, 0.8, 0.2, 0xc4956a), 0.55, 1.0, 0);
  [[-0.2, 0.3, 0], [0.2, 0.3, 0]].forEach(function (p) {
    add(grp, M(0.22, 0.6, 0.22, 0x4a3328), p[0], p[1], p[2]);
  });
  g.add(grp); return grp;
}

export function hoglin(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(1.4, 1.0, 2.2, 0x8b4a3a), 0, 1.0, 0);
  add(grp, M(0.9, 0.8, 0.7, 0x8b4a3a), 0, 1.3, 1.3);
  add(grp, M(0.1, 0.3, 0.1, 0xeeeeee), -0.3, 1.0, 1.7);
  add(grp, M(0.1, 0.3, 0.1, 0xeeeeee), 0.3, 1.0, 1.7);
  add(grp, M(0.3, 0.5, 1.5, 0x6b3a2a), 0, 1.6, 0);
  [[-0.5, 0.4, -0.8], [0.5, 0.4, -0.8], [-0.5, 0.4, 0.8], [0.5, 0.4, 0.8]].forEach(function (p) {
    add(grp, M(0.3, 0.8, 0.3, 0x6b3a2a), p[0], p[1], p[2]);
  });
  g.add(grp); return grp;
}

export function ghast(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(2.5, 2.5, 2.5, 0xeeeeee), 0, 0, 0);
  add(grp, M(0.3, 0.3, 0.2, 0xd42020), -0.5, 0.3, 1.3);
  add(grp, M(0.3, 0.3, 0.2, 0xd42020), 0.5, 0.3, 1.3);
  add(grp, M(0.8, 0.4, 0.2, 0x4a4a4a), 0, -0.5, 1.3);
  for (var t = 0; t < 8; t++) add(grp, M(0.15, 1.5 + (t % 3) * 0.5, 0.15, 0xeeeeee), (t % 4 - 1.5) * 0.6, -1.8 - (t % 3) * 0.3, t < 4 ? -0.5 : 0.5);
  grp.userData.float = Math.random() * Math.PI * 2;
  g.add(grp); return grp;
}

export function magmaCube(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(1.5, 1.5, 1.5, 0x3a0a0a), 0, 0.75, 0);
  add(grp, M(1.0, 1.0, 1.0, 0xff4400), 0, 0.75, 0);
  add(grp, M(0.5, 0.5, 0.5, 0xffaa00), 0, 0.75, 0);
  grp.userData.pulse = Math.random() * 6;
  g.add(grp); return grp;
}

export function blaze(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(0.6, 0.6, 0.6, 0xffaa00), 0, 1.8, 0);
  add(grp, M(0.5, 0.8, 0.5, 0x4a3a1a), 0, 1.2, 0);
  for (var r = 0; r < 3; r++) for (var rod = 0; rod < 4; rod++) {
    var a = rod * Math.PI / 2 + r * 0.5;
    add(grp, M(0.12, 0.8, 0.12, 0xffaa00), Math.cos(a) * (0.5 + r * 0.25), 0.8 + r * 0.35, Math.sin(a) * (0.5 + r * 0.25));
  }
  grp.userData.float = Math.random() * Math.PI * 2;
  g.add(grp); return grp;
}

export function witherSkeleton(g, x, y, z) {
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(0.6, 1.0, 0.35, 0x2a2a2a), 0, 1.2, 0);
  add(grp, M(0.5, 0.5, 0.5, 0x1a1a1a), 0, 2.0, 0);
  add(grp, M(0.7, 0.08, 0.08, 0x3a3a3a), 0, 1.5, 0);
  add(grp, M(0.7, 0.08, 0.08, 0x3a3a3a), 0, 1.2, 0);
  var sword = M(0.08, 1.2, 0.08, 0x4a4a4a); sword.position.set(0.5, 1.2, 0.2); sword.rotation.z = -0.3; grp.add(sword);
  [[-0.18, 0.5, 0], [0.18, 0.5, 0]].forEach(function (p) {
    add(grp, M(0.15, 1.0, 0.15, 0x2a2a2a), p[0], p[1], p[2]);
  });
  g.add(grp); return grp;
}
