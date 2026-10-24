// Nether zone — heavy Minecraft terrain detail. The End lives in narrative-end.js.
import {
  GOLD, NETHERRACK, LAVA, GLOWSTONE, SOUL, WARP, box, glowLight, torch,
} from "./narrative-blocks.js";
import { piglin, hoglin, ghast, magmaCube, blaze, witherSkeleton } from "./narrative-mobs.js";
import { strider, piglinBrute, zombifiedPiglin } from "./narrative-mobs3.js";

function P(g, m, x, y, z) { m.position.set(x, y, z); g.add(m); return m; }
function fx(g, c, n, x0, span, yMax, zSpan) {
  for (var i = 0; i < n; i++) { var p = P(g, box(0.35, 0.45, 0.35, c, c, 1), x0 + Math.random() * span, Math.random() * yMax, (Math.random() - 0.5) * zSpan); p.userData.float = Math.random() * Math.PI * 2; }
}

export function buildNether(g) {
  // Shell: ceiling + walls (netherrack). Floor top sits at y=-2 and reaches back under the
  // overworld grass (x36..200) so the two never share a coplanar face — that seam was z-fighting.
  P(g, box(160, 4, 80, NETHERRACK), 120, 22, 10); P(g, box(164, 4, 80, NETHERRACK), 118, -4, 10);
  P(g, box(160, 24, 4, NETHERRACK), 120, 9, -28); P(g, box(160, 24, 4, NETHERRACK), 120, 9, 48);
  // Entry face sealed with a doorway (z 14..30, y -1..16) so no overworld sky leaks through
  P(g, box(4, 24, 44, NETHERRACK), 40, 9, -8); P(g, box(4, 24, 20, NETHERRACK), 40, 9, 40);
  P(g, box(4, 7, 16, NETHERRACK), 40, 19.5, 22);
  // Exit face sealed with a doorway (z 16..36) — the dive flies straight through it.
  // Without this the shell was open at x=200 and you saw the blue sky straight through the nether.
  P(g, box(4, 24, 46, NETHERRACK), 202, 9, -7); P(g, box(4, 24, 14, NETHERRACK), 202, 9, 43);
  P(g, box(4, 7, 20, NETHERRACK), 202, 19.5, 26);
  torch(g, 42.6, 0, 16); torch(g, 42.6, 0, 28);
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
    // pillars stop exactly where the cross-beam starts (no shared faces)
    P(g, box(3.5, 16.75, 3.5, FB), px, 7.375, -7); P(g, box(3.5, 16.75, 3.5, FB), px, 7.375, 7);
    P(g, box(3.5, 2.5, 17, FB), px, 17, 0);
    for (var b = 0; b < 4; b++) P(g, box(1.5, 1.5, 1.5, FB), px, 19, -6 + b * 4);
  }
  P(g, box(170, 1.5, 5, FB), 120, 3.5, 0);
  for (var ss = 0; ss < 5; ss++) P(g, box(4, 0.5, 4, 0x4a3a2a), 70 + ss * 25, -0.5, ss % 2 ? -12 : 12);
  // Bastion remnant (blackstone) — kept at z -18, clear of the camera path.
  // Stepped footprint per segment so no two boxes share a side plane (nested boxes z-fought).
  var SZ = [4, 3.4, 2.8];
  var BK = 0x2a2a2e;
  for (var bb = 0; bb < 3; bb++) P(g, box(SZ[bb], bb ? 2 : 8, SZ[bb], BK), 168, bb ? 6 + bb * 2 : 3, -18);
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

// The End (island, pillars, crystals, city, gateway, boss) lives in its own module.
export { buildEnd } from "./narrative-end.js";
