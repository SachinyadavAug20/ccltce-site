// Overworld stronghold — ONE job: build the underground leg between the nether and the End.
// A stone-brick stair corridor descends torch-lit from the surface, opens into the portal
// chamber and ends at the east-facing end-portal ring whose centre is exactly the camera's
// punch waypoint. CLEARANCE CONTRACT: the camera flies through a 2.4-below / 3.4-above /
// 3.6-aside slot everywhere — cells follow the camera's own piecewise descent, the lava
// pool sits pocketed south of the punch line, and the void is star chips on the jamb
// edges (never a solid emissive plane the lens can cross).
import * as THREE from "../vendor/three.module.js";
import { LAVA, GOLD, OAK, box, glowLight } from "./narrative-blocks.js";

function P(g, m, x, y, z) { m.position.set(x, y, z); g.add(m); return m; }

var SB = 0x8b8b92;      // stone brick — cool grey corridor walls
var SB_D = 0x63636e;    // cracked stone brick — ribs, trims, ceiling
var BED = 0x1c1c22;     // bedrock-like backdrop beyond the ring
var FRAME = 0x2ea35f;   // end-portal frame jambs

// camera descent — sampled from the REAL camera spline so floor faces keep a constant
// 2.4-under / 3.4-over / 3.6-aside slot against it, sag and all
import { createCameraPath } from "./narrative-camera.js";
var spline = createCameraPath();
function spineAt(x) {   // x is monotonic along the dungeon stretch [0.70..0.84]
  var lo = 0.70, hi = 0.84;
  for (var i = 0; i < 40; i++) {
    var mid = (lo + hi) / 2;
    if (spline.getPointAt(mid).x < x) lo = mid; else hi = mid;
  }
  var t = (lo + hi) / 2, p = spline.getPointAt(t), tan = spline.getTangentAt(t);
  return { y: p.y, z: p.z, pit: Math.atan2(tan.y, tan.x) };
}

// descending corridor: cells hug the true spline — floor 2.4 under the lens (tilted with
// the pitch), walls 3.6 aside, ceiling 3.4 above. Torch brackets light every other cell.
function corridorCells(g, cells) {
  for (var i = 0; i < cells; i++) {
    var cx = 206 + 21 * i / (cells - 1);   // 206 → 227 along the true dungeon spline
    var s = spineAt(cx);
    var cy = s.y, cz = s.z, lift = Math.cos(s.pit);
    var fl = P(g, box(6.4, 1, 7.6, SB), cx, cy - 2.4 / lift, cz);   // floor — constant 2.4 under
    fl.rotation.z = s.pit;                                           // tilt with the dive (baked by the batcher)
    P(g, box(6.4, 7, 0.8, SB), cx, cy, cz - 4.0);            // west wall (inner face 3.6 from lens)
    P(g, box(6.4, 7, 0.8, SB), cx, cy, cz + 4.0);            // east wall
    if (i !== cells - 1) {
      var ce = P(g, box(6.4, 1, 9.4, SB_D), cx, cy + 3.4 / lift, cz);
      ce.rotation.z = s.pit;                                           // ceiling tilts too
    }
    if (i % 2 === 0) {
      P(g, box(1, 7.6, 1, SB_D), cx, cy, cz - 3.4);          // arch ribs
      P(g, box(1, 7.6, 1, SB_D), cx, cy, cz + 3.4);
      P(g, box(1, 1, 7.2, SB_D), cx, cy + 3.9, cz);
    }
    if (i !== cells - 1) {                                    // every cell carries a torch bracket
      var side = i % 2 === 0 ? -1 : 1;
      P(g, box(0.4, 0.4, 1.2, 0xff7a1a, 0xff7a1a, 0.9), cx, cy + 1.6, cz + side * 3.7);
      g.add(glowLight(0xff9a4a, 2.2, 16, cx, cy + 1.8, cz + side * 3.4));
    }
    if (i === 2 || i === 4) {
      P(g, box(0.9, 4.4, 2, OAK), cx, cy + 0.2, cz - 3.2);   // leaning shelf wedged at the wall
      P(g, box(0.5, 1.2, 1.8, GOLD, GOLD, 0.3), cx - 0.6, cy - 0.9, cz - 3.0); // book spark
    }
  }
}

// portal chamber: tall room east of the corridor mouth. Floor floods at -21.6 (2.1 under
// the punch), the lava pocket slides into the north edge, and the ring's green jambs +
// star chips frame an open sack of void — nothing solid sits on the punch line.
function portalChamber(g) {
  var RING_X = 237, fy = -19.5, fz = 36;
  // floor east of the corridor mouth — top at -21.6, ends just past the ring (x=237.5)
  // so the post-punch dive falls EAST of all slab faces (no through-slab clipping)
  P(g, box(13, 1.4, 24, SB), 231, -22.3, 32);
  // south + north walls (the fall line dives past the north wall's east tip — no clip)
  P(g, box(19, 13, 1.2, SB), 235, -15, 19.4);   // south wall
  P(g, box(19, 13, 1.2, SB), 235, -15, 44.6);   // north wall
  // ceiling east of the last corridor cell
  P(g, box(16, 1, 24, SB_D), 237.5, -8, 32);
  // breach step: the corridor mouth sits raised over the chamber floor
  P(g, box(8, 1, 9, SB_D), 232, -20.3, 34.5);    // top -19.8 → ≥0.9 under the lens at x≤235.9
  // lava pocket: flush recess at the north edge — 2.5 lateral clearance to the punch swag
  P(g, box(5, 0.8, 5, LAVA, LAVA, 0.5), 232.5, -21.2, 41);
  g.add(glowLight(0xff7a1a, 0.9, 11, 232.5, -20.2, 41));
  // chamber interior: corner columns + wall torches so the room reads, not just the ring
  [[229.5, 22.9], [236.2, 23], [229.5, 41.5], [236.2, 41]].forEach(function (c) {
    P(g, box(1.7, 9, 1.7, SB_D), c[0], -17.4, c[1]);          // floor -21.6 → column top -12.9
  });
  [[229.5, 20.8], [236.5, 42.5]].forEach(function (t) {
    P(g, box(0.4, 0.4, 1.2, 0xff7a1a, 0xff7a1a, 0.9), t[0], -13.2, t[1]);
    g.add(glowLight(0xff9a4a, 1.8, 17, t[0], -13, t[1]));
  });
  // ring: dim green jambs embedded in the floor-up opening
  P(g, box(1.4, 1.5, 8.4, FRAME, FRAME, 0.14), RING_X, fy - 4.75, fz);
  P(g, box(1.4, 1.5, 8.4, FRAME, FRAME, 0.14), RING_X, fy + 4.75, fz);
  P(g, box(1.4, 11, 1.4, FRAME, FRAME, 0.14), RING_X, fy, fz - 3.9);
  P(g, box(1.4, 11, 1.4, FRAME, FRAME, 0.14), RING_X, fy, fz + 3.9);
  // star chips hug the jamb edges — the centre stays CLEAN for the punch
  [[-17.4, 33.9], [-17.9, 37.1], [-21.2, 34.3], [-21.4, 37.8],
   [-16.3, 35.2], [-18.6, 33.7], [-20.9, 38.6], [-22.7, 36.4]].forEach(function (st, i) {
    var w = 0.22 + (i % 3) * 0.12;
    P(g, box(w, w, 0.35, 0xbef5d8, 0x4ce09a, 0.8), RING_X + 0.25, st[0], st[1]).userData.pulse = i * 0.8;
  });
  // slim sheen stays off the lens line (x 235.7..235.9, opacity 0.05, just a breath)
  var sheen = new THREE.Mesh(new THREE.BoxGeometry(0.2, 9.4, 7),
    new THREE.MeshBasicMaterial({ color: 0x1fae6f, transparent: true, opacity: 0.05, depthWrite: false }));
  P(g, sheen, RING_X - 1.2, fy, fz);
  g.add(glowLight(0x1fae6f, 0.9, 12, RING_X + 2.5, fy, fz));

  // dive backdrop: bedrock frame behind the ring, hole centred on the fall line
  // (the camera threads it at (247,-44,46.5))
  var BX = 247, hy = -44, H = 4.6, hz = 46.5, HW = 5;
  P(g, box(2.5, 3, 22, BED), BX, hy + H + 1.5, hz);           // upper slab (hole ceiling at -39.4)
  P(g, box(2.5, 3, 22, BED), BX, hy - H - 1.5, hz);           // lower slab (hole floor at -48.6)
  P(g, box(2.5, 15, 2.5, BED), BX, hy, hz - HW - 1.2);        // far slab
  P(g, box(2.5, 15, 2.5, BED), BX, hy, hz + HW + 1.2);        // near slab
  // scorched rim: emissive edges so the breach reads as torn open, not black-on-black
  P(g, box(2.5, 0.5, 10.8, 0x123a2c, 0x2ea35f, 0.45), BX, hy + H + 0.25, hz);   // top rim (hole edge -39.4)
  P(g, box(2.5, 0.5, 10.8, 0x123a2c, 0x2ea35f, 0.45), BX, hy - H - 0.25, hz);   // bottom rim (hole edge -48.6)
  P(g, box(2.5, 9.2, 0.5, 0x123a2c, 0x2ea35f, 0.45), BX, hy, hz - HW + 0.25);   // far rim
  P(g, box(2.5, 9.2, 0.5, 0x123a2c, 0x2ea35f, 0.45), BX, hy, hz + HW - 0.25);   // near rim
  // void glow bleeding through the breach — rims the slabs as the lens passes
  g.add(glowLight(0x7de0b8, 2.6, 30, 251, hy, hz));
  // end-stone puffs float past the fall line for parallax — off-axis, never on it
  [[253, -50, 39, 1.3], [251, -66, 57, 1.7], [259, -80, 47, 1.1],
   [250, -28, 30, 1.4], [246, -12, 44, 1.2], [256, -58, 62, 1.9]].forEach(function (r) {
    var grp = new THREE.Group(), s = r[3];
    grp.position.set(r[0], r[1], r[2]);
    grp.userData.float = r[1] * 0.3;
    P(grp, box(4 * s, 2.4 * s, 4 * s, 0xd8d2a8), 0, 0, 0);
    g.add(grp);
  });
}

export function buildStronghold(group) {
  var g = new THREE.Group();
  g.name = "stronghold";
  corridorCells(g, 8);
  portalChamber(g);
  group.add(g);
  return g;
}
