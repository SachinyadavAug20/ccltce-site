// Wiki-accurate Nether biomes — crimson forest + warped forest (left and right of the path),
// composed with soul sand valley + basalt deltas from narrative-biomes2.js into buildBiomes().
import { box, glowLight, SOUL, NYL_C, NYL_W, CRIM, CRIM_CAP, WARP_STEM, WARP_CAP, SHROOM } from "./narrative-blocks.js";
import { soulValley, basaltDeltas } from "./narrative-biomes2.js";

function P(g, m, x, y, z) { m.position.set(x, y, z); g.add(m); return m; }
function b(g, w, h, d, c, x, y, z, e) { return P(g, box(w, h, d, c, e, e ? 0.8 : 0), x, y, z); }

// Huge fungus: hinged-looking stem, wart-block cap, shroomlight + hanging vines underneath.
function fungus(g, x, z, h, stemC, capC) {
  b(g, 1.3, h + 3, 1.3, stemC, x, -2 + (h + 3) / 2, z);                       // stem rooted in floor
  var capY = h;                                                                // cap centre height
  b(g, 5, 2.4, 5, capC, x, capY, z);
  b(g, 3.4, 1.6, 3.4, capC, x, capY + 2, z);
  b(g, 1.4, 1.4, 1.4, SHROOM, x, capY - 1.9, z, SHROOM);                     // shroomlight under cap
  for (var v = 0; v < 4; v++) {                                                // weeping/twisting strands
    var len = 1.4 + (v % 3) * 0.9, vx = x + (v % 2 ? 1.9 : -1.9), vz = z + (v < 2 ? -1.9 : 1.9);
    b(g, 0.3, len, 0.3, capC, vx, capY - 1.2 - len / 2, vz);                   // hangs flush from cap rim
  }
  g.add(glowLight(SHROOM, 1.2, 14, x, capY - 2, z));
}

// Floor patch: bottom buried in netherrack (top -2), top pokes out at y=-1.5.
function patch(g, w, d, c, x, z) { b(g, w, 1, d, c, x, -2, z); }

export function crimsonForest(g) {
  // left x46..84 / right x124..162, tall parts only at z<=-17 or z>=37 (clear of the path)
  [[50, -24], [66, -20], [80, -25], [130, 41], [146, 38], [158, 43]].forEach(function (p, i) {
    fungus(g, p[0], p[1], 6 + (i % 3) * 1.6, CRIM, CRIM_CAP);
  });
  [[56, -10, 9, 8], [74, 6, 8, 7], [134, 41, 9, 7], [152, 40, 7, 8]].forEach(function (q) { patch(g, q[2], q[3], NYL_C, q[0], q[1]); });
  for (var r = 0; r < 8; r++) b(g, 0.7, 0.5, 0.7, 0xcc4444, 48 + r * 4.5, -1.75, r % 2 ? -19 : 42);   // crimson roots
}

export function warpedForest(g) {
  // left x86..122 / right x164..198
  [[92, -21], [106, -25], [118, -19], [170, 42], [184, 38], [195, 44]].forEach(function (p, i) {
    fungus(g, p[0], p[1], 7 + (i % 2) * 2, WARP_STEM, WARP_CAP);
  });
  [[94, -8, 9, 7], [112, 9, 8, 8], [176, 41, 10, 7], [192, 39, 7, 7]].forEach(function (q) { patch(g, q[2], q[3], NYL_W, q[0], q[1]); });
  for (var t = 0; t < 10; t++) b(g, 0.25, 2.2, 0.25, 0x9adfc8, 88 + t * 4, -0.9, t % 2 ? -22 : 43);  // twisting vines
}

export function buildBiomes(g) { crimsonForest(g); warpedForest(g); soulValley(g); basaltDeltas(g); }
