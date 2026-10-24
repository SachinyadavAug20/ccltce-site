// Nether + End world zones for the narrative descent.
import * as THREE from "../vendor/three.module.js";
import {
  NETHERRACK, LAVA, GLOWSTONE, ENDSTONE, OBSIDIAN, PURPUR, END_ROD,
  SOUL, WARP, GOLD, EMER, AMETH, DARK, box, glowLight,
} from "./narrative-blocks.js";

export function buildNether(g) {
  // netherrack cavern shell
  var ceil = box(160, 3, 80, NETHERRACK); ceil.position.set(120, 22, 10); g.add(ceil);
  var flr = box(160, 3, 80, NETHERRACK); flr.position.set(120, -2, 10); g.add(flr);
  // lava pools under track
  for (var i = 0; i < 6; i++) {
    var pool = box(10 + (i % 3) * 4, 0.5, 8, LAVA, LAVA, 0.9);
    pool.position.set(55 + i * 25, -0.5, (i % 2 ? 8 : -8)); g.add(pool);
    g.add(glowLight(LAVA, 2, 25, 55 + i * 25, 1, (i % 2 ? 8 : -8)));
  }
  // glowstone ceiling clusters
  for (var gs = 0; gs < 10; gs++) {
    var cluster = box(2, 2, 2, GLOWSTONE, GLOWSTONE, 0.8);
    cluster.position.set(50 + gs * 16, 19, (gs % 3 - 1) * 14); g.add(cluster);
    g.add(glowLight(GLOWSTONE, 1.2, 20, 50 + gs * 16, 18, (gs % 3 - 1) * 14));
  }
  // warped forest patches — cyan-free teal mushrooms
  for (var w = 0; w < 8; w++) {
    var stem = box(0.6, 3, 0.6, WARP); stem.position.set(60 + w * 18, 1.5, (w % 2 ? -14 : 14)); g.add(stem);
    var cap = box(2.5, 1, 2.5, SOUL, SOUL, 0.2); cap.position.set(60 + w * 18, 3.2, (w % 2 ? -14 : 14)); g.add(cap);
  }
  // nether fortress pillars along track
  for (var f = 0; f < 5; f++) {
    var px = 70 + f * 30;
    var pil = box(3, 16, 3, 0x3a1a1a); pil.position.set(px, 8, -6); g.add(pil);
    var pil2 = box(3, 16, 3, 0x3a1a1a); pil2.position.set(px, 8, 6); g.add(pil2);
    var bridge = box(3, 2, 15, 0x3a1a1a); bridge.position.set(px, 16, 0); g.add(bridge);
  }
  // floating soul fire particles
  for (var sf = 0; sf < 20; sf++) {
    var soul = box(0.4, 0.4, 0.4, SOUL, SOUL, 1);
    soul.position.set(45 + Math.random() * 150, Math.random() * 18, (Math.random() - 0.5) * 30);
    soul.userData.float = Math.random() * Math.PI * 2; g.add(soul);
  }
  // ambient nether light
  g.add(glowLight(0xff6622, 1.5, 80, 100, 5, 0));
  g.add(glowLight(LAVA, 1, 60, 80, 0, 5));
}

export function buildEnd(g) {
  // endstone platform ring
  var plat = box(60, 3, 60, ENDSTONE); plat.position.set(200, -30, 20); g.add(plat);
  var plat2 = box(30, 2, 30, ENDSTONE); plat2.position.set(200, -28, 20); g.add(plat2);
  // obsidian pillars with end crystals
  var pillars = [[-20, -20], [20, -20], [-20, 20], [20, 20], [0, -25], [0, 25]];
  pillars.forEach(function (pp, pi) {
    var pillar = box(3, 20 + pi * 2, 3, OBSIDIAN);
    pillar.position.set(200 + pp[0], -20 + pi, 20 + pp[1]); g.add(pillar);
    // crystal on top
    var crystal = box(1.5, 2.5, 1.5, END_ROD, END_ROD, 1);
    crystal.position.set(200 + pp[0], -18 + pi + (20 + pi * 2) / 2 + 1.5, 20 + pp[1]);
    crystal.userData.pulse = pi * 1.1; g.add(crystal);
    g.add(glowLight(END_ROD, 2, 25, 200 + pp[0], -16 + pi + (20 + pi * 2) / 2, 20 + pp[1]));
  });
  // end rods hanging
  for (var er = 0; er < 12; er++) {
    var rod = box(0.3, 2, 0.3, END_ROD, END_ROD, 1);
    rod.position.set(185 + Math.random() * 30, -25 + Math.random() * 12, 10 + Math.random() * 20);
    rod.userData.float = Math.random() * Math.PI * 2; g.add(rod);
  }
  // chorus plant accents (purple, allowed as amethyst-family)
  for (var ch = 0; ch < 6; ch++) {
    var stalk = box(0.8, 3, 0.8, PURPUR);
    stalk.position.set(185 + ch * 6, -27, 8 + (ch % 2) * 24); g.add(stalk);
    var fruit = box(1.5, 1.5, 1.5, AMETH, AMETH, 0.3);
    fruit.position.set(185 + ch * 6, -25, 8 + (ch % 2) * 24); g.add(fruit);
  }
  // purple void particles
  for (var vp = 0; vp < 25; vp++) {
    var dust = box(0.3, 0.3, 0.3, AMETH, AMETH, 0.8);
    dust.position.set(180 + Math.random() * 40, -35 + Math.random() * 15, 5 + Math.random() * 30);
    dust.userData.float = Math.random() * Math.PI * 2; g.add(dust);
  }
  // enderman-like dark figures (simple)
  for (var em = 0; em < 3; em++) {
    var ebody = box(1, 5, 1, 0x0a0a0a);
    ebody.position.set(190 + em * 12, -26, 30); g.add(ebody);
    var ehead = box(1.5, 1.5, 1.5, 0x0a0a0a);
    ehead.position.set(190 + em * 12, -23, 30); g.add(ehead);
    var eye1 = box(0.3, 0.3, 0.2, AMETH, AMETH, 1);
    eye1.position.set(189.7 + em * 12, -23, 30.8); g.add(eye1);
    var eye2 = box(0.3, 0.3, 0.2, AMETH, AMETH, 1);
    eye2.position.set(190.6 + em * 12, -23, 30.8); g.add(eye2);
  }
  g.add(glowLight(AMETH, 1.5, 60, 200, -20, 20));
  g.add(glowLight(END_ROD, 1, 40, 200, -15, 20));
}
