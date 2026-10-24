// Shared voxel helpers — colors follow real Minecraft plains-biome palette.
import * as THREE from "../vendor/three.module.js";

export var GOLD = 0xffaa00, EMER = 0x17dd62, RED = 0xff2222, AMETH = 0xc026d3;
export var STONE = 0x7f7f7f, STONE2 = 0x6b6b6b, DEEP = 0x1c1c1f, DARK = 0x27272a;
export var OAK = 0xbd7f32, DARKOAK = 0x452e1c, QUARTZ = 0xededed;
export var NETHERRACK = 0x6e2020, LAVA = 0xff6a1a, GLOWSTONE = 0xffd070;
export var ENDSTONE = 0xd4c87a, OBSIDIAN = 0x141018, PURPUR = 0xa87fb5;
export var END_ROD = 0xf0e8ff, SOUL = 0x2dd4a8, WARP = 0x1a6b5a;
export var GRASS = 0x91bd59, DIRT = 0x866043, LEAF = 0x77ab2f, LEAF2 = 0x8bc34a;
export var WATER = 0x3f76e4, PATH = 0x9e8154;
// Nether biome palette (wiki): crimson/warped nylium + stems, shroomlight, soul sand/soil, basalt
export var NYL_C = 0xa5352e, NYL_W = 0x2e7d6e, CRIM = 0x7c2f2b, CRIM_CAP = 0xb02e26;
export var WARP_STEM = 0x1c5a4e, WARP_CAP = 0x259b87, SHROOM = 0xff9b50;
export var SOULSAND = 0x7a6650, SOIL = 0x584738, FOSSIL = 0xd8d0c0;
export var GRAVEL = 0x84817a, MAGMA = 0xc4661f, BASALT = 0x4a4a4f, BLACKSTONE = 0x232126;
// Overworld biome palette: sand, birch/spruce/acacia, snow, swamp, terracotta
export var SAND = 0xdbd3a0, SANDSTONE = 0xc8bb8a, CACTUS = 0x58a83a, BIRCH = 0xcfcfb8;
export var SPRUCE = 0x2d5a34, SNOW = 0xf4f8f8, ACACIA = 0xb0682e, ACACIA_LEAF = 0x7ab04a;
export var SWAMPW = 0x4a5a3a, LILY = 0x4a8a3a, MESA = 0x9a5a3a, MESA2 = 0xc47a4a;

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
  var trunk = box(1.2 * s, 6 * s, 1.2 * s, OAK); trunk.position.set(x, 2 * s, z); g.add(trunk);
  var leaves = box(5.5 * s, 5 * s, 5.5 * s, LEAF); leaves.position.set(x, 7 * s, z); g.add(leaves);
  var leaves2 = box(3.5 * s, 3 * s, 3.5 * s, LEAF2); leaves2.position.set(x, 10 * s, z); g.add(leaves2);
  var leaves3 = box(2 * s, 1.5 * s, 2 * s, LEAF); leaves3.position.set(x, 12 * s, z); g.add(leaves3);
}

export function torch(g, x, y, z) {
  var stick = box(0.5, 2, 0.5, OAK); stick.position.set(x, y, z); g.add(stick);
  var flame = box(0.45, 0.7, 0.45, GOLD, GOLD, 1); flame.position.set(x, y + 1.3, z); g.add(flame);
  g.add(glowLight(GOLD, 2, 20, x, y + 1.5, z));
}
