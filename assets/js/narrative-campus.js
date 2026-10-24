// Overworld campus: village, farms, pond, lamps, animals, hostiles.
import { GOLD, STONE, STONE2, DARKOAK, OAK, GRASS, DIRT, LEAF, LEAF2, WATER, PATH, box, glowLight, tree, torch } from "./narrative-blocks.js";
import { cow, pig, sheep, chicken, villager } from "./narrative-mobs.js";
import { wolf, cat, horse, rabbit, fox, bee, mooshroom, turtle, panda, polarBear, goat, llama, bat, parrot, axolotl, armadillo, frog } from "./narrative-mobs2.js";
import { spider, zombie, skeleton, creeper, ironGolem, snowGolem, slime, witch, pillager, drowned, phantom, warden, guardian } from "./narrative-mobs3.js";

export function P(g, m, x, y, z) { m.position.set(x, y, z); g.add(m); return m; }

export function villageHouse(g, x, z, s) {
  var k = s || 1;
  P(g, box(8 * k, 6 * k, 8 * k, OAK), x, 2 * k, z);
  P(g, box(10 * k, 1.5 * k, 10 * k, DARKOAK), x, 5.5 * k, z);
  P(g, box(9 * k, 1.2 * k, 9 * k, DARKOAK), x, 6.5 * k, z);
  P(g, box(8 * k, 1.2 * k, 8 * k, DARKOAK), x, 7.3 * k, z);
  P(g, box(2 * k, 3.5 * k, 0.3 * k, DARKOAK), x, 1.2 * k, z + 4 * k);
  P(g, box(1.5 * k, 1.5 * k, 0.2 * k, GOLD, GOLD, 0.4), x - 2 * k, 3.5 * k, z + 4.1 * k);
  P(g, box(1.5 * k, 1.5 * k, 0.2 * k, GOLD, GOLD, 0.4), x + 2 * k, 3.5 * k, z + 4.1 * k);
  torch(g, x - 3 * k, 1.5 * k, z + 4.2 * k);
}

export function well(g, x, z) {
  P(g, box(5, 0.5, 5, STONE), x, -0.5, z); P(g, box(4, 2.5, 4, STONE), x, 0.5, z);
  P(g, box(3, 2, 3, WATER), x, 0.5, z);
  [[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5]].forEach(function (p) {
    P(g, box(0.4, 3, 0.4, STONE2), x + p[0], 2, z + p[1]);
  });
  P(g, box(6, 0.4, 6, DARKOAK), x, 3.5, z);
  g.add(glowLight(WATER, 0.5, 8, x, 1, z));
}

export function lampPost(g, x, z) {
  P(g, box(0.4, 5, 0.4, STONE2), x, 2, z);
  P(g, box(1, 1, 1, GOLD, GOLD, 0.9), x, 5, z);
  g.add(glowLight(GOLD, 1, 15, x, 5.5, z));
}

export function farmPlot(g, x, z, w, d) {
  P(g, box(w, 0.4, d, DIRT), x, -0.6, z);
  P(g, box(w + 0.5, 0.5, d + 0.5, PATH), x, -0.8, z);
  for (var c = 0; c < Math.floor(w * d / 2); c++) {
    var cx = x + (Math.random() - 0.5) * w * 0.8, cz = z + (Math.random() - 0.5) * d * 0.8;
    P(g, box(0.25, 0.6 + (c % 3) * 0.2, 0.25, c % 2 ? LEAF2 : LEAF), cx, -0.3, cz);
  }
  var hw = w / 2 + 0.6, hd = d / 2 + 0.6;
  for (var fx = -hw; fx <= hw + 0.1; fx += 2) { P(g, box(0.15, 1, 0.15, OAK), x + fx, 0.3, z - hd); P(g, box(0.15, 1, 0.15, OAK), x + fx, 0.3, z + hd); }
  for (var fz = -hd; fz <= hd + 0.1; fz += 2) { P(g, box(0.15, 1, 0.15, OAK), x - hw, 0.3, z + fz); P(g, box(0.15, 1, 0.15, OAK), x + hw, 0.3, z + fz); }
  P(g, box(w + 1.4, 0.12, 0.1, OAK), x, 0.72, z - hd); P(g, box(w + 1.4, 0.12, 0.1, OAK), x, 0.72, z + hd);
  P(g, box(0.1, 0.12, d + 1.4, OAK), x - hw, 0.72, z); P(g, box(0.1, 0.12, d + 1.4, OAK), x + hw, 0.72, z);
}

export function flowerBed(g, x, z, n) {
  for (var f = 0; f < n; f++) {
    var fx2 = x + (Math.random() - 0.5) * 6, fz = z + (Math.random() - 0.5) * 6;
    P(g, box(0.3, 0.8, 0.3, LEAF), fx2, 0, fz);
    P(g, box(0.5, 0.5, 0.5, f % 3 === 0 ? 0xff3355 : f % 3 === 1 ? 0xffaa00 : 0xff66cc), fx2, 0.6, fz);
  }
}

export function pond(g, x, z) {
  P(g, box(10, 0.3, 8, WATER, WATER, 0.15), x, -1, z);
  P(g, box(12, 0.4, 10, DIRT), x, -1.3, z);
  for (var rl = 0; rl < 6; rl++) P(g, box(0.15, 1.2, 0.15, LEAF), x + (Math.random() - 0.5) * 8, -0.5, z + (Math.random() - 0.5) * 6);
  g.add(glowLight(WATER, 0.4, 10, x, 0, z));
}

function bush(g, x, z) {
  P(g, box(1.6, 1.1, 1.6, LEAF), x, 0.2, z);
  P(g, box(1.1, 0.9, 1.1, LEAF2), x + 0.25, 0.5, z + 0.15);
}

function rock(g, x, z, s) {
  var k = s || 1;
  P(g, box(1.3 * k, 0.9 * k, 1.1 * k, STONE), x, 0.25 * k, z);
  P(g, box(0.8 * k, 0.6 * k, 0.7 * k, STONE2), x + 0.3 * k, 0.6 * k, z + 0.1 * k);
}

function clouds(g) {
  for (var c = 0; c < 10; c++) {
    var cx = -70 + c * 16 + (c % 3) * 4;
    var cl = P(g, box(14 + (c % 4) * 8, 2.5, 10 + (c % 3) * 5, 0xffffff, 0xffffff, 0.25), cx, 50 + (c % 4) * 5, -40 + (c % 6) * 14);
    cl.material.transparent = true; cl.material.opacity = 0.88;
    cl.userData.cloud = c * 0.8; cl.userData.baseX = cx;
  }
}

export function buildCampus(g) {
  P(g, box(110, 2, 100, GRASS), -15, -2, -10);   // ends at x=40 where the nether floor begins
  P(g, box(110, 4, 100, DIRT), -15, -5, -10);
  for (var gp = 0; gp < 15; gp++) P(g, box(2, 0.15, 2, PATH), gp % 2 ? 1.5 : -1.5, -0.9, 5 - gp * 3);
  P(g, box(5, 11, 5, STONE), -12, 4.5, -8); P(g, box(5, 11, 5, STONE), 12, 4.5, -8);
  P(g, box(32, 4, 5, STONE), 0, 12, -8); P(g, box(36, 1.5, 8, DARKOAK), 0, 14.75, -8);
  P(g, box(14, 2.5, 0.5, GOLD, GOLD, 0.5), 0, 12, -5.2);
  P(g, box(0.25, 3.5, 2, 0xeab308), -14.6, 10, -5.3);
  P(g, box(0.25, 3.5, 2, 0x17dd62), 14.6, 10, -5.3);
  g.add(glowLight(GOLD, 2, 30, 0, 12, -4));
  [-10, 10].forEach(function (x) { torch(g, x, 8, -5); });
  tree(g, -25, -5, 1.2); tree(g, 25, -5, 1.1); tree(g, -20, -20, 1.4); tree(g, 20, -20, 1.3);
  tree(g, -30, -35, 1); tree(g, 30, -35, 1.1); tree(g, 15, -45, 0.9); tree(g, -15, -45, 1);
  tree(g, -38, -12, 1.3); tree(g, 38, -12, 1.2); tree(g, -42, -30, 1.1); tree(g, 42, -30, 1);
  bush(g, -16, -10); bush(g, 16, -12); bush(g, -24, -40); bush(g, 24, -38);
  bush(g, -8, -36); bush(g, 8, -36); bush(g, -34, -4); bush(g, 34, -4);
  rock(g, -14, -42, 1.2); rock(g, 14, -44, 1); rock(g, -36, -46, 1.4); rock(g, 30, -16, 0.9);
  clouds(g);
  for (var fl = 0; fl < 15; fl++) P(g, box(0.4, 0.8, 0.4, fl % 3 === 0 ? 0xff3355 : fl % 3 === 1 ? 0xffaa00 : 0xff66cc, fl % 3 === 2 ? 0xff66cc : 0, 0.3), -30 + Math.random() * 60, 0, -50 + Math.random() * 45);
  villageHouse(g, -32, -14, 1); villageHouse(g, 32, -14, 1.1); villageHouse(g, -28, -38, 0.9);
  well(g, 0, -14); lampPost(g, -8, -14); lampPost(g, 8, -14); lampPost(g, -8, -28); lampPost(g, 8, -28);
  farmPlot(g, -18, -32, 8, 5); farmPlot(g, 18, -32, 8, 5);
  flowerBed(g, -5, -12, 8); flowerBed(g, 5, -24, 6);
  pond(g, 0, -44);
  P(g, box(50, 14, 20, STONE2), 0, 6, -30); P(g, box(54, 2, 22, DARKOAK), 0, 14, -30);
  for (var i = 0; i < 8; i++) {
    P(g, box(3, 4, 0.5, GOLD, GOLD, 0.4), -20 + i * 5.7, 7, -20);
    P(g, box(3.5, 0.3, 0.8, STONE), -20 + i * 5.7, 4.8, -19.8);
  }
  P(g, box(5, 8.5, 0.5, STONE), 0, 3.25, -19.75);
  P(g, box(3.8, 7.5, 0.3, DARKOAK), 0, 3, -19.5);
  P(g, box(0.3, 0.3, 0.3, GOLD, GOLD, 0.5), 1.5, 3, -19.3);
  for (var dp = 0; dp < 3; dp++) P(g, box(3.6, 0.15, 0.1, 0x3a2818), 0, 1.5 + dp * 2.2, -19.35);
  for (var p = 0; p < 10; p++) P(g, box(4, 0.4, 3, STONE), p % 2 ? 2 : -2, -0.8, 2 - p * 3);
  for (var t = 0; t < 5; t++) { P(g, box(0.8, 0.8, 0.8, GOLD, GOLD, 0.8), -6, 0, 0 - t * 5); g.add(glowLight(GOLD, 0.8, 12, -6, 1, 0 - t * 5)); }
  cow(g, -18, 0, -15); cow(g, 22, 0, -25); pig(g, 18, 0, -10); pig(g, -22, 0, -30);
  sheep(g, -28, 0, -18); sheep(g, 28, 0, -35);
  chicken(g, 12, 0, -5); chicken(g, -14, 0, -8); chicken(g, 8, 0, -18);
  villager(g, -5, 0, -18); villager(g, 8, 0, -22);
  wolf(g, -20, 0, -24); wolf(g, 24, 0, -16); cat(g, -12, 0, -32); horse(g, 20, 0, -40);
  // wolf pack + roof cats (colour variants)
  wolf(g, -27, 0, -26, 0x8a7355, true); wolf(g, -24, 0, -29); wolf(g, -31, 0, -28, 0x9a9a9a, true);
  cat(g, -34, 7.95, -16); cat(g, 33, 8.7, -12, 0xd48030); cat(g, -30, 7.15, -40, 0xf0e0c8); cat(g, 28, 0, -40, 0x2a2a2a);
  rabbit(g, -30, 0, -22); fox(g, 16, 0, -32); bee(g, -8, 4, -16); bee(g, 6, 5, -20);
  mooshroom(g, 30, 0, -28); turtle(g, 0, -1, -44); panda(g, -35, 0, -25); polarBear(g, 35, 0, -22);
  goat(g, -26, 0, -40); llama(g, 26, 0, -42); bat(g, -10, 8, -26); bat(g, 10, 9, -24);
  parrot(g, -25, 6, -8); axolotl(g, 0, -1, -42); armadillo(g, 12, 0, -36); frog(g, -2, 0, -40);
  ironGolem(g, -3, 0, -16); snowGolem(g, 14, 0, -28);
  spider(g, -34, 0, -44); zombie(g, 34, 0, -44); skeleton(g, -36, 0, -30);
  creeper(g, 36, 0, -30); slime(g, -24, 0, -46); witch(g, 28, 0, -46);
  pillager(g, -32, 0, -20); drowned(g, 0, -2, -44); phantom(g, 30, 24, -8);
  warden(g, 40, 0, -48); guardian(g, 0, -2, -44);
  for (var e = 0; e < 20; e++) {
    var ember = P(g, box(0.3, 0.3, 0.3, GOLD, GOLD, 1), (Math.random() - 0.5) * 40, Math.random() * 18, (Math.random() - 0.5) * 30);
    ember.userData.float = Math.random() * Math.PI * 2;
  }
}
