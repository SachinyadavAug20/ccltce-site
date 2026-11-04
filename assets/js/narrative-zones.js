// Nether zone — heavy Minecraft terrain detail. The End lives in narrative-end.js.
import {
  GOLD, NETHERRACK, LAVA, GLOWSTONE, SOUL, WARP, AMETH, OBSIDIAN, box, glowLight, torch, tree,
} from "./narrative-blocks.js";
import { piglin, hoglin, ghast, magmaCube, blaze, witherSkeleton } from "./narrative-mobs.js";
import { strider, piglinBrute, zombifiedPiglin } from "./narrative-mobs3.js";
import { buildBiomes } from "./narrative-biomes.js";

function P(g, m, x, y, z) { m.position.set(x, y, z); g.add(m); return m; }
function fx(g, c, n, x0, span, yMax, zSpan) {
  for (var i = 0; i < n; i++) { var p = P(g, box(0.35, 0.45, 0.35, c, c, 1), x0 + Math.random() * span, Math.random() * yMax, (Math.random() - 0.5) * zSpan); p.userData.float = Math.random() * Math.PI * 2; }
}

export function buildNether(g) {
  // Shell: ceiling + walls (netherrack). Floor top sits at y=-2 and reaches back under the
  // overworld grass (x36..200) so the two never share a coplanar face — that seam was z-fighting.
  P(g, box(160, 4, 80, NETHERRACK), 120, 22, 10); P(g, box(164, 4, 80, NETHERRACK), 118, -4, 10);
  P(g, box(160, 24, 4, NETHERRACK), 120, 9, -28); P(g, box(160, 24, 4, NETHERRACK), 120, 9, 48);
  // Entry face sealed with a doorway (z 14..30, y -1..16) so no overworld sky leaks through
  P(g, box(4, 24, 44, NETHERRACK), 40, 9, -8); P(g, box(4, 24, 20, NETHERRACK), 40, 9, 40);
  P(g, box(4, 7, 16, NETHERRACK), 40, 19.5, 22);
  // Real nether portal in the doorway — obsidian frame + purple swirl interior the camera
  // punches through (vanilla build: filled frame, oily multi-layer surface)
  var PX = 38.7;
  // Columns live inside the doorway opening, clear of the wall faces (z 14 / 30) and 1.0 wide
  // so no face is coplanar with lintel/sill (both sit at x 38.1..39.3) — buried columns were
  // invisible and shone through the wall face as flickering strips.
  P(g, box(1.0, 16, 1.2, OBSIDIAN), PX, 7.5, 14.7);          // frame columns, z 14.1..15.3 / 28.7..29.9
  P(g, box(1.0, 16, 1.2, OBSIDIAN), PX, 7.5, 29.3);
  P(g, box(1.2, 1.2, 19.6, OBSIDIAN), PX, 14.6, 22);          // lintel
  P(g, box(1.2, 1.2, 19.6, OBSIDIAN), PX, 0.7, 22);           // sill
  var swirl = P(g, box(0.4, 13.2, 15.6, 0xa855f7, 0xa855f7, 0.9), PX, 7.6, 22);
  swirl.userData.pulse = 2.2;
  P(g, box(0.25, 12, 14.4, 0xd946ef, 0xd946ef, 0.55), PX - 0.35, 7.6, 22);
  P(g, box(0.2, 11, 13.2, 0x8b2fc9, 0x8b2fc9, 0.75), PX + 0.3, 7.6, 22);
  for (var sp = 0; sp < 7; sp++) {                            // oily vortex specks drifting in the field
    var sme = P(g, box(0.55, 0.55, 0.55, 0xc084fc, 0xc084fc, 1),
      PX + (Math.random() - 0.5) * 0.6, 1.6 + Math.random() * 11.4, 14.8 + Math.random() * 14.4);
    sme.userData.float = Math.random() * Math.PI * 2;
  }
  g.add(glowLight(0xa855f7, 3, 30, 37, 7.6, 22));
  // Warm sandstone hill façade over the raw red entry wall — from the lawn the
  // portal now reads as a vanilla doorway set into a grassy/sand hill (the big red
  // slab that dominated the approach read far too harsh).
  var SS = 0xc6a86e, SCAP = 0x6a9a3f, BSK = 0x9aa08a;
  P(g, box(1.6, 24, 45.3, SS), 37, 9, -8.6);                    // south hill plane
  P(g, box(1.6, 24, 19.55, SS), 37, 9, 39.7);                   // north hill plane
  P(g, box(1.6, 4.8, 16, SS), 37, 18.6, 22);                    // hill over the doorway
  P(g, box(2.2, 1.1, 45.3, SCAP), 37, 21.6, -8.6);              // grass caps — reads as hills
  P(g, box(2.2, 1.1, 19.55, SCAP), 37, 21.6, 39.7);
  P(g, box(2.2, 1.1, 16, SCAP), 37, 21.6, 22);
  P(g, box(2.4, 2, 45.3, BSK), 36.8, -1, -8.6);                 // mossy stone skirt at the foot
  P(g, box(2.4, 2, 19.55, BSK), 36.8, -1, 39.7);
  P(g, box(2.4, 2, 16, BSK), 36.8, -1, 22);
  tree(g, 34, -18, 0.9); tree(g, 34.5, 44, 1);                  // lone saplings on the hill foot
  torch(g, 36.6, 12, 11.4); torch(g, 36.6, 12, 32.6);           // torches flank the portal door
  // Exit face sealed with a doorway (z 16..36) — the dive flies straight through it.
  // Without this the shell was open at x=200 and you saw the blue sky straight through the nether.
  P(g, box(4, 24, 46, NETHERRACK), 202, 9, -7); P(g, box(4, 24, 14, NETHERRACK), 202, 9, 43);
  P(g, box(4, 7, 20, NETHERRACK), 202, 19.5, 26);
  // Stronghold-styled exit portal room (out of the camera lane): stone-brick stairs rise from
  // the floor up to a platform where a ring of green end frames surrounds the starry field —
  // the dive falls right through the field (camera crosses its plane at x≈200, z≈26).
  for (var stp = 0; stp < 7; stp++) {
    var stop = 0.1 + stp * 1.2, sx = 189.8 + stp * 1.8;       // top step 7.3, just shy of the platform's 7.4 — an exact match shared a coplanar top face
    P(g, box(1.8, stop + 2, 9, 0x8f8f89), sx, (stop - 2) / 2, 34);
  }
  P(g, box(10.2, 9.4, 11, 0x8f8f89), 202.5, 2.7, 26);          // platform: y -2..7.4, x 197.4..207.6
  var FR = 0x3f5f44, FRT = 0x17dd62;
  for (var r = 0; r < 12; r++) {                              // 12 vanilla end-portal frames per ring: 3 per side, corners empty
    var side = Math.floor(r / 3), q = ((r % 3) - 1) * 2.15;
    var fx2 = side % 2 ? (side < 2 ? 4.3 : -4.3) : q;
    var fz2 = side % 2 ? q : (side < 2 ? 4.3 : -4.3);
    var fb = P(g, box(2, 1.1, 2, FR, FRT, 0.22), 202.5 + fx2, 7.95, 26 + fz2);
    fb.userData.pulse = side * 0.55;
  }
  [[-1.6, 3.2], [1.6, 3.2]].forEach(function (p) {            // 6.4×6.4 starry field, two panels
    var pf = P(g, box(6.4, 0.7, 3.2, 0x060a14, 0x8fd0ff, 0.3), 202.5, 7.75, 26 + p[0]);
    pf.userData.pulse = 1.4 + p[0];
    for (var st2 = 0; st2 < 6; st2++) {
      var star = box(0.12, 0.12, 0.12, st2 % 2 ? 0xffffff : 0xd8ccff, st2 % 2 ? 0xffffff : 0xd8ccff, 0.9);
      star.position.set((Math.random() - 0.5) * 5, 0.36, (Math.random() - 0.5) * 2.2);
      pf.add(star);
    }
  });
  g.add(glowLight(0x8fd0ff, 2, 22, 201, 9, 26));
  torch(g, 42.6, 0, 16); torch(g, 42.6, 0, 28);
  buildBiomes(g);   // crimson/warped/soul/basalt patches lining both sides of the camera path
  // Basalt delta pillars
  var B = 0x3a3a3e;
  for (var bp = 0; bp < 10; bp++) { var bx = 48 + bp * 15, bz = (bp % 2 ? -18 : 32); P(g, box(3 + (bp % 3), 12 + (bp % 4) * 3, 3 + (bp % 3), B), bx, 4 + (bp % 4) * 1.5, bz); }
  // Blackstone boulders + ancient debris
  for (var bl = 0; bl < 8; bl++) P(g, box(2, 1.5 + (bl % 3), 2, 0x1a1a1e), 52 + bl * 15, 0.5, (bl % 3 - 1) * 14);
  P(g, box(1.2, 1.2, 1.2, 0x6a3a2a, 0x6a3a2a, 0.2), 92, 2, -6); P(g, box(1.2, 1.2, 1.2, 0x6a3a2a, 0x6a3a2a, 0.2), 148, 2, 14);
  // Lava lakes + falls
  for (var i = 0; i < 8; i++) {
    var lz = i % 2 ? 10 : -10;
    P(g, box(12 + (i % 4) * 5, 0.6, 10, LAVA, LAVA, 0.9), 50 + i * 20, -0.5, lz);
    g.add(glowLight(LAVA, 2.5, 30, 50 + i * 20, 1, lz));
    if (i % 2 === 0) P(g, box(1.5, 8 + (i % 3) * 2, 0.5, LAVA, LAVA, 0.9), 55 + i * 20, 5, -24);
  }
  // Glowstone clusters on ceiling
  for (var gs = 0; gs < 14; gs++) {
    var gx = 45 + gs * 12, gz = (gs % 4 - 1.5) * 12;
    P(g, box(2.5, 2, 2.5, GLOWSTONE, GLOWSTONE, 0.9), gx, 18 + (gs % 3), gz);
    P(g, box(1.5, 1, 1.5, GLOWSTONE, GLOWSTONE, 0.9), gx + 1.5, 17.5, gz);
    g.add(glowLight(GLOWSTONE, 1.5, 22, gx, 17, gz));
  }
  // Nether wart farm + crimson + warped forests
  P(g, box(8, 0.5, 4, 0x5a1a1a), 90, 0.3, 8);
  for (var w2 = 0; w2 < 6; w2++) P(g, box(0.5, 0.8 + (w2 % 3) * 0.4, 0.5, 0xaa1111), 87 + w2 * 1.2, 0.8, 8);
  for (var w = 0; w < 10; w++) {
    var wz = w % 2 ? -16 : 34;
    P(g, box(0.7, 4 + (w % 3), 0.7, WARP), 55 + w * 15, 2, wz);
    P(g, box(3, 1.2, 3, SOUL, SOUL, 0.25), 55 + w * 15, 4.5 + (w % 3), wz);
  }
  for (var c = 0; c < 6; c++) {
    var cz = c % 2 ? -14 : 14;
    P(g, box(0.6, 3, 0.6, 0x8b2222), 100 + c * 14, 1.5, cz);
    P(g, box(2.5, 1, 2.5, 0xcc3333), 100 + c * 14, 3.5, cz);
  }
  // Fortress: pillars, battlements, walkway, nether brick roof
  var FB = 0x2a1520;
  for (var f = 0; f < 6; f++) {
    var px = 60 + f * 28;
    // pillars stop exactly where the cross-beam starts (no shared faces)
    P(g, box(3.5, 16.75, 3.5, FB), px, 7.375, -7); P(g, box(3.5, 16.75, 3.5, FB), px, 7.375, 7);
    P(g, box(3.5, 2.5, 17, FB), px, 17, 0);
    for (var b = 0; b < 4; b++) P(g, box(1.5, 1.5, 1.5, FB), px, 19, -6 + b * 4);
  }
  P(g, box(170, 1.5, 5, FB), 120, 3.5, 0);
  for (var ss = 0; ss < 5; ss++) P(g, box(4, 0.5, 4, 0x4a3a2a), 70 + ss * 25, -0.5, ss % 2 ? -12 : 12);
  // Bastion remnant (blackstone) — kept at z -18, clear of the camera path.
  // Stepped footprint per segment so no two boxes share a side plane (nested boxes z-fought).
  var SZ = [4, 3.4, 2.8];
  var BK = 0x2a2a2e;
  for (var bb = 0; bb < 3; bb++) P(g, box(SZ[bb], bb ? 2 : 8, SZ[bb], BK), 168, bb ? 6 + bb * 2 : 3, -18);
  P(g, box(18, 2, 12, BK), 168, 12, -18); P(g, box(12, 3, 8, 0x1a1a1e), 168, 14.5, -18);
  P(g, box(6, 5, 6, GOLD, GOLD, 0.3), 168, 17, -18);
  g.add(glowLight(GOLD, 2, 30, 168, 18, -18));
  // soul-sand valley alcove — sits where the camera's first southern swing lands (x≈98, z≈17)
  P(g, box(7, 0.9, 3.4, 0x4a3a3a), 96, -1.55, 11.5);            // soul sand ridge
  P(g, box(5, 0.6, 1.6, 0x553f38), 95, -2.1, 12.6);
  var soulFire = P(g, box(0.45, 1.35, 0.45, 0x53d3e0, 0x53d3e0, 1.4), 96, -0.75, 11.5);
  soulFire.userData.pulse = 1.1;
  var soulFire2 = P(g, box(0.4, 1.05, 0.4, 0x7fe6f0, 0x7fe6f0, 1.2), 99.5, -0.85, 12.3);
  soulFire2.userData.pulse = 2.6;
  P(g, box(0.22, 1.1, 0.22, 0x30302e), 97.6, -1.35, 12.1);      // soul lantern pole
  P(g, box(0.5, 0.6, 0.5, 0x63c9d8, 0x9ff0fa, 0.9), 97.6, -0.6, 12.1);
  g.add(glowLight(0x53d3e0, 1.8, 20, 96, 0, 11.5));
  // basalt break + lava fall — behind the second nether bend (x≈186, z≈9)
  P(g, box(2.6, 15, 2.6, 0x3a3a3e), 186, 5.5, 9);
  P(g, box(2, 11, 2, B), 189.5, 3.5, 11.5);
  P(g, box(1.6, 8.5, 1.6, 0x2e2e33), 182.6, 2.25, 12.5);
  var lfall = P(g, box(1.3, 12, 0.5, LAVA, LAVA, 0.9), 186, 4.5, 7.4);
  lfall.userData.pulse = 3.1;
  g.add(glowLight(LAVA, 2, 26, 186, 6, 7.4));
  P(g, box(4.5, 0.5, 4.5, LAVA, LAVA, 0.9), 187.5, -0.25, 7.5);  // fall pool
  // bastion watchtower with a gold hoard cap — juts where the S bumps north (x≈174, z≈10)
  P(g, box(4.6, 9, 4.6, 0x2a2a2e), 174, 2.5, 10);
  P(g, box(3.4, 1.4, 3.4, 0x1f1f23), 174, 7.7, 10);
  P(g, box(2.6, 1.6, 2.6, GOLD, GOLD, 0.35), 174, 9.2, 10);
  P(g, box(1.1, 0.55, 1.1, GOLD, GOLD, 0.5), 172.4, 6.1, 10.4);  // hoop nuggets
  P(g, box(1, 0.5, 1, GOLD, GOLD, 0.5), 175.6, 4.6, 9.4);
  g.add(glowLight(GOLD, 1.4, 24, 174, 9.5, 10));
  // Mobs — grounded on the floor top (y=-2); striders stand on lava (top y=-0.2)
  piglin(g, 55, -2, -4); piglin(g, 95, -2, 5); piglin(g, 140, -2, -3);
  piglinBrute(g, 152, -2, 14); piglinBrute(g, 110, 4, 0);
  hoglin(g, 75, -2, 8); hoglin(g, 130, -2, -8);
  zombifiedPiglin(g, 62, -2, 6); zombifiedPiglin(g, 105, -2, -7); zombifiedPiglin(g, 158, 4, 2);
  ghast(g, 100, 16, -10); ghast(g, 150, 14, 12);
  magmaCube(g, 65, -2, 4); magmaCube(g, 115, -2, -5); magmaCube(g, 155, -2, 6);
  blaze(g, 85, 14, -3); blaze(g, 145, 15, 4);
  witherSkeleton(g, 70, 4, -2); witherSkeleton(g, 125, -2, 3); witherSkeleton(g, 160, -2, -4);
  strider(g, 78, -0.2, 10); strider(g, 132, -0.2, -10); strider(g, 110, -0.2, 10);
  fx(g, SOUL, 25, 45, 150, 20, 35); fx(g, LAVA, 15, 50, 140, 15, 30);
  g.add(glowLight(0xff6622, 2, 100, 100, 5, 0)); g.add(glowLight(LAVA, 1.5, 70, 80, 0, 5));
}

// The End (island, pillars, crystals, city, gateway, boss) lives in its own module.
export { buildEnd } from "./narrative-end.js";
