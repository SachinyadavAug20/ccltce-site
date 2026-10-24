// The End — sunken island, banded obsidian pillars with breakable crystals, end city, gateway, boss.
import * as THREE from "../vendor/three.module.js";
import { ENDSTONE, PURPUR, END_ROD, AMETH, box, glowLight } from "./narrative-blocks.js";
import { enderman, shulker, enderDragon } from "./narrative-endmobs.js";
import { endermite } from "./narrative-mobs3.js";

function P(g, m, x, y, z) { m.position.set(x, y, z); g.add(m); return m; }
function tint(w, h, d, c, op) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false }));
}
var OB_MAIN = 0x2e2450, OB_BAND = 0x4b3a7d, OB_DEEP = 0x1a1430, LIP = 0xb8a54e, STONE_D = 0xc9b96a;
var IRON = 0x8a8a8a, FIRE = 0xff7a1a, CAP = 0xc4b4d4, WINDOW = 0x241a30;

// two-tier island: clean slabs + flush border stripe + raised stones (the old floating rim slabs are gone)
function island(g, D) {
  P(g, box(64, 4, 64, ENDSTONE), 200, -30 - D, 20);
  P(g, box(44, 3, 44, ENDSTONE), 200, -27.5 - D, 20);
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

// end city: 4 detailed towers + the ship moored off the island edge
function city(g, D) {
  for (var t = 0; t < 4; t++) {
    var x = 190 + t * 7, h = 10 + t * 2, y = -26 - D;
    P(g, box(3.4, 1.2, 3.4, 0x8a6fa0), x, y + 0.6, 35);
    P(g, box(2, h, 2, PURPUR), x, y + 1.2 + h / 2, 35);
    P(g, box(0.8, 1.2, 0.2, WINDOW), x, y + 1.2 + h * 0.4, 36.01);
    P(g, box(0.8, 1.2, 0.2, WINDOW), x, y + 1.2 + h * 0.4, 33.99);
    P(g, box(2.5, 0.6, 2.5, CAP), x, y + 1.5 + h, 35);
    P(g, box(1.7, 1, 1.7, PURPUR), x, y + 2.3 + h, 35);
    P(g, box(0.3, 1.6, 0.3, END_ROD, END_ROD, 1), x, y + 3.6 + h, 35);
  }
  P(g, box(8, 2, 4, PURPUR), 214, -15 - D, 70); P(g, box(6, 1.5, 3, CAP), 214, -13.5 - D, 70);
  P(g, box(0.4, 6, 0.4, END_ROD, END_ROD, 0.8), 214, -10 - D, 70); P(g, box(3, 2, 0.2, END_ROD, END_ROD, 0.6), 214, -7 - D, 70);
  P(g, box(1.5, 1.5, 1.5, AMETH, AMETH, 0.5), 218, -15 - D, 70);
  g.add(glowLight(AMETH, 1.5, 25, 218, -14 - D, 70));
}

// end gateway — obsidian frame with a pulsing amethyst portal
function gateway(g, D) {
  P(g, box(6, 0.6, 6, OB_DEEP), 200, -26.2 - D, 20);
  [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(function (p) {
    P(g, box(0.7, 4.4, 0.7, OB_MAIN), 200 + p[0], -24 - D, 20 + p[1]);
    P(g, box(1.1, 0.5, 1.1, OB_BAND), 200 + p[0], -21.55 - D, 20 + p[1]);
  });
  var portal = P(g, box(3.4, 3.4, 0.3, AMETH, AMETH, 0.9), 200, -24 - D, 20);
  portal.userData.pulse = 1; portal.userData.endPortal = true;
}

export function buildEnd(g) {
  var D = 100;   // the End sits far below the nether — the dive drops the full height
  island(g, D);
  var pillars = [[-22, -22], [22, -22], [-22, 22], [22, 22], [0, -28], [0, 28], [-28, 0], [28, 0]];
  pillars.forEach(function (p, i) { pillar(g, 200 + p[0], 20 + p[1], 18 + i * 2, i, D); });
  city(g, D); gateway(g, D);
  enderman(g, 190, -26 - D, 32); enderman(g, 210, -26 - D, 32);
  enderman(g, 195, -26 - D, 8); enderman(g, 215, -26 - D, 25);
  endermite(g, 197, -26 - D, 30);
  shulker(g, 193, -26 - D, 35); shulker(g, 207, -26 - D, 35);
  enderDragon(g, 200, -5 - D, 20);
  g.add(glowLight(AMETH, 2, 80, 200, -15 - D, 20));
  g.add(glowLight(END_ROD, 1.5, 50, 200, -10 - D, 20));
  g.add(glowLight(0x6a0dad, 1, 40, 200, -25 - D, 20));
}
