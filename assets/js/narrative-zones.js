// Nether + End zones — heavy Minecraft terrain detail. Compact.
import * as THREE from "../vendor/three.module.js";
import {
  GOLD, NETHERRACK, LAVA, GLOWSTONE, ENDSTONE, OBSIDIAN, PURPUR, END_ROD,
  SOUL, WARP, AMETH, box, glowLight,
} from "./narrative-blocks.js";
import { piglin, hoglin, ghast, magmaCube, blaze, witherSkeleton } from "./narrative-mobs.js";
import { strider, piglinBrute, zombifiedPiglin, endermite } from "./narrative-mobs3.js";
import { enderman, shulker, enderDragon } from "./narrative-endmobs.js";

function P(g, m, x, y, z) { m.position.set(x, y, z); g.add(m); return m; }
function fx(g, c, n, x0, span, yMax, zSpan) {
  for (var i = 0; i < n; i++) { var p = P(g, box(0.35, 0.45, 0.35, c, c, 1), x0 + Math.random() * span, Math.random() * yMax, (Math.random() - 0.5) * zSpan); p.userData.float = Math.random() * Math.PI * 2; }
}

export function buildNether(g) {
  // Shell: floor, ceiling, walls (netherrack)
  P(g, box(160, 4, 80, NETHERRACK), 120, 22, 10); P(g, box(160, 4, 80, NETHERRACK), 120, -3, 10);
  P(g, box(160, 24, 4, NETHERRACK), 120, 9, -28); P(g, box(160, 24, 4, NETHERRACK), 120, 9, 48);
  // Basalt delta pillars
  var B = 0x3a3a3e;
  for (var bp = 0; bp < 10; bp++) { var bx = 48 + bp * 15, bz = (bp % 2 ? -18 : 32); P(g, box(3 + (bp % 3), 12 + (bp % 4) * 3, 3 + (bp % 3), B), bx, 4 + (bp % 4) * 1.5, bz); }
  // Blackstone boulders + ancient debris
  for (var bl = 0; bl < 8; bl++) P(g, box(2, 1.5 + (bl % 3), 2, 0x1a1a1e), 52 + bl * 15, 0.5, (bl % 3 - 1) * 14);
  P(g, box(1.2, 1.2, 1.2, 0x6a3a2a, 0x6a3a2a, 0.2), 92, 2, -6); P(g, box(1.2, 1.2, 1.2, 0x6a3a2a, 0x6a3a2a, 0.2), 148, 2, 14);
  // Lava lakes + falls
  for (var i = 0; i < 8; i++) {
    var lz = i % 2 ? 10 : -10;
    P(g, box(12 + (i % 4) * 5, 0.6, 10, LAVA, LAVA, 0.9), 50 + i * 20, -0.5, lz);
    g.add(glowLight(LAVA, 2.5, 30, 50 + i * 20, 1, lz));
    if (i % 2 === 0) P(g, box(1.5, 8 + (i % 3) * 2, 0.5, LAVA, LAVA, 0.9), 55 + i * 20, 5, -24);
  }
  // Glowstone clusters on ceiling
  for (var gs = 0; gs < 14; gs++) {
    var gx = 45 + gs * 12, gz = (gs % 4 - 1.5) * 12;
    P(g, box(2.5, 2, 2.5, GLOWSTONE, GLOWSTONE, 0.9), gx, 18 + (gs % 3), gz);
    P(g, box(1.5, 1, 1.5, GLOWSTONE, GLOWSTONE, 0.9), gx + 1.5, 17.5, gz);
    g.add(glowLight(GLOWSTONE, 1.5, 22, gx, 17, gz));
  }
  // Nether wart farm + crimson + warped forests
  P(g, box(8, 0.5, 4, 0x5a1a1a), 90, 0.3, 8);
  for (var w2 = 0; w2 < 6; w2++) P(g, box(0.5, 0.8 + (w2 % 3) * 0.4, 0.5, 0xaa1111), 87 + w2 * 1.2, 0.8, 8);
  for (var w = 0; w < 10; w++) {
    var wz = w % 2 ? -16 : 34;
    P(g, box(0.7, 4 + (w % 3), 0.7, WARP), 55 + w * 15, 2, wz);
    P(g, box(3, 1.2, 3, SOUL, SOUL, 0.25), 55 + w * 15, 4.5 + (w % 3), wz);
  }
  for (var c = 0; c < 6; c++) {
    var cz = c % 2 ? -14 : 14;
    P(g, box(0.6, 3, 0.6, 0x8b2222), 100 + c * 14, 1.5, cz);
    P(g, box(2.5, 1, 2.5, 0xcc3333), 100 + c * 14, 3.5, cz);
  }
  // Fortress: pillars, battlements, walkway, nether brick roof
  var FB = 0x2a1520;
  for (var f = 0; f < 6; f++) {
    var px = 60 + f * 28;
    P(g, box(3.5, 18, 3.5, FB), px, 8, -7); P(g, box(3.5, 18, 3.5, FB), px, 8, 7);
    P(g, box(3.5, 2.5, 17, FB), px, 17, 0);
    for (var b = 0; b < 4; b++) P(g, box(1.5, 1.5, 1.5, FB), px, 19, -6 + b * 4);
  }
  P(g, box(170, 1.5, 5, FB), 120, 3.5, 0);
  for (var ss = 0; ss < 5; ss++) P(g, box(4, 0.5, 4, 0x4a3a2a), 70 + ss * 25, -0.5, ss % 2 ? -12 : 12);
  // Bastion remnant (blackstone) — kept at z -18, clear of the camera path
  var BK = 0x2a2a2e;
  for (var bb = 0; bb < 4; bb++) P(g, box(4, 8 + bb * 2, 4, BK), 168, 3 + bb, -18);
  P(g, box(18, 2, 12, BK), 168, 12, -18); P(g, box(12, 3, 8, 0x1a1a1e), 168, 14.5, -18);
  P(g, box(6, 5, 6, GOLD, GOLD, 0.3), 168, 17, -18);
  g.add(glowLight(GOLD, 2, 30, 168, 18, -18));
  // Mobs
  piglin(g, 55, 4, -4); piglin(g, 95, 4, 5); piglin(g, 140, 4, -3);
  piglinBrute(g, 152, 4, 14); piglinBrute(g, 110, 4, 0);
  hoglin(g, 75, 4, 8); hoglin(g, 130, 4, -8);
  zombifiedPiglin(g, 62, 4, 6); zombifiedPiglin(g, 105, 4, -7); zombifiedPiglin(g, 158, 4, 2);
  ghast(g, 100, 16, -10); ghast(g, 150, 14, 12);
  magmaCube(g, 65, 4, 4); magmaCube(g, 115, 4, -5); magmaCube(g, 155, 4, 6);
  blaze(g, 85, 14, -3); blaze(g, 145, 15, 4);
  witherSkeleton(g, 70, 4, -2); witherSkeleton(g, 125, 4, 3); witherSkeleton(g, 160, 4, -4);
  strider(g, 78, 2, 10); strider(g, 132, 2, -10); strider(g, 95, 2, 10);
  fx(g, SOUL, 25, 45, 150, 20, 35); fx(g, LAVA, 15, 50, 140, 15, 30);
  g.add(glowLight(0xff6622, 2, 100, 100, 5, 0)); g.add(glowLight(LAVA, 1.5, 70, 80, 0, 5));
}

export function buildEnd(g) {
  // Main island: jagged base + top
  P(g, box(70, 4, 70, ENDSTONE), 200, -30, 20);
  for (var j = 0; j < 20; j++) { var ch = P(g, box(4 + Math.random() * 4, 2, 4 + Math.random() * 4, ENDSTONE), 200 + (Math.random() - 0.5) * 75, -31, 20 + (Math.random() - 0.5) * 75); ch.rotation.y = Math.random(); }
  P(g, box(35, 2, 35, ENDSTONE), 200, -27.5, 20);
  // Outer islands
  for (var oi = 0; oi < 6; oi++) {
    var oa = oi * Math.PI / 3;
    var is = P(g, box(12, 3, 12, ENDSTONE), 200 + Math.cos(oa) * 55, -28 + (oi % 3) * 2, 20 + Math.sin(oa) * 55);
    is.rotation.y = oa;
  }
  // Obsidian pillars + iron cages + end crystals + beacon beams
  var pillars = [[-22, -22], [22, -22], [-22, 22], [22, 22], [0, -28], [0, 28], [-28, 0], [28, 0]];
  pillars.forEach(function (pp, pi) {
    var h = 18 + pi * 2;
    P(g, box(3.5, h, 3.5, OBSIDIAN), 200 + pp[0], -28 + h / 2, 20 + pp[1]);
    for (var cage = 0; cage < 4; cage++) { var ca = cage * Math.PI / 2; P(g, box(0.15, 3, 0.15, 0x8a8a8a), 200 + pp[0] + Math.cos(ca) * 1.2, -25 + h, 20 + pp[1] + Math.sin(ca) * 1.2); }
    var crystal = P(g, box(1.8, 2.5, 1.8, END_ROD, END_ROD, 1), 200 + pp[0], -25.5 + h, 20 + pp[1]);
    crystal.userData.pulse = pi * 0.9;
    P(g, box(0.3, 40, 0.3, END_ROD, END_ROD, 0.6), 200 + pp[0], -5 + h / 2, 20 + pp[1]);
    g.add(glowLight(END_ROD, 2.5, 30, 200 + pp[0], -24 + h, 20 + pp[1]));
  });
  // Chorus plants + forest
  fx(g, END_ROD, 16, 180, 40, 15, 30);
  for (var ch2 = 0; ch2 < 10; ch2++) {
    var cx = 182 + ch2 * 4, cz = 8 + (ch2 % 3) * 12;
    P(g, box(0.7, 2 + (ch2 % 3), 0.7, PURPUR), cx, -26 + (ch2 % 3) / 2, cz);
    P(g, box(1.3, 1.3, 1.3, AMETH, AMETH, 0.3), cx, -24.5 + (ch2 % 3), cz);
  }
  // End city towers + end ship
  for (var pp2 = 0; pp2 < 4; pp2++) {
    var ppx = 190 + pp2 * 7;
    P(g, box(2, 10 + pp2 * 2, 2, PURPUR), ppx, -22 + pp2, 35);
    P(g, box(2.5, 1, 2.5, 0xc4b4d4), ppx, -16.5 + pp2 * 3, 35);
  }
  // End ship (floating purpur hull with end rod mast)
  P(g, box(8, 2, 4, PURPUR), 210, -12, 40); P(g, box(6, 1.5, 3, 0xc4b4d4), 210, -10.5, 40);
  P(g, box(0.4, 6, 0.4, END_ROD, END_ROD, 0.8), 210, -7, 40); P(g, box(3, 2, 0.2, END_ROD, END_ROD, 0.6), 210, -5, 40);
  P(g, box(1.5, 1.5, 1.5, AMETH, AMETH, 0.5), 214, -12, 40);
  g.add(glowLight(AMETH, 1.5, 25, 214, -11, 40));
  // End gateway portal frame (obsidian mini-pillars)
  P(g, box(5, 0.5, 5, OBSIDIAN), 200, -26.5, 20);
  [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(function (gp) {
    P(g, box(0.5, 4, 0.5, OBSIDIAN), 200 + gp[0], -24.5, 20 + gp[1]);
  });
  var portal = P(g, box(3, 3, 0.3, AMETH, AMETH, 0.9), 200, -24, 20);
  portal.userData.pulse = 1; portal.userData.endPortal = true;
  // Endermites + endermen + shulkers + dragon
  fx(g, AMETH, 30, 175, 50, 20, 40);
  enderman(g, 190, -26, 32); enderman(g, 210, -26, 32); enderman(g, 195, -26, 8);
  enderman(g, 205, -26, 8); enderman(g, 215, -26, 25);
  endermite(g, 197, -26, 30); endermite(g, 203, -26, 12);
  shulker(g, 193, -26, 35); shulker(g, 207, -26, 35); shulker(g, 200, -26, 10);
  enderDragon(g, 200, -5, 20);
  g.add(glowLight(AMETH, 2, 80, 200, -15, 20));
  g.add(glowLight(END_ROD, 1.5, 50, 200, -10, 20));
  g.add(glowLight(0x6a0dad, 1, 40, 200, -25, 20));
}
