// Shared voxel helpers for the narrative scene. No blue.
import * as THREE from "../vendor/three.module.js";

export var GOLD = 0xffaa00, EMER = 0x17dd62, RED = 0xff2222, AMETH = 0xc026d3;
export var STONE = 0x52525b, STONE2 = 0x3f3f46, DEEP = 0x1c1c1f, DARK = 0x27272a;
export var OAK = 0xbc7b44, DARKOAK = 0x4a3728, QUARTZ = 0xededed;
export var NETHERRACK = 0x6b1a1a, LAVA = 0xff4400, GLOWSTONE = 0xffcc44;
export var ENDSTONE = 0xd4c87a, OBSIDIAN = 0x1a0a2e, PURPUR = 0xa87fb5;
export var END_ROD = 0xf0e8ff, SOUL = 0x2dd4a8, WARP = 0x1a6b5a;

export function box(w, h, d, color, emissive, ei) {
  var mat = new THREE.MeshLambertMaterial({ color: color });
  if (emissive) { mat.emissive = new THREE.Color(emissive); mat.emissiveIntensity = ei || 0.6; }
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

export function glowLight(color, intensity, dist, x, y, z) {
  var l = new THREE.PointLight(color, intensity, dist);
  l.position.set(x, y, z);
  return l;
}

export function tree(g, x, z, scale) {
  var s = scale || 1;
  var trunk = box(1.5 * s, 6 * s, 1.5 * s, OAK); trunk.position.set(x, 2 * s, z); g.add(trunk);
  var leaves = box(5 * s, 5 * s, 5 * s, 0x2d7a1e); leaves.position.set(x, 7 * s, z); g.add(leaves);
  var leaves2 = box(3 * s, 3 * s, 3 * s, 0x3d8c2a); leaves2.position.set(x, 10 * s, z); g.add(leaves2);
}

export function torch(g, x, y, z) {
  var stick = box(0.8, 2, 0.8, OAK); stick.position.set(x, y, z); g.add(stick);
  var flame = box(0.6, 1, 0.6, GOLD, GOLD, 1); flame.position.set(x, y + 1.4, z); g.add(flame);
  g.add(glowLight(GOLD, 1.5, 18, x, y + 1.5, z));
}
