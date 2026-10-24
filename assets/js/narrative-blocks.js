// Shared voxel helpers for the narrative scene. No blue.
import * as THREE from "../vendor/three.module.js";

export var GOLD = 0xffaa00, EMER = 0x17dd62, RED = 0xff2222, AMETH = 0xc026d3;
export var STONE = 0x52525b, STONE2 = 0x3f3f46, DEEP = 0x1c1c1f, DARK = 0x27272a;
export var OAK = 0xbc7b44, DARKOAK = 0x4a3728, QUARTZ = 0xededed;

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
