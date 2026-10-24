// End-world mobs — box geometry, Minecraft proportions.
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
  var grp = new THREE.Group(); grp.position.set(x, y, z);
  add(grp, M(2.0, 1.5, 6.0, 0x1a1a2a), 0, 0, 0);
  var neck = M(0.8, 0.8, 2.5, 0x1a1a2a); neck.position.set(0, 0.8, 3.5); neck.rotation.x = -0.3; grp.add(neck);
  add(grp, M(1.2, 1.0, 1.5, 0x1a1a2a), 0, 1.5, 4.8);
  add(grp, M(0.9, 0.3, 1.0, 0x0a0a1a), 0, 1.0, 5.2);
  add(grp, M(0.2, 0.15, 0.1, 0xd420d4), -0.35, 1.6, 5.5);
  add(grp, M(0.2, 0.15, 0.1, 0xd420d4), 0.35, 1.6, 5.5);
  var wingL = M(6.0, 0.3, 4.0, 0x2a1a3a); wingL.position.set(-4.0, 1.0, -0.5); wingL.rotation.z = 0.15; grp.add(wingL);
  var wingR = M(6.0, 0.3, 4.0, 0x2a1a3a); wingR.position.set(4.0, 1.0, -0.5); wingR.rotation.z = -0.15; grp.add(wingR);
  add(grp, M(0.6, 0.5, 3.0, 0x1a1a2a), 0, -0.2, -4.0);
  add(grp, M(0.3, 0.3, 1.5, 0xd420d4), 0, -0.2, -6.0);
  grp.userData.dragonOrbit = true;
  g.add(grp); return grp;
}
