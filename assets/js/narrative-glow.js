// Wiki-accurate detail pass: shroomlights, soul fire, ores, hanging lanterns, glow squids, chorus.
import { END_ROD, box, glowLight } from "./narrative-blocks.js";

function P(g, m, x, y, z) { m.position.set(x, y, z); g.add(m); return m; }

function shroom(g, x, y, z) {           // shroomlight — wiki light level 15, #d3852b
  P(g, box(1.4, 1.4, 1.4, 0xd3852b, 0xd3852b, 0.95), x, y, z);
  g.add(glowLight(0xd3852b, 16, 20, x, y, z));
}

function flame(g, c, i, d, x, y, z) {   // voxel fire / soul fire tongue
  P(g, box(0.7, 1.1, 0.7, c, c, 1), x, y, z);
  P(g, box(0.4, 0.7, 0.4, 0xffffff, c, 1), x + 0.2, y + 0.7, z);
  g.add(glowLight(c, i, d, x, y + 0.5, z));
}

function lantern(g, x, z) {            // chain + lantern hanging from the nether ceiling
  P(g, box(0.15, 3, 0.15, 0x3a3a3a), x, 18.5, z);
  P(g, box(1, 1.4, 1, 0xff9d4d, 0xff9d4d, 0.85), x, 16.5, z);
  P(g, box(1.3, 0.3, 1.3, 0x2a2a2a), x, 17.4, z);
  g.add(glowLight(0xff9d4d, 18, 24, x, 16.4, z));
}

function glowSquid(g, x, y, z) {        // bioluminescent — the End light source users asked for
  var b = P(g, box(1.7, 1.7, 3.4, 0x1d9fa8, 0x2ee6d0, 0.75), x, y, z);
  b.userData.float = Math.random() * 6.28;
  for (var t = 0; t < 4; t++) {
    var tq = P(g, box(0.4, 1.6, 0.4, 0x1d9fa8, 0x2ee6d0, 0.55), x + (t % 2 ? 0.55 : -0.55), y - 1.3, z + (t < 2 ? -1.1 : 1.1));
    tq.userData.float = b.userData.float + t;
  }
  g.add(glowLight(0x2ee6d0, 12, 16, x, y, z));
}

function netherGlow(g) {
  for (var c = 0; c < 6; c++) shroom(g, 100 + c * 14, 4.9, c % 2 ? -14 : 14);
  for (var w = 0; w < 10; w += 2) shroom(g, 55 + w * 15, 6.1 + (w % 3), w % 2 ? -16 : 34);
  for (var s = 0; s < 8; s++) {        // soul fire patch on the front wall shelf
    var sx = 96 + (s % 4) * 4, sz = 38 + Math.floor(s / 4) * 4;
    P(g, box(3.6, 1, 3.6, 0x4b3626), sx, -0.4, sz);
    if (s % 3 !== 2) flame(g, 0x2e8bff, 7, 13, sx + 0.6, 0.6, sz + 0.6);
  }
  for (var o = 0; o < 18; o++) {       // nether quartz + gold ore specks
    var ox = 47 + o * 8.6, wall = o % 2;
    P(g, box(0.7, 0.7, 0.7, o % 3 ? 0xe8e4d8 : 0xfcee4b, o % 3 ? 0x555544 : 0x8a7a10, 0.35),
      ox, wall ? 3 + (o % 5) * 3.4 : -0.6, wall ? -25.6 : 30 + (o % 3) * 5);
  }
  for (var l = 0; l < 6; l++) lantern(g, 52 + l * 26, 26);
  for (var f = 0; f < 9; f++) flame(g, 0xff7a1a, 6, 14, 60 + f * 16, -0.4, f % 2 ? -25.6 : 45.6);
}

function endGlow(g) {
  var D = 100;
  // 4 glow squids just outside the dragon ring (was 6 scattered + void glowstone)
  [[176, 10], [224, 4], [182, 40], [228, 34]].forEach(function (s) { glowSquid(g, s[0], -14 - D, s[1]); });
  for (var r = 0; r < 5; r++) {        // end rod clusters low on the island
    var rx = 178 + (r * 7) % 44, rz = 2 + (r * 9) % 38;
    P(g, box(0.3, 1.8, 0.3, END_ROD, END_ROD, 1), rx, -25.6 - D, rz);
    P(g, box(0.7, 0.7, 0.7, END_ROD, END_ROD, 1), rx, -24.4 - D, rz);
    if (r % 2) g.add(glowLight(END_ROD, 9, 15, rx, -24.4 - D, rz));
  }
}

export function buildGlow(g) { netherGlow(g); endGlow(g); }
