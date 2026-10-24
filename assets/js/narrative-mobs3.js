// Overworld hostiles/neutral + nether extras — box geometry. Compact.
import * as THREE from "../vendor/three.module.js";
import { M } from "./narrative-mobs.js";
function A(g, m, x, y, z) { m.position.set(x, y, z); g.add(m); return m; }
function L(g, list, mat) { list.forEach(function (p) { A(g, M(p[3] || mat[0], p[4] || mat[1], p[5] || mat[2], mat[3]), p[0], p[1], p[2]); }); }
function E(grp, g) { g.add(grp); return grp; }
function G() { return new THREE.Group(); }

export function spider(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(1.2, 0.6, 1.2, 0x1a1a1a), 0, 0.5, 0); A(r, M(0.6, 0.5, 0.6, 0x2a2a2a), 0, 0.6, 0.8);
  A(r, M(0.15, 0.1, 0.1, 0xd42020), -0.15, 0.7, 1.1); A(r, M(0.15, 0.1, 0.1, 0xd42020), 0.15, 0.7, 1.1);
  for (var l = 0; l < 8; l++) { var s = l < 4 ? -1 : 1, li = l % 4; var leg = M(0.1, 0.1, 1.0, 0x1a1a1a); leg.position.set(s * 0.7, 0.5, -0.4 + li * 0.35); leg.rotation.z = s * 0.4; leg.rotation.y = (li - 1.5) * 0.2; r.add(leg); }
  return E(r, g);
}
export function zombie(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(0.7, 1.0, 0.4, 0x3d6b3d), 0, 1.0, 0); A(r, M(0.55, 0.55, 0.55, 0x4a8a4a), 0, 1.8, 0);
  A(r, M(0.2, 0.1, 0.05, 0x1a1a1a), -0.12, 1.85, 0.3); A(r, M(0.2, 0.1, 0.05, 0x1a1a1a), 0.12, 1.85, 0.3);
  A(r, M(0.2, 0.8, 0.2, 0x3d6b3d), -0.55, 1.2, 0.3); A(r, M(0.2, 0.8, 0.2, 0x3d6b3d), 0.55, 1.2, 0.3);
  A(r, M(0.25, 0.9, 0.25, 0x2a4a2a), -0.2, 0.4, 0); A(r, M(0.25, 0.9, 0.25, 0x2a4a2a), 0.2, 0.4, 0);
  return E(r, g);
}
export function skeleton(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(0.6, 1.0, 0.3, 0xeeeeee), 0, 1.2, 0); A(r, M(0.5, 0.5, 0.5, 0xeeeeee), 0, 2.0, 0);
  A(r, M(0.15, 0.1, 0.08, 0x1a1a1a), -0.12, 2.0, 0.28); A(r, M(0.15, 0.1, 0.08, 0x1a1a1a), 0.12, 2.0, 0.28);
  A(r, M(0.12, 0.9, 0.12, 0xeeeeee), -0.45, 1.3, 0); A(r, M(0.12, 0.9, 0.12, 0xeeeeee), 0.45, 1.3, 0);
  A(r, M(0.12, 0.9, 0.12, 0xeeeeee), -0.15, 0.45, 0); A(r, M(0.12, 0.9, 0.12, 0xeeeeee), 0.15, 0.45, 0);
  var bow = M(0.08, 1.0, 0.08, 0x6a4a2a); bow.position.set(0.5, 1.3, 0.2); bow.rotation.z = -0.2; r.add(bow);
  return E(r, g);
}
export function creeper(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(0.7, 1.2, 0.5, 0x3d8c3d), 0, 1.0, 0); A(r, M(0.7, 0.7, 0.7, 0x4caf50), 0, 1.9, 0);
  A(r, M(0.2, 0.2, 0.1, 0x0a0a0a), -0.15, 2.0, 0.38); A(r, M(0.2, 0.2, 0.1, 0x0a0a0a), 0.15, 2.0, 0.38);
  A(r, M(0.3, 0.3, 0.1, 0x0a0a0a), 0, 1.7, 0.38);
  L(r, [[-0.2, 0.3, -0.1], [0.2, 0.3, -0.1], [-0.2, 0.3, 0.2], [0.2, 0.3, 0.2]], [0.25, 0.6, 0.25, 0x3d8c3d]);
  return E(r, g);
}
export function ironGolem(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(1.2, 1.4, 0.8, 0xc8c8c8), 0, 1.4, 0); A(r, M(0.7, 0.7, 0.7, 0xd4d4d4), 0, 2.5, 0);
  A(r, M(0.15, 0.1, 0.08, 0xd42020), -0.15, 2.5, 0.38); A(r, M(0.15, 0.1, 0.08, 0xd42020), 0.15, 2.5, 0.38);
  A(r, M(0.3, 0.15, 0.1, 0xb0b0b0), 0, 2.3, 0.38);
  A(r, M(0.35, 1.2, 0.35, 0xb0b0b0), -0.85, 1.5, 0); A(r, M(0.35, 1.2, 0.35, 0xb0b0b0), 0.85, 1.5, 0);
  A(r, M(0.4, 0.8, 0.4, 0xa0a0a0), -0.35, 0.4, 0); A(r, M(0.4, 0.8, 0.4, 0xa0a0a0), 0.35, 0.4, 0);
  A(r, M(0.15, 0.8, 0.15, 0x2d7a1e), 0.3, 1.8, 0.45); return E(r, g);
}
export function snowGolem(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(0.8, 0.8, 0.8, 0xeeeeee), 0, 0.4, 0); A(r, M(0.6, 0.6, 0.6, 0xeeeeee), 0, 1.1, 0); A(r, M(0.5, 0.5, 0.5, 0xeeeeee), 0, 1.7, 0);
  A(r, M(0.12, 0.12, 0.08, 0x1a1a1a), -0.12, 1.75, 0.28); A(r, M(0.12, 0.12, 0.08, 0x1a1a1a), 0.12, 1.75, 0.28);
  A(r, M(0.1, 0.1, 0.25, 0xff8c00), 0, 1.65, 0.35);
  A(r, M(0.15, 0.15, 0.15, 0x8b4513), -0.5, 1.1, 0); A(r, M(0.15, 0.15, 0.15, 0x8b4513), 0.5, 1.1, 0);
  return E(r, g);
}
export function slime(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  var o = M(1.2, 1.2, 1.2, 0x6bc46b); o.material.transparent = true; o.material.opacity = 0.7; o.position.y = 0.6; r.add(o);
  A(r, M(0.8, 0.8, 0.8, 0x4a9a4a), 0, 0.6, 0);
  A(r, M(0.15, 0.15, 0.1, 0x1a1a1a), -0.2, 0.7, 0.6); A(r, M(0.15, 0.15, 0.1, 0x1a1a1a), 0.2, 0.7, 0.6);
  A(r, M(0.3, 0.1, 0.1, 0x1a1a1a), 0, 0.4, 0.6);
  r.userData.pulse = Math.random() * 6; return E(r, g);
}
export function witch(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(0.7, 1.2, 0.5, 0x3a2a4a), 0, 1.0, 0); A(r, M(0.55, 0.55, 0.55, 0xc4956a), 0, 1.9, 0);
  A(r, M(0.15, 0.3, 0.12, 0xb4855a), 0, 1.8, 0.35);
  A(r, M(0.6, 0.15, 0.6, 0x2a1a3a), 0, 2.2, 0); A(r, M(0.35, 0.5, 0.35, 0x2a1a3a), 0, 2.5, 0);
  A(r, M(0.12, 0.6, 0.12, 0xc4956a), -0.55, 1.2, 0); A(r, M(0.12, 0.6, 0.12, 0xc4956a), 0.55, 1.2, 0);
  A(r, M(0.2, 0.3, 0.2, 0x17dd62), 0.65, 1.2, 0.2);
  L(r, [[-0.2, 0.4, 0], [0.2, 0.4, 0]], [0.22, 0.8, 0.22, 0x2a1a3a]);
  return E(r, g);
}
export function pillager(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(0.7, 1.0, 0.45, 0x5a5a5a), 0, 1.0, 0); A(r, M(0.55, 0.55, 0.55, 0x8a8a8a), 0, 1.8, 0);
  A(r, M(0.15, 0.1, 0.06, 0xd42020), -0.12, 1.85, 0.3); A(r, M(0.15, 0.1, 0.06, 0xd42020), 0.12, 1.85, 0.3);
  A(r, M(0.5, 0.12, 0.5, 0x3a3a3a), 0, 2.15, 0); A(r, M(0.2, 0.7, 0.2, 0x5a5a5a), -0.55, 1.1, 0);
  A(r, M(0.1, 0.6, 0.4, 0x6a4a2a), 0.55, 1.2, 0.2);
  L(r, [[-0.2, 0.4, 0], [0.2, 0.4, 0]], [0.22, 0.8, 0.22, 0x4a4a4a]);
  return E(r, g);
}
export function drowned(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(0.7, 1.0, 0.4, 0x3a6a7a), 0, 1.0, 0); A(r, M(0.55, 0.55, 0.55, 0x4a9aaa), 0, 1.8, 0);
  A(r, M(0.2, 0.1, 0.05, 0x1a3a3a), -0.12, 1.85, 0.3); A(r, M(0.2, 0.1, 0.05, 0x1a3a3a), 0.12, 1.85, 0.3);
  A(r, M(0.2, 0.8, 0.2, 0x3a6a7a), -0.55, 1.2, 0.3); A(r, M(0.2, 0.8, 0.2, 0x3a6a7a), 0.55, 1.2, 0.3);
  A(r, M(0.25, 0.9, 0.25, 0x2a5a6a), -0.2, 0.4, 0); A(r, M(0.25, 0.9, 0.25, 0x2a5a6a), 0.2, 0.4, 0);
  return E(r, g);
}
export function phantom(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(1.2, 0.4, 2.0, 0x2a2a4a), 0, 0, 0); A(r, M(0.5, 0.4, 0.5, 0x1a1a3a), 0, 0.1, 1.2);
  A(r, M(0.12, 0.1, 0.08, 0x17dd62), -0.12, 0.15, 1.4); A(r, M(0.12, 0.1, 0.08, 0x17dd62), 0.12, 0.15, 1.4);
  var wl = M(3.5, 0.1, 1.5, 0x1a1a3a); wl.position.set(-2.0, 0.2, 0); wl.rotation.z = 0.25; r.add(wl);
  var wr = M(3.5, 0.1, 1.5, 0x1a1a3a); wr.position.set(2.0, 0.2, 0); wr.rotation.z = -0.25; r.add(wr);
  r.userData.float = Math.random() * Math.PI * 2; return E(r, g);
}
export function warden(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(1.0, 1.6, 0.6, 0x0a2a2a), 0, 1.6, 0); A(r, M(0.7, 0.7, 0.7, 0x0a3a3a), 0, 2.7, 0);
  A(r, M(0.3, 0.2, 0.15, 0x17dd62), -0.15, 2.75, 0.4); A(r, M(0.3, 0.2, 0.15, 0x17dd62), 0.15, 2.75, 0.4);
  A(r, M(0.25, 0.4, 0.2, 0x17dd62), -0.35, 3.0, 0.1); A(r, M(0.25, 0.4, 0.2, 0x17dd62), 0.35, 3.0, 0.1);
  A(r, M(0.3, 1.4, 0.3, 0x0a2a2a), -0.75, 1.7, 0); A(r, M(0.3, 1.4, 0.3, 0x0a2a2a), 0.75, 1.7, 0);
  L(r, [[-0.3, 0.5, 0], [0.3, 0.5, 0]], [0.35, 1.0, 0.35, 0x0a1a1a]);
  A(r, M(0.5, 0.2, 0.5, 0x17dd62), 0, 1.6, 0.35); r.userData.pulse = 0; return E(r, g);
}
export function guardian(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(1.0, 0.8, 1.2, 0x6aaa7a), 0, 0.5, 0); A(r, M(0.6, 0.5, 0.5, 0x8acaaa), 0, 0.6, 0.8);
  A(r, M(0.15, 0.15, 0.1, 0xd4a020), 0, 0.7, 1.05);
  for (var s = 0; s < 8; s++) { var a = s * Math.PI / 4; var sp = M(0.1, 0.6, 0.1, 0x4a8a5a); sp.position.set(Math.cos(a) * 0.6, 0.5, Math.sin(a) * 0.6); sp.rotation.z = Math.cos(a) * 0.3; r.add(sp); }
  A(r, M(0.12, 0.12, 0.8, 0x6aaa7a), 0, 0.5, -0.9); return E(r, g);
}
// Nether extras
export function strider(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(0.9, 0.7, 1.2, 0xaa3333), 0, 1.2, 0); A(r, M(0.5, 0.45, 0.4, 0xaa3333), 0, 1.6, 0.7);
  A(r, M(0.1, 0.1, 0.06, 0x1a1a1a), -0.12, 1.65, 0.9); A(r, M(0.1, 0.1, 0.06, 0x1a1a1a), 0.12, 1.65, 0.9);
  L(r, [[-0.25, 0.6, -0.3], [0.25, 0.6, -0.3], [-0.25, 0.6, 0.3], [0.25, 0.6, 0.3]], [0.1, 1.2, 0.1, 0x8a2a2a]);
  A(r, M(0.3, 0.15, 0.5, 0x6a4a2a), 0, 1.8, 0); return E(r, g);
}
export function piglinBrute(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(0.9, 1.1, 0.6, 0x8a6a4a), 0, 1.0, 0); A(r, M(0.7, 0.65, 0.65, 0xa08060), 0, 1.9, 0);
  A(r, M(0.35, 0.25, 0.25, 0x8a6a4a), 0, 1.75, 0.4);
  A(r, M(0.15, 0.3, 0.1, 0xa08060), -0.3, 2.2, 0); A(r, M(0.15, 0.3, 0.1, 0xa08060), 0.3, 2.2, 0);
  var axe = M(0.15, 1.2, 0.15, 0x6a4a2a); axe.position.set(0.65, 1.2, 0.2); axe.rotation.z = -0.3; r.add(axe);
  A(r, M(0.4, 0.3, 0.15, 0x8a8a8a), 0.85, 1.8, 0.2);
  L(r, [[-0.2, 0.35, 0], [0.2, 0.35, 0]], [0.25, 0.7, 0.25, 0x4a3328]);
  return E(r, g);
}
export function zombifiedPiglin(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(0.7, 1.0, 0.4, 0x5a8a5a), 0, 1.0, 0); A(r, M(0.55, 0.55, 0.55, 0x6a9a6a), 0, 1.8, 0);
  A(r, M(0.3, 0.2, 0.15, 0xc4956a), 0, 1.7, 0.35);
  A(r, M(0.12, 0.2, 0.08, 0xc4956a), -0.22, 2.0, 0); A(r, M(0.12, 0.2, 0.08, 0xc4956a), 0.22, 2.0, 0);
  A(r, M(0.2, 0.8, 0.2, 0x5a8a5a), -0.55, 1.2, 0.3); A(r, M(0.2, 0.8, 0.2, 0x5a8a5a), 0.55, 1.2, 0.3);
  L(r, [[-0.2, 0.4, 0], [0.2, 0.4, 0]], [0.25, 0.9, 0.25, 0x4a7a4a]);
  return E(r, g);
}
export function endermite(g, x, y, z) {
  var r = G(); r.position.set(x, y, z);
  A(r, M(0.5, 0.3, 0.7, 0x4a2a5a), 0, 0.2, 0); A(r, M(0.3, 0.25, 0.3, 0x5a3a6a), 0, 0.35, 0.4);
  A(r, M(0.06, 0.06, 0.04, 0xd420d4), -0.08, 0.4, 0.55); A(r, M(0.06, 0.06, 0.04, 0xd420d4), 0.08, 0.4, 0.55);
  for (var l = 0; l < 6; l++) { var s = l < 3 ? -1 : 1; A(r, M(0.06, 0.2, 0.06, 0x3a1a4a), s * 0.3, 0.1, -0.2 + (l % 3) * 0.2); }
  return E(r, g);
}
