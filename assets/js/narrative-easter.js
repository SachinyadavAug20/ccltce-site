// narrative-easter.js — Minecraft lore scattered across the journey: a watching creeper,
// noob dirt hut, crafting table + furnace, TNT prank, note block, iron golem, gate sign,
// nether ghasts, piglin barter stand, soul lanterns, redstone torches, wither skull pikes,
// a cozy nether bookshelf, chorus plants, an endermite, a shulker, the floating enchant
// book, and a wither silhouette lurking beneath the End — each with a dedicated updater.
import * as THREE from "../vendor/three.module.js";
import { box, glowLight, GOLD, EMER, RED, STONE, DARK, DARKOAK, OAK, NETHERRACK,
  PURPUR, END_ROD, GLOWSTONE, SOUL, CRIM, LAVA, DIRT, GRASS, LEAF } from "./narrative-blocks.js";

function P(g, m, x, y, z) { m.position.set(x, y, z); g.add(m); return m; }

var creepers = [], ghasts = [], notes = [], mites = [], books = [], shulkers = [], withers = [], smokes = [], jebs = [], rodCage = null;

export function buildEaster(scene) {
  // ---- OVERWORLD: campus lawn (ground top y = -1, camera lane z = 10 + x/2) ----
  var camp = new THREE.Group(); scene.add(camp);

  // jeb_ — the name-tag rainbow sheep, canon from the wiki
  var jeb = new THREE.Group(); camp.add(jeb); jeb.position.set(28, -1, 20.5);
  var jebBody = P(jeb, box(1, 1.05, 1.55, 0xf4f4f4), 0, 1.1, 0);
  P(jeb, box(0.72, 0.75, 0.72, 0xebe0d0), 0, 0.9, 1.05);              // head (front)
  P(jeb, box(0.16, 0.16, 0.06, 0x101010), -0.18, 1, 1.44);
  P(jeb, box(0.16, 0.16, 0.06, 0x101010), 0.18, 1, 1.44);
  [[-0.3, 0.62], [0.3, 0.62], [-0.3, -0.62], [0.3, -0.62]].forEach(function (lg) {
    P(jeb, box(0.22, 0.75, 0.22, 0xffffff), lg[0], 0.35, lg[1]);
  });
  var jebs = [{ m: jebBody, mat: jebBody.material }];

  // Dinnerbone pig — named mobs render upside-down, kept so on purpose
  var pigD = new THREE.Group(); camp.add(pigD); pigD.position.set(25, -1, 18); pigD.rotation.z = Math.PI;
  var pigBody = P(pigD, box(1, 0.95, 1.5, 0xeda3a1), 0, 0.85, 0);
  P(pigD, box(0.74, 0.74, 0.64, 0xeda3a1), 0, 0.62, 0.95);
  P(pigD, box(0.36, 0.18, 0.08, 0xd18a88), 0, 0.55, 1.32);            // snout
  [[-0.24, 0.55], [0.24, 0.55], [-0.24, -0.55], [0.24, -0.55]].forEach(function (lg) {
    P(pigD, box(0.2, 0.45, 0.2, 0xeda3a1), lg[0], 0.25, lg[1]);
  });

  // herobrine — a steve figure with solid white eyes watching from the brush (removed, allegedly)
  var hrb = new THREE.Group(); camp.add(hrb); hrb.position.set(26, -1, 35.5);
  P(hrb, box(0.72, 1.05, 0.4, 0x2f7d7d), 0, 1.35, 0);                // teal shirt torso
  P(hrb, box(0.52, 0.52, 0.52, 0xc4916e), 0, 2.15, 0);               // head skin tone
  P(hrb, box(0.6, 0.35, 0.56, 0x4a3524), 0, 1.62, 0);                // beard band w/ hair
  P(hrb, box(0.6, 0.12, 0.56, 0x4a3524), 0, 2.4, 0);
  var hEyes = P(hrb, box(0.4, 0.14, 0.06, 0xffffff, 0xffffff, 1.8), 0, 2.2, 0.28);   // WHITE glowing eyes
  P(hrb, box(0.66, 0.95, 0.34, 0x3a4aa2), 0, 0.4, 0);                // jeans body block
  P(hrb, box(0.26, 1, 0.3, 0x2f7d7d), -0.48, 1.45, 0);               // arms
  P(hrb, box(0.26, 1, 0.3, 0x2f7d7d), 0.48, 1.45, 0);
  P(hrb, box(0.24, 0.85, 0.3, 0x3a4aa2), -0.2, 0.42, 0);
  P(hrb, box(0.24, 0.85, 0.3, 0x3a4aa2), 0.2, 0.42, 0);
  creepers.push(hrb);                                                // it watches, like the creeper

  // campfire with rising smoke right by the furnace
  var cf = new THREE.Group(); camp.add(cf); cf.position.set(-6.4, -0.9, 16.2);
  P(cf, box(1.4, 0.18, 1.4, OAK), 0, 0.1, 0);                        // base
  P(cf, box(0.2, 0.5, 1.1, DARKOAK), 0, 0.4, 0).rotation.z = 1.2;     // crossed logs
  var log2 = P(cf, box(0.2, 1.1, 0.5, DARKOAK), 0, 0.4, 0); log2.rotation.x = 1.2;
  P(cf, box(0.55, 0.4, 0.55, GOLD, GOLD, 1.3), 0, 0.62, 0);          // ember mound
  cf.add(glowLight(GOLD, 1.5, 10, -6.4, 0.2, 16.2));
  for (var smk = 0; smk < 5; smk++) {
    var sf = P(camp, box(0.22, 0.22, 0.22, 0xdddddd), -6.4, 0.6, 16.2);
    sf.material.transparent = true;
    smokes.push({ m: sf, base: 0.6, ph: smk * 0.85, bx: -6.4, bz: 16.2 });
  }

  var sign = P(camp, box(0.22, 1.7, 0.22, OAK), 1.8, -0.15, 17.8);   // gate sign post
  var board = P(camp, box(2, 1.2, 0.16, OAK), 1.8, 0.6, 17.8);
  for (var l = 0; l < 3; l++) P(camp, box(1.5, 0.09, 0.18, DARK), 1.8, 0.95 - l * 0.32, 17.8);

  // crafting table + furnace pair beside the path
  P(camp, box(1, 0.95, 1, 0x8a5a2b), -4.2, -0.5, 18.5);
  P(camp, box(1.06, 0.12, 1.06, 0xc59b63), -4.2, 0.05, 18.5);        // lighter crafting top
  P(camp, box(0.18, 0.1, 1.06, 0x4a3219), -4.2, 0.12, 18.5);         // grid line
  P(camp, box(1.06, 0.1, 0.18, 0x4a3219), -4.2, 0.12, 18.5);
  P(camp, box(1.1, 1.1, 1.1, STONE), -6.4, -0.45, 18.8);             // furnace
  P(camp, box(0.8, 0.35, 0.06, 0x1a1a1a), -6.4, -0.15, 18.24);       // vent face (south)
  P(camp, box(0.8, 0.35, 0.05, LAVA, LAVA, 1.1), -6.4, -0.75, 18.27); // burning mouth
  camp.add(glowLight(LAVA, 1.2, 9, -6.4, -0.4, 17.6));

  // TNT block + redstone torch, the club's idea of a prank
  P(camp, box(1, 1, 1, 0xd63c2f), -8.6, -0.5, 19);
  P(camp, box(1.04, 0.3, 1.04, 0xf0f0f0), -8.6, -0.5, 19);
  P(camp, box(1.04, 0.28, 1.02, 0x1a1a1a), -8.6, -0.2, 19);
  P(camp, box(0.18, 0.7, 0.18, 0x7a4426), -7.4, -0.65, 19);          // redstone torch stick
  P(camp, box(0.36, 0.26, 0.36, 0xff5533, 0xff5533, 1.2), -7.4, -0.1, 19);
  camp.add(glowLight(0xff5533, 1.1, 8, -7.4, 0.2, 19));

  // note block — pulses like it's playing, notes float off the top
  var nb = P(camp, box(1, 1, 1, 0x6b4a26), -10, -0.5, 15);
  nb.userData.pulse = 0;
  P(camp, box(0.34, 0.08, 0.34, EMER, EMER, 1), -10.35, 0.06, 15.35); // note dot
  var NOTE_COLS = [GOLD, EMER, 0xff66cc, 0x66ccff];
  for (var nq = 0; nq < 4; nq++) {
    var nm = P(camp, box(0.22, 0.22, 0.05, NOTE_COLS[nq], NOTE_COLS[nq], 0.9), -10, 0.9, 15);
    nm.material.transparent = true;
    notes.push({ m: nm, base: 0.9 + nq * 0.24, ph: nq * 0.7 });
  }

  // iron golem stands guard right of the gate
  var ig = new THREE.Group(); camp.add(ig); ig.position.set(5.5, -0.1, 22);
  P(ig, box(1.9, 1.5, 1.1, 0xd8d8d0), 0, 1.15, 0);
  P(ig, box(0.8, 0.65, 0.7, 0xe4e4dc), 0, 2.15, 0);
  P(ig, box(0.5, 1.6, 0.6, 0xd8d8d0), -1.15, 0.85, 0).rotation.z = 0.1;
  P(ig, box(0.5, 1.6, 0.6, 0xd8d8d0), 1.15, 0.85, 0).rotation.z = -0.1;
  P(ig, box(0.42, 0.7, 0.48, 0xd8d8d0), -0.4, -0.45, 0);
  P(ig, box(0.42, 0.7, 0.48, 0xd8d8d0), 0.4, -0.45, 0);
  P(ig, box(0.16, 0.14, 0.05, 0x2a2a2a), -0.22, 2.22, 0.37);          // stern eyes
  P(ig, box(0.16, 0.14, 0.05, 0x2a2a2a), 0.22, 2.22, 0.37);
  P(ig, box(0.3, 0.14, 0.05, 0x2a2a2a), 0, 1.98, 0.37);               // vine lip

  // creeper lurking right of the lane — silently rotates to face the camera
  var cp = new THREE.Group(); camp.add(cp); cp.position.set(20, -1, 8);
  P(cp, box(0.6, 1.15, 0.35, GRASS), 0, 0.75, 0);                     // body
  P(cp, box(0.62, 0.62, 0.62, GRASS), 0, 1.6, 0);                     // head
  P(cp, box(0.12, 0.12, 0.05, 0x101010), -0.16, 1.72, 0.32);          // eyes
  P(cp, box(0.12, 0.12, 0.05, 0x101010), 0.16, 1.72, 0.32);
  P(cp, box(0.16, 0.26, 0.05, 0x101010), 0, 1.48, 0.32);              // drop mouth
  P(cp, box(0.2, 0.42, 0.24, GRASS), -0.2, 0.2, -0.05);               // legs
  P(cp, box(0.2, 0.42, 0.24, GRASS), 0.2, 0.2, 0.05);
  creepers.push(cp);

  // noob dirt hut — the classic starter base
  var hut = new THREE.Group(); camp.add(hut); hut.position.set(36, -1, 33);
  P(hut, box(4.4, 0.5, 4.4, DIRT), 0, 0.05, 0);                      // raised dirt pad
  P(hut, box(4, 3, 4, DIRT), 0, 2, 0);
  P(hut, box(1.15, 2.4, 0.2, 0x1a1a1a), 0, 1.5, 2.05);               // doorway void
  P(hut, box(0.9, 0.9, 0.12, 0x78a7ff), -1.4, 1.9, 2.02);            // glass window (south)
  P(hut, box(0.9, 0.9, 0.12, 0x78a7ff), 2.02, 1.9, 1.4).rotation.y = 1.5708; // east window
  P(hut, box(4.8, 0.4, 4.8, OAK), 0, 3.9, 0);                        // plank roof
  P(hut, box(4, 0.35, 4, DARKOAK), 0, 4.25, 0);
  var htorch = P(hut, box(0.24, 0.9, 0.24, 0x7a4426), 1.4, 2.6, 1.55);
  htorch.rotation.x = 0.5;
  P(hut, box(0.4, 0.3, 0.4, GOLD, GOLD, 1), 1.4, 3.05, 1.55);
  hut.add(glowLight(GOLD, 1.4, 10, 37.4, 2.6, 34.55));               // warm interior
  // bed inside
  P(hut, box(0.5, 0.2, 0.9, 0xb02e26), -1.3, 0.6, -1.3);
  P(hut, box(0.5, 0.2, 0.35, 0xf0f0f0), -1.3, 0.62, -0.75);

  // ---- NETHER (floor y = -2; camera lane z ≈ 21..26, x 40..204) ----
  var neth = new THREE.Group(); scene.add(neth);

  // wither skeleton skull pikes near the portal mouth
  for (var sp = 0; sp < 3; sp++) {
    var px = 44.5 + sp * 1.3, ph2 = sp * 2.2;
    P(neth, box(0.14, 2.2, 0.14, 0x2a2a26), px, -1.1, 33.5);          // pike
    P(neth, box(0.66, 0.66, 0.55, 0x3a3a38), px, 0.35, 33.5);         // skull
    P(neth, box(0.14, 0.2, 0.06, 0x0c0c0c), px - 0.15, 0.4, 33.78)    // sockets + jaw
      .userData.shk = false;
    P(neth, box(0.14, 0.2, 0.06, 0x0c0c0c), px + 0.15, 0.4, 33.78);
    P(neth, box(0.4, 0.1, 0.05, 0x0c0c0c), px, 0.14, 33.79);
    P(neth, box(0.1, 0.7, 0.1, 0x232323), px, 1, 33.5);               // horn nubs
    P(neth, box(0.1, 0.7, 0.1, 0x232323), px, 1, 33.5).position.z = 33.4;
  }

  // piglin barter stand — gold ingots + glowstone lantern on a blackstone slab
  P(neth, box(3.4, 0.5, 2.4, 0x232126), 112, -1.75, 36);
  P(neth, box(1, 1, 1, GOLD, GOLD, 0.4), 111.2, -1, 36);
  P(neth, box(0.9, 0.36, 0.5, GOLD, GOLD, 0.5), 111.2, -0.9, 36);
  P(neth, box(0.9, 0.36, 0.5, 0xd8b13c, 0xd8b13c, 0.5), 112.6, -1.25, 36.4);
  P(neth, box(0.9, 0.3, 1, 0xd8b13c, 0xd8b13c, 0.5), 112.6, -1.5, 35.7);
  P(neth, box(0.8, 0.8, 0.8, GLOWSTONE, GLOWSTONE, 1), 112, -0.55, 35.2);
  neth.add(glowLight(GLOWSTONE, 1.6, 14, 112, 0, 36));

  // soul lanterns (teal) sprinkled along the walls, colder than the regular glow
  [[70, 4.3, 36.4], [96, 4.3, 36.4], [148, 4.3, 36.4]].forEach(function (p, i) {
    P(neth, box(0.5, 0.6, 0.5, 0x2dd4a8, 0x2dd4a8, 1.1), p[0], p[1], p[2]);
    P(neth, box(0.16, 0.5, 0.16, 0x16161a), p[0], p[1] + 0.75, p[2]);
    neth.add(glowLight(SOUL, 1.1 + i * 0.2, 11, p[0], p[1], p[2]));
  });

  // redstone torches on the far wall (they read "this base has power")
  [[128, 3.6, 36.6], [170, 3.6, 8.6]].forEach(function (p) {
    P(neth, box(0.16, 0.75, 0.16, 0x4a2a1e), p[0], p[1], p[2]);
    P(neth, box(0.32, 0.24, 0.32, 0xff5533, 0xff5533, 1.4), p[0], p[1] + 0.62, p[2]);
    neth.add(glowLight(0xff5533, 0.9, 8, p[0], p[1], p[2]));
  });

  // blaze spawner — a mob spawner cage with rods spinning inside (pillar corner x 148)
  var cage = new THREE.Group(); neth.add(cage); cage.position.set(150, 2.6, 32.5);
  P(cage, box(1.7, 0.18, 1.7, 0x2a2a2a), 0, -0.8, 0);                 // bottom plate
  P(cage, box(1.7, 0.18, 1.7, 0x3a3a3e), 0, 0.8, 0);                  // top plate
  [[0, 0], [0.78, 0], [0, 0.78], [0.78, 0.78]].forEach(function (cc) {
    P(cage, box(0.14, 1.6, 0.14, 0x33333a), cc[0] - 0.39, 0, cc[1] - 0.39);  // corner pillars
  });
  var rodA = P(cage, box(0.24, 1.15, 0.24, GOLD, GOLD, 1.2), -0.1, 0.1, -0.1);
  var rodB = P(cage, box(0.2, 0.9, 0.2, 0xffd86b, 0xffd86b, 1), 0.15, -0.1, 0.15);
  rodCage = { a: rodA, b: rodB };
  neth.add(glowLight(GOLD, 1.3, 12, 150, 2.6, 32.5));

  // cozy bookshelves — reading corner deep in the fortress
  [[163, 36.4], [164.2, 36.4]].forEach(function (p, i) {
    P(neth, box(1.05, 2.2, 0.6, OAK), p[0], 0.2, p[1]);
    var shelfCols = [0x9a2828, 0x286a9a, 0x9a8028, 0x288a4a, 0x8a289a];
    for (var s2 = 0; s2 < 6; s2++) {
      var sx = p[0] - 0.42 + (s2 % 3) * 0.42, sy = i === 0 ? (s2 < 3 ? -0.35 : 0.75) : (s2 < 3 ? 0.75 : -0.35);
      P(neth, box(0.36, 0.85, 0.3, shelfCols[s2]), sx, sy, p[1]);
    }
  });

  // ghasts bob high in the cavern — they always know where you are
  [[98, 21, 30], [138, 23.5, 26]].forEach(function (gh, gi) {
    var grp = new THREE.Group(); neth.add(grp); grp.position.set(gh[0], gh[1], gh[2]);
    var body = P(grp, box(2.6, 2.6, 2.4, 0xe8e8e2), 0, 0, 0);
    P(grp, box(0.5, 0.28, 0.08, 0x202020), -0.55, 0.45, 1.22);        // eyes
    P(grp, box(0.5, 0.28, 0.08, 0x202020), 0.55, 0.45, 1.22);
    ghasts.push({ g: grp, base: gh[1], ph: gi * 2.1, tent: [] });
    for (var t = 0; t < 9; t++) {
      var tm = P(grp, box(0.26, 2.5, 0.26, 0xe8e8e2), (t % 3 - 1) * 0.78, -1.75, (Math.floor(t / 3) - 1) * 0.5);
      ghasts[gi].tent.push(tm);
    }
  });

  // ---- END (island surface y = -126; gateway rim spans x 194.3..205.7, z 14.3..25.7) ----
  var end = new THREE.Group(); scene.add(end);

  // chorus plants on the rim — purple twists with knobs
  [[209, -126, 11.5], [192, -126, 27.5]].forEach(function (c, ci) {
    var h = 4.2 + ci * 1.4;
    P(end, box(0.7, h, 0.7, 0x9a6fb5), c[0], c[1] - 0.4 + h / 2, c[2]);
    P(end, box(1.25, 1.25, 1.25, 0x9a6fb5), c[0], c[1] - 0.4 + h, c[2]);
    P(end, box(1, 3.2, 1, 0x8a5fa8), c[0] + 0.85, c[1] - 0.4 + h - 0.9, c[2] + (ci ? -0.7 : 0.7)).rotation.z = 0.35;
    P(end, box(0.9, 0.9, 0.9, 0xa87fb5), c[0] + 0.85, c[1] - 0.4 + h + 0.5, c[2] + (ci ? -1 : 1)).userData.pulse = ci * 1.3;
  });

  // shulker hinged open on the ledge
  var shkG = new THREE.Group(); end.add(shkG); shkG.position.set(204.9, -126, 11.8);
  P(shkG, box(1, 0.7, 1, 0x9a6fb5), 0, 0.35, 0);
  var lid = P(shkG, box(0.94, 0.55, 0.94, 0x8a5fa8), 0, 0.62, -0.34);
  P(lid, box(0.35, 0.3, 0.35, 0xf3e2b5), 0, -0.05, 0.2);              // pearl peeking out
  shulkers.push({ g: shkG, lid: lid, ph: 1.2 });

  // endermite patrol loop
  var mite = new THREE.Group(); end.add(mite);
  P(mite, box(0.62, 0.36, 0.4, 0x8a3d9a), 0, 0.18, 0);
  P(mite, box(0.42, 0.3, 0.34, 0xc273e0), 0, 0.16, 0.32);             // head
  P(mite, box(0.1, 0.1, 0.05, 0xff66cc, 0xff66cc, 1.3), 0, 0.2, 0.5);
  mites.push({ g: mite, cx: 196.5, cz: 10.5, r: 2.2, ph: 0 });

  // floating enchanting book — knowingly NOT a dragon egg
  var bg2 = new THREE.Group(); end.add(bg2); bg2.position.set(207.2, -124.15, 17);
  P(bg2, box(1.05, 0.14, 1.3, 0xb0682e), 0, 0, 0);
  P(bg2, box(0.8, 0.1, 1.16, 0xf4efe0), 0, 0.1, 0).rotation.z = 0.25; // pages fan
  var tassel = P(bg2, box(0.1, 0.4, 0.1, 0xd8b13c), -0.35, -0.18, 0.5);
  tassel.rotation.x = 0.7;
  var blinker = P(bg2, box(0.14, 0.14, 0.14, 0xd0b0ff, 0xd0b0ff, 1.2), 0.2, 0.35, 0.15);
  blinker.userData.blink = 0;
  // standard galactic glyphs on the page — lore-accurate unreadable enchant text
  [[-0.1, 0.16, 0.58, 0], [0.12, 0.18, 0.5, 1], [-0.02, 0.2, 0.44, 0]].forEach(function (gl, gi) {
    var gm = P(bg2, box(0.16, 0.05, 0.2, 0x9a6bd8, 0xb28ce8, 1.1), gl[0], gl[1], gl[2]);
    if (gi % 2) gm.rotation.z = 0.5;
  });
  books.push({ g: bg2, base: -124.15, ph: 0 });

  // wither silhouette lurking in the void below — coming soon, tag it if you spot it
  var wth = new THREE.Group(); scene.add(wth); wth.position.set(224, -152, 44);
  P(wth, box(1.4, 4.2, 1.1, 0x1c1c1f), 0, 0, 0);                     // spine
  P(wth, box(4.4, 1.2, 0.9, 0x1c1c1f), 0, 1.2, 0);                   // shoulder rib
  P(wth, box(3.6, 0.7, 0.8, 0x1c1c1f), 0, -1, 0);
  [[-1.7, 0], [0, 0.4], [1.7, 0]].forEach(function (h, hi) {
    P(wth, box(1.15, 1.1, 1, 0x18181b), h[0], 2.6, h[1]);
    var eye = P(wth, box(0.2, 0.16, 0.08, 0x7fe0d8, 0x7fe0d8, 1.6), h[0], 2.66, 0.55);
    eye.userData.pulse = hi * 1.1;                                   // soul-fire eyes
  });
  P(wth, box(0.6, 2.2, 0.6, 0x1c1c1f), -1.1, -2.4, 0).rotation.x = 0.3;
  P(wth, box(0.6, 2.2, 0.6, 0x1c1c1f), 1.1, -2.4, 0).rotation.x = -0.3;
  wth.rotation.y = -0.5;
  withers.push({ g: wth, base: -152 });

  scene.add(neth); scene.add(end);
  return {
    update: function (el, camera) {
      var cam = camera || { position: { x: 20, z: 8 } };
      for (var i = 0; i < creepers.length; i++) {                      // the creeper simply watches
        var c = creepers[i], dp = Math.atan2(cam.position.x - c.position.x, cam.position.z - c.position.z);
        c.rotation.y += (dp - c.rotation.y) * 0.03;
      }
      for (i = 0; i < ghasts.length; i++) {                            // ghasts bob + tentacle sway
        var gh = ghasts[i];
        gh.g.position.y = gh.base + Math.sin(el * 0.42 + gh.ph) * 1.6;
        for (var t2 = 0; t2 < gh.tent.length; t2++) gh.tent[t2].rotation.x = Math.sin(el * 1.8 + gh.ph + t2) * 0.3;
      }
      for (i = 0; i < notes.length; i++) {                             // note block particles
        var nt = notes[i], cy = (el * 1.5 + nt.ph) % 2.4;
        nt.m.position.y = nt.base + cy;
        nt.m.material.opacity = Math.max(0, 1 - cy / 2.4);
        nt.m.rotation.y = el * 2 + nt.ph;
      }
      for (i = 0; i < mites.length; i++) {                            // endermite patrol
        var mt = mites[i], ma = el * 0.9 + mt.ph;
        mt.g.position.set(mt.cx + Math.cos(ma) * mt.r, -126 + 0.3, mt.cz + Math.sin(ma) * mt.r);
        mt.g.rotation.y = ma + Math.PI / 2;
      }
      for (i = 0; i < books.length; i++) {                            // enchant book hover
        var bk = books[i];
        bk.g.position.y = bk.base + Math.sin(el * 1.1 + bk.ph) * 0.35;
        bk.g.rotation.y = Math.sin(el * 0.7 + bk.ph) * 0.6;
      }
      for (i = 0; i < shulkers.length; i++) {                         // shulker peek-a-boo
        var sh = shulkers[i], open = Math.sin(el * 0.6 + sh.ph) > 0.35 ? 1 : 0;
        sh.lid.rotation.x += (-open * 0.95 - sh.lid.rotation.x) * 0.12;
        sh.g.position.y = -126 + (Math.sin(el * 0.6 + sh.ph) > 0.35 ? 0.08 : 0);
      }
      for (i = 0; i < withers.length; i++) {                          // wither slow hover
        var w2 = withers[i];
        w2.g.position.y = w2.base + Math.sin(el * 0.35 + i) * 2.2;
        w2.g.rotation.y += 0.0025;
      }
      if (rodCage) {                                                   // blaze spawner rods spin
        rodCage.a.rotation.x = el * 3.1; rodCage.a.rotation.y = el * 1.3;
        rodCage.b.rotation.x = -el * 3.4; rodCage.b.rotation.y = -el * 1.7;
      }
      for (i = 0; i < jebs.length; i++) {                             // jeb_ rainbow sheep
        jebs[i].mat.color.setHSL((el * 0.12) % 1, 0.85, 0.55);
      }
      for (i = 0; i < smokes.length; i++) {                           // campfire smoke
        var sk = smokes[i], sf2 = (el * 0.9 + sk.ph) % 3.4;
        sk.m.position.y = sk.base + sf2;
        sk.m.position.x = sk.bx + Math.sin(el * 0.8 + sk.ph) * 0.35;
        sk.m.material.opacity = Math.max(0, 0.8 - sf2 / 3.4 * 0.85);
        sk.m.scale.setScalar(1 + sf2 * 0.7);
      }
    },
  };
}
