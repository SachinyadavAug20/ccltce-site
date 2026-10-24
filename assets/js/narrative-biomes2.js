// Soul sand valley + basalt deltas — the two mineral Nether biomes (wiki features).
import { box, glowLight, LAVA, SOUL, SOULSAND, SOIL, FOSSIL, GRAVEL, MAGMA, BASALT, BLACKSTONE } from "./narrative-blocks.js";

function P(g, m, x, y, z) { m.position.set(x, y, z); g.add(m); return m; }
function b(g, w, h, d, c, x, y, z, e) { return P(g, box(w, h, d, c, e, e ? 0.8 : 0), x, y, z); }
function patch(g, w, d, c, x, z) { b(g, w, 1, d, c, x, -2, z); }               // top pokes out at y=-1.5

function spire(g, x, z, h, w) { b(g, w, h, w, BASALT, x, -2 + h / 2, z); }     // basalt columns on the floor

export function soulValley(g) {
  // left x124..154 (bastion owns x159..177) / right x86..122
  patch(g, 9, 8, SOULSAND, 130, -21.5); patch(g, 8, 7, SOIL, 145, -22);
  patch(g, 10, 7, SOULSAND, 94, 41); patch(g, 8, 8, SOIL, 112, 39);
  [[127, -24.5, 12], [137, -20, 9], [148, -24.5, 14], [152, -21, 7], [90, 44, 11], [101, 43, 8], [116, 44, 13], [120, 40, 6]]
    .forEach(function (s) { spire(g, s[0], s[1], s[2], 2 + (s[2] % 3)); });     // basalt spires
  [[130, -21.5], [145, -22], [94, 41], [112, 39]].forEach(function (f) {         // soul fire on the sand
    b(g, 0.6, 0.6, 0.6, SOUL, f[0], -1.2, f[1], SOUL); b(g, 0.4, 0.4, 0.4, SOUL, f[0] + 1.6, -1.3, f[1] + 1.4, SOUL);
    g.add(glowLight(SOUL, 1.4, 12, f[0], 0, f[1]));
  });
  b(g, 4, 0.5, 3, LAVA, 140, -1.75, 6, LAVA);                                 // lava pocket, bare floor
  // Nether fossil: spine + rib arches on the valley floor (visible from the path)
  b(g, 7, 0.7, 0.7, FOSSIL, 138, -1.6, 10);
  for (var r = 0; r < 4; r++) {
    var rx = 135.5 + r * 1.7;
    b(g, 0.5, 1.7, 0.5, FOSSIL, rx, -1.15, 9.3); b(g, 0.5, 1.7, 0.5, FOSSIL, rx, -1.15, 10.7);
    b(g, 0.5, 0.5, 1.9, FOSSIL, rx, 0.05, 10);                                // rib top, arches spaced in x
  }
}

export function basaltDeltas(g) {
  // left x179..196 (past the bastion) / right x46..84
  patch(g, 9, 7, GRAVEL, 186, -22); patch(g, 8, 8, BLACKSTONE, 192, -25);
  patch(g, 10, 7, GRAVEL, 54, 41); patch(g, 8, 8, BLACKSTONE, 72, 39);
  for (var c = 0; c < 9; c++) {
    var left = c < 4;
    var cx = (left ? 181 : 48) + (c % 4) * 5, cz = left ? -26 + (c % 2) * 3 : 37 + (c % 3) * 3;
    spire(g, cx, cz, 3 + (c % 4) * 2, 1.6 + (c % 3) * 0.6);                    // basalt columns
  }
  [[184, -20], [194, -24], [58, 43], [78, 40]].forEach(function (m) {
    b(g, 1.4, 0.5, 1.4, MAGMA, m[0], -1.75, m[1], MAGMA);                     // magma block, top y=-1.5...
  });
  b(g, 6, 0.6, 5, LAVA, 66, -1.7, 43, LAVA);                                  // lava pool top -1.4, no coplanar
}
