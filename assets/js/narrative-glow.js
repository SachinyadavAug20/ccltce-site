// Wiki-accurate detail pass: shroomlights, soul fire, ores, hanging lanterns, glow squids, chorus.
import {
  GLOWSTONE, END_ROD, AMETH, PURPUR, box, glowLight,
} from "./narrative-blocks.js";

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

function chorus(g, x, y, z, k) {       // chorus plant + flower (wiki: purpur stems, amethyst bloom)
  for (var s = 0; s < 3; s++) P(g, box(0.6 * k, 1.4 * k, 0.6 * k, PURPUR), x + (s % 2) * 0.5 * k, y + s * 1.3 * k, z);
  P(g, box(1.2 * k, 1.2 * k, 1.2 * k, AMETH, AMETH, 0.45), x + 0.4 * k, y + 3.6 * k, z);
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
  for (var i = 0; i < 6; i++) glowSquid(g, 176 + (i * 9) % 46, -16 + (i % 3) * 5, 2 + (i * 13) % 40);
  var beds = [[184, 44], [190, 8], [195, 44], [213, 28], [217, 41], [206, 6], [199, 50]];
  beds.forEach(function (b) { chorus(g, b[0], b[1] > 37.5 ? -27.9 : -26.5, b[1], 1 + (b[0] % 3) * 0.2); });
  for (var r = 0; r < 8; r++) {        // end rod clusters low on the island
    var rx = 178 + (r * 7) % 44, rz = -6 + (r * 11) % 52;
    P(g, box(0.3, 1.8, 0.3, END_ROD, END_ROD, 1), rx, -25.6, rz);
    P(g, box(0.7, 0.7, 0.7, END_ROD, END_ROD, 1), rx, -24.4, rz);
    if (r % 2) g.add(glowLight(END_ROD, 9, 15, rx, -24.4, rz));
  }
  [[160, -18, -8], [158, -10, 46], [240, -16, -6], [244, -8, 44], [236, -20, 20]].forEach(function (s) {
    P(g, box(1.6, 1.6, 1.6, GLOWSTONE, GLOWSTONE, 0.9), s[0], s[1], s[2]);
    g.add(glowLight(GLOWSTONE, 10, 18, s[0], s[1], s[2]));
  });
}

export function buildGlow(g) { netherGlow(g); endGlow(g); }
