// Overworld biomes — Plains, Village, Forest/Birch, Desert fringe, River & Pets.
import * as THREE from "../vendor/three.module.js";
import {
  box, glowLight, OAK, DARKOAK, GRASS, DIRT, LEAF, LEAF2, WATER, PATH, STONE, STONE2,
  GOLD, SAND, CACTUS, BIRCH, LILY
} from "./narrative-blocks.js";
import { cow, pig, sheep, chicken, villager } from "./narrative-mobs.js";
import { wolf, cat, horse, rabbit, fox, bee, turtle } from "./narrative-mobs2.js";
import { ironGolem } from "./narrative-mobs3.js";

function P(g, m, x, y, z) { m.position.set(x, y, z); g.add(m); return m; }

// Street lantern: spruce fence + hanging lantern
function streetLamp(g, x, z) {
  P(g, box(0.35, 3.6, 0.35, DARKOAK), x, 0.9, z);
  P(g, box(0.8, 0.9, 0.8, GOLD, GOLD, 0.85), x, 2.7, z);
  g.add(glowLight(GOLD, 1.2, 14, x, 3, z));
}

// Birch tree with black specks on white bark
function birchTree(g, x, z, s) {
  var k = s || 1;
  P(g, box(1.1 * k, 6.5 * k, 1.1 * k, BIRCH), x, 2.25 * k, z);
  P(g, box(0.3 * k, 0.35 * k, 1.14 * k, 0x1a1a1a), x, 2.5 * k, z);
  P(g, box(1.14 * k, 0.35 * k, 0.3 * k, 0x1a1a1a), x, 4 * k, z);
  P(g, box(5 * k, 4.5 * k, 5 * k, LEAF), x, 6.5 * k, z);
  P(g, box(3.2 * k, 2.5 * k, 3.2 * k, LEAF2), x, 9 * k, z);
}

// Cactus pillar with arms
function cactus(g, x, z, h) {
  P(g, box(1.2, h, 1.2, CACTUS), x, -1 + h / 2, z);
  P(g, box(0.6, 1.4, 0.6, CACTUS), x - 0.9, -1 + h * 0.55, z);
  P(g, box(0.7, 0.6, 0.6, CACTUS), x - 0.6, -1 + h * 0.4, z);
}

export function buildOverworld(g) {
  // 1. Winding Road from z=82 down to z=6: path, cobblestone & stone brick pavers
  for (var r = 0; r < 24; r++) {
    var rz = 82 - r * 3.2, rx = Math.sin(r * 0.35) * 2.2;
    P(g, box(4.4, 0.16, 2.9, r % 3 === 0 ? STONE : r % 2 === 0 ? PATH : STONE2), rx, -0.92, rz);
  }
  // Lanterns lighting the approach road (spaced clear of center)
  [18, 38, 58, 76].forEach(function (lz, li) {
    streetLamp(g, li % 2 ? -4.5 : 4.5, lz);
  });

  // 2. Rolling Terrain Elevation (gentle stepped green slabs, left flank)
  P(g, box(34, 1, 65, GRASS), -36, -1.5, 45);
  P(g, box(22, 1, 40, GRASS), -42, -0.5, 48);

  // 3. Flower Plains & Farmland (z=15..55, left)
  P(g, box(1.8, 1.8, 1.8, 0xd4a030), -18, -0.1, 28);
  P(g, box(1.84, 0.35, 1.84, 0xaa2222), -18, -0.1, 28);
  P(g, box(1.8, 1.8, 1.8, 0xd4a030), -20, -0.1, 28.5);
  // Pumpkin patch
  [[-15, 22], [-17, 24], [-14, 25]].forEach(function (pk) {
    P(g, box(1.1, 1.1, 1.1, 0xd46818), pk[0], -0.45, pk[1]);
    P(g, box(0.2, 0.35, 0.2, 0x3d7020), pk[0], 0.2, pk[1]);
  });
  // Fences around sheep/cow pasture
  for (var fx = -32; fx <= -20; fx += 2.2) {
    P(g, box(0.2, 1.1, 0.2, OAK), fx, -0.45, 34);
    P(g, box(2.2, 0.12, 0.1, OAK), fx + 1.1, -0.3, 34);
  }
  for (var fz = 24; fz <= 34; fz += 2.2) {
    P(g, box(0.2, 1.1, 0.2, OAK), -32, -0.45, fz);
    P(g, box(0.1, 0.12, 2.2, OAK), -32, -0.3, fz + 1.1);
  }

  // 4. Overworld Pets & Animals along the entrance path
  wolf(g, -4.5, 0, 14, 0xd4d4d4, true);    // Tamed pet wolf greeting at the gate!
  cat(g, 4.2, 0, 16, 0x1a1a1a);           // Tuxedo cat sitting along the path
  cat(g, -18, 0.8, 28, 0xd48030);         // Ginger cat sitting on hay bale
  horse(g, -26, 0, 29);                   // Chestnut horse in the pasture
  sheep(g, -22, 0, 31); sheep(g, -28, 0, 26);
  cow(g, -16, 0, 35); pig(g, -12, 0, 32);
  chicken(g, -6, 0, 22); chicken(g, -8, 0, 25);
  ironGolem(g, -5, 0, 36);                // Village protector on path patrol
  villager(g, -7, 0, 42);
  rabbit(g, -15, 0, 52); rabbit(g, 10, 0, 45);

  // 5. Birch & Oak Forest (left flank x=-35..-55, z=20..80)
  birchTree(g, -38, 22, 1.1); birchTree(g, -46, 38, 1.2); birchTree(g, -40, 62, 1.0);
  // Fallen mossy log with mushrooms
  P(g, box(6, 1.1, 1.1, OAK), -38, -0.45, 52);
  P(g, box(0.5, 0.6, 0.5, 0xcc2222, 0xcc2222, 0.3), -39, 0.3, 52);
  P(g, box(0.5, 0.5, 0.5, 0x8a6040), -37, 0.25, 52);
  fox(g, -36, 0, 50);                      // Fox resting by the log

  // 6. Desert Fringe (right flank x=16..35, z=30..80)
  P(g, box(18, 0.6, 45, SAND), 25, -1.7, 52);
  cactus(g, 22, 36, 3.2); cactus(g, 28, 54, 4.2); cactus(g, 20, 68, 2.6);
  // Dead bushes
  [[24, 42], [18, 48], [26, 62]].forEach(function (db) {
    P(g, box(0.5, 0.6, 0.5, 0x8a6640), db[0], -1.1, db[1]);
  });

  // 7. Meandering River with Lily Pads & Sugar Canes (z=55..82, left-center)
  P(g, box(16, 0.25, 24, WATER, WATER, 0.15), -14, -1.3, 68);
  P(g, box(18, 0.35, 26, SAND), -14, -1.5, 68);
  // Lily pads floating on water
  [[-11, 62], [-16, 66], [-13, 73], [-10, 77]].forEach(function (lp) {
    P(g, box(1.1, 0.04, 1.1, LILY), lp[0], -1.16, lp[1]);
  });
  // Sugar cane reeds along water edge
  for (var sc = 0; sc < 6; sc++) {
    P(g, box(0.25, 2.6, 0.25, 0x76b834), -5.8, 0.1, 62 + sc * 2.5);
  }
  turtle(g, -6.5, -1.1, 66);
  // Bees hovering near flowers
  bee(g, -12, 2.5, 22); bee(g, -16, 3.0, 24);
}
