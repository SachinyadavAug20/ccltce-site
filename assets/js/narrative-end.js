// The End — sunken island, banded obsidian pillars with breakable crystals, end city, gateway, boss.
import * as THREE from "../vendor/three.module.js";
import { ENDSTONE, PURPUR, END_ROD, AMETH, box, glowLight } from "./narrative-blocks.js";
import { enderman, enderDragon } from "./narrative-endmobs.js";
import { endermite } from "./narrative-mobs3.js";

function P(g, m, x, y, z) { m.position.set(x, y, z); g.add(m); return m; }
function tint(w, h, d, c, op) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false }));
}
var OB_MAIN = 0x2e2450, OB_BAND = 0x4b3a7d, OB_DEEP = 0x1a1430, LIP = 0xb8a54e, STONE_D = 0xc9b96a;
var IRON = 0x8a8a8a, FIRE = 0xff7a1a, CAP = 0xc4b4d4, WINDOW = 0x241a30;

// two-tier island: clean slabs + flush border stripe + raised stones. Both tiers leave a
// 20-wide centre hole — the bedrock exit-portal fountain bowl is carved into it (vanilla-style).
function island(g, D) {
  P(g, box(64, 4, 25, ENDSTONE), 200, -30 - D, 0.5);   // base tier strips hug the centre hole
  P(g, box(64, 4, 25, ENDSTONE), 200, -30 - D, 39.5);
  P(g, box(25, 4, 14, ENDSTONE), 180.5, -30 - D, 20);
  P(g, box(25, 4, 14, ENDSTONE), 219.5, -30 - D, 20);
  P(g, box(44, 3, 15, ENDSTONE), 200, -27.5 - D, 5.5); // centre tier strips, same hole
  P(g, box(44, 3, 15, ENDSTONE), 200, -27.5 - D, 34.5);
  P(g, box(15, 3, 14, ENDSTONE), 185.5, -27.5 - D, 20);
  P(g, box(15, 3, 14, ENDSTONE), 214.5, -27.5 - D, 20);
  P(g, box(64, 1, 3, LIP), 200, -27.5 - D, -10.5);
  P(g, box(64, 1, 3, LIP), 200, -27.5 - D, 50.5);
  P(g, box(3, 1, 58, LIP), 169.5, -27.5 - D, 20);
  P(g, box(3, 1, 58, LIP), 230.5, -27.5 - D, 20);
  [[-19, -19], [19, -19], [-19, 19], [19, 19]].forEach(function (c) {
    P(g, box(2.4, 1.6, 2.4, LIP), 200 + c[0], -25.2 - D, 20 + c[1]);
  });
  [[-8, 4], [10, -6], [4, 12], [-12, -10]].forEach(function (s, i) {
    P(g, box(1.6 + (i % 2), 0.9, 1.6, i % 2 ? STONE_D : LIP), 200 + s[0], -25.55 - D, 20 + s[1]);
  });
}

// obsidian pillar: footing → banded shaft → capital → iron cage → bedrock plate, fire, crystal, beam.
// Every segment stacks flush on the one below (no gaps, no shared faces).
function pillar(g, x, z, h, pi, D) {
  var base = -28 - D, top = base + h, L = h - 6;
  P(g, box(5.4, 2, 5.4, OB_DEEP), x, base + 1, z);            // footing  base..+2
  P(g, box(4.4, 2.4, 4.4, OB_BAND), x, base + 3.2, z);         // plinth   +2..+4.4
  var a = L * 0.45, b = L * 0.55 - 1;
  P(g, box(3.5, a, 3.5, OB_MAIN), x, base + 4.4 + a / 2, z);   // shaft A  +4.4..+4.4+a
  P(g, box(3.9, 1, 3.9, OB_BAND), x, base + 4.9 + a, z);       // band     +4.4+a..+5.4+a
  P(g, box(3.5, b, 3.5, OB_MAIN), x, base + 5.4 + a + b / 2, z);// shaft B  +5.4+a..top-1.6
  P(g, box(4.8, 1.6, 4.8, OB_DEEP), x, top - 0.8, z);          // capital  top-1.6..top
  var plate = top + 0.25, cy = top + 2.05;
  P(g, box(2.8, 0.5, 2.8, OB_DEEP), x, plate, z);              // bedrock plate
  var fire = P(g, box(1.1, 0.8, 1.1, FIRE, FIRE, 1), x, top + 0.9, z);
  fire.userData.pulse = pi * 0.7;
  for (var k = 0; k < 4; k++) {                      // iron cage bars
    var q = k * Math.PI / 2 + Math.PI / 4;
    P(g, box(0.2, 3.4, 0.2, IRON), x + Math.cos(q) * 1.5, top + 2.2, z + Math.sin(q) * 1.5);
  }
  P(g, box(3.3, 0.2, 0.2, IRON), x, top + 3.8, z);  // cage roof frame
  P(g, box(0.2, 0.2, 3.3, IRON), x, top + 3.6, z);
  var core = P(g, box(0.9, 1.3, 0.9, AMETH, AMETH, 0.95), x, cy, z);
  var shell = P(g, tint(1.9, 2.2, 1.9, 0xd8ccff, 0.32), x, cy, z);
  core.userData.crystal = pi; core.userData.pulse = pi * 0.9; shell.userData.crystal = pi;
  P(g, box(0.5, 40, 0.5, END_ROD, END_ROD, 0.6), x, top + 23.75, z).userData.crystalBeam = pi;
  P(g, tint(1.6, 40, 1.6, AMETH, 0.14), x, top + 23.75, z).userData.crystalBeam = pi;
  var gl = glowLight(END_ROD, 2.5, 30, x, top + 2, z);
  gl.userData.crystalLight = pi; g.add(gl);
}

// end city: the ship moored off the island edge (the tower row was clutter — removed)
function city(g, D) {
  P(g, box(8, 2, 4, PURPUR), 214, -15 - D, 70); P(g, box(6, 1.5, 3, CAP), 214, -13.5 - D, 70);
  P(g, box(0.4, 6, 0.4, END_ROD, END_ROD, 0.8), 214, -10 - D, 70); P(g, box(3, 2, 0.2, END_ROD, END_ROD, 0.6), 214, -7 - D, 70);
  P(g, box(1.5, 1.5, 1.5, AMETH, AMETH, 0.5), 218, -15 - D, 70);
  g.add(glowLight(AMETH, 1.5, 25, 218, -14 - D, 70));
}

// end exit portal fountain — vanilla-style but compact: small sunken bedrock bowl flush with
// the surface, central pedestal topped by the dark starry portal block, dragon egg (spawns
// when the dragon is slain), four torches, and the beam that dies with the dragon.
// The portal stays ONE mesh: dragon death scales it.
function gateway(g, D) {
  var y = -26 - D;                                    // island surface
  var b1 = 0x2c2b31, b2 = 0x1f1e24, b3 = 0x35343a;    // bedrock speckle grays
  // rim ring, flush with the island — fills the carved hole mouth (14-wide bowl)
  P(g, box(14.2, 1.05, 2.6, b1), 200, y - 0.47, 14.3);
  P(g, box(14.2, 1.05, 2.6, b1), 200, y - 0.47, 25.7);
  P(g, box(2.6, 1.05, 8.8, b2), 194.3, y - 0.47, 20);
  P(g, box(2.6, 1.05, 8.8, b2), 205.7, y - 0.47, 20);
  // descending steps to the bowl floor
  P(g, box(9, 1.9, 9, b3), 200, y - 1.95, 20);
  P(g, box(5.6, 1.4, 5.6, b2), 200, y - 3.65, 20);
  // central pedestal + starry exit-portal block (stars ride the mesh, they scale on reveal)
  P(g, box(1.5, 1.3, 1.5, b1), 200, y - 3.6, 20);
  var portal = P(g, box(2.2, 1.4, 2.2, 0x0b0a12, 0x8fd0ff, 0.28), 200, y - 1.6, 20);
  portal.userData.pulse = 1; portal.userData.endPortal = true;
  [[1.11, 0.42, 0.18], [-1.11, 0.34, -0.51], [0.59, 0.9, -0.76], [0.34, -0.9, 0.42],
   [-0.68, 0.08, 1.11], [0.76, 0.46, -1.11], [-0.42, 0.68, -1.11], [-1.11, -0.42, 0.68],
   [1.11, -0.3, -0.34], [0.04, 0.9, 0.72], [-0.76, -0.9, -0.26], [1.11, 0, 0.04]].forEach(function (s, i) {
    var w = 0.11 + (i % 3) * 0.04;
    var star = box(w, w, w, i % 4 ? 0xffffff : 0xd8ccff, i % 4 ? 0xffffff : 0xd8ccff, 0.9);
    star.position.set(s[0], s[1], s[2]);
    portal.add(star);
  });
  // dragon egg — spawns only after the dragon is slain
  var egg = new THREE.Group();
  P(egg, box(0.9, 1.1, 0.9, 0x14103a), 0, 0.55, 0);
  P(egg, box(0.5, 0.45, 0.5, 0x14103a), 0, 1.3, 0);
  egg.position.set(200, y - 0.9, 20);
  egg.userData.endEgg = true; egg.visible = false;
  g.add(egg);
  // four torches on the bowl floor (vanilla fountain torches — stick + flame)
  [[-1.7, 0], [1.7, 0], [0, -1.7], [0, 1.7]].forEach(function (p, i) {
    P(g, box(0.7, 0.8, 0.7, i % 2 ? b1 : b2), 200 + p[0], y - 2.55, 20 + p[1]);
    P(g, box(0.14, 0.45, 0.14, 0xbd7f32), 200 + p[0], y - 1.93, 20 + p[1]);
    var f = P(g, box(0.3, 0.38, 0.3, FIRE, FIRE, 1), 200 + p[0], y - 1.52, 20 + p[1]);
    f.userData.pulse = i * 0.8;
    g.add(glowLight(FIRE, 0.8, 7, 200 + p[0], y - 1.45, 20 + p[1]));
  });
  // exit-portal beam — thin white jet rising from the portal top
  P(g, box(0.3, 11, 0.3, END_ROD, END_ROD, 0.75), 200, y + 4.6, 20).userData.gatewayBeam = true;
}

// dive shaft — floating outcrops hugging the fall line so the free-fall between the
// nether exit (200,8,26) → (224,-34,46) → (246,-84,58) has parallax, not empty fog.
function diveShaft(g) {
  var rocks = [
    [210, -4, 34, 1.2], [216, -14, 44, 1.6], [226, -26, 52, 1.3], [234, -40, 56, 1.8],
    [242, -56, 62, 1.4], [248, -72, 58, 1.1], [238, -78, 46, 1.5], [228, -66, 40, 1.2],
    [218, -50, 36, 1.7], [212, -34, 30, 1.1], [252, -48, 70, 2.2], [258, -72, 52, 2.6],
    [206, -18, 40, 1.0], [232, -8, 50, 1.2],
  ];
  rocks.forEach(function (r, i) {
    var s = r[3], grp = new THREE.Group();
    grp.position.set(r[0], r[1], r[2]);
    P(grp, box(4 * s, 2.4 * s, 4 * s, ENDSTONE), 0, 0, 0);
    P(grp, box(2.6 * s, 1.6 * s, 2.6 * s, ENDSTONE), 0.8 * s, 2 * s, -0.5 * s);
    if (i % 2) P(grp, box(1.6 * s, 1.2 * s, 1.6 * s, ENDSTONE), -s, 1.8 * s, s);
    if (i % 3 === 0) P(grp, box(0.8 * s, 5 * s, 0.8 * s, OB_DEEP), 0.4 * s, 5.3 * s, -0.2 * s);
    if (i % 3 === 1) P(grp, box(0.3, 3.4, 0.3, END_ROD, END_ROD, 0.85), 0.8 * s, 2.8 * s + 1.7, -0.5 * s);
    if (i % 2 === 0) {
      var am = P(grp, box(0.9 * s, 1.4 * s, 0.9 * s, AMETH, AMETH, 0.9), -1.2 * s, 1.9 * s, 0.8 * s);
      am.userData.pulse = i * 0.7;
    }
    grp.userData.float = i * 0.9;
    g.add(grp);
  });
  g.add(glowLight(AMETH, 1.5, 60, 230, -45, 52));
}

export function buildEnd(g) {
  var D = 100;   // the End sits far below the nether — the dive drops the full height
  island(g, D);
  var pillars = [[-22, -22], [22, -22], [-22, 22], [22, 22], [0, -28], [0, 28], [-28, 0], [28, 0]];
  pillars.forEach(function (p, i) {
    // i=3 (222,42) sits dead on the rest-camera sight line to the dragon — shattered stub
    // by height so the ending frame reads wide instead of pillar-wall
    pillar(g, 200 + p[0], 20 + p[1], i === 3 ? 10 : 18 + i * 2, i, D);
  });
  city(g, D); gateway(g, D);
  enderman(g, 190, -26 - D, 32); enderman(g, 210, -26 - D, 32);
  enderman(g, 195, -26 - D, 8); enderman(g, 215, -26 - D, 25);
  endermite(g, 197, -26 - D, 30);
  enderDragon(g, 200, -5 - D, 20);
  g.add(glowLight(AMETH, 2, 80, 200, -15 - D, 20));
  g.add(glowLight(END_ROD, 1.5, 50, 200, -10 - D, 20));
  g.add(glowLight(0x6a0dad, 1, 40, 200, -25 - D, 20));
}
