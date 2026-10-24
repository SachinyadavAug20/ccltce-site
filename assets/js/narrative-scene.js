// Voxel track + bedrock terminal. Campus/terrain in narrative-campus.js.
import * as THREE from "../vendor/three.module.js";
import { GOLD, EMER, RED, AMETH, STONE, STONE2, DEEP, DARK, DARKOAK, QUARTZ, box, glowLight, torch } from "./narrative-blocks.js";
import { buildNether, buildEnd } from "./narrative-zones.js";
import { buildCampus } from "./narrative-campus.js";
import { buildGlow } from "./narrative-glow.js";

function P(g, m, x, y, z) { m.position.set(x, y, z); g.add(m); return m; }

function buildTrack(g) {
  P(g, box(180, 1, 6, DARKOAK), 120, 3, 0); P(g, box(180, 0.3, 1.5, 0x8a8a8a), 120, 3.7, 0);
  for (var i = 0; i < 36; i++) P(g, box(1.2, 0.5, 5, 0xbd7f32), 40 + i * 5, 3.3, 0);
  var cart = P(g, box(4, 2, 3, STONE), 80, 5.5, 0); cart.userData.cart = true;
  P(g, box(2, 1.5, 2, GOLD, GOLD, 0.3), 80, 7, 0);
  for (var a = 0; a < 6; a++) {
    var ax = 50 + a * 28;
    P(g, box(2, 11, 2, STONE2), ax, 8.5, -5); P(g, box(2, 11, 2, STONE2), ax, 8.5, 5);
    P(g, box(2, 2, 12, STONE2), ax, 15, 0); P(g, box(1, 1, 1, GOLD, GOLD, 0.9), ax, 13, 0);
    g.add(glowLight(GOLD, 1, 15, ax, 13, 0));
  }
  var s1 = new THREE.Group(); s1.position.set(40, 10, 0);
  for (var u = 0; u < 4; u++) {
    var unit = box(5, 2.5, 4, DARK); unit.position.y = u * 3; s1.add(unit);
    var led1 = box(0.6, 0.6, 0.3, RED, RED, 1); led1.position.set(1.8, u * 3 + 0.5, 2.1); led1.userData.blink = u; s1.add(led1);
    var led2 = box(0.6, 0.6, 0.3, EMER, EMER, 1); led2.position.set(0.8, u * 3 + 0.5, 2.1); led2.userData.blink = u + 1; s1.add(led2);
  }
  s1.add(box(6, 4, 0.4, 0x0a2a0a, EMER, 0.25).translateX(10).translateY(4).translateZ(3));
  for (var cb = 0; cb < 5; cb++) {
    var code = box(1.5, 1, 0.3, cb % 2 ? GOLD : EMER, cb % 2 ? GOLD : EMER, 0.4);
    code.position.set(-3 + cb * 2.5, 8 + (cb % 3) * 1.5, 2); code.userData.float = cb * 1.2; s1.add(code);
  }
  g.add(s1); g.add(glowLight(RED, 1.5, 30, 40, 12, 5)); g.add(glowLight(EMER, 1, 25, 50, 12, 5));
  var s2 = new THREE.Group(); s2.position.set(120, 10, 0);
  s2.add(box(2, 10, 2, DARKOAK));
  [[-5, 4, 2], [5, 4, -2], [-3, 7, -1], [3, 7, 1], [0, 10, 0], [-1, 5, 3], [1, 5, -3]].forEach(function (np, ni) {
    var n = box(2.2, 2.2, 2.2, GOLD, GOLD, 0.3); n.position.set(np[0], np[1], np[2]); n.userData.pulse = ni * 0.8; s2.add(n);
  });
  for (var note = 0; note < 4; note++) {
    var paper = box(2, 2.5, 0.2, QUARTZ); paper.position.set(8 + (note % 2) * 3, 3 + note * 2.5, 3);
    paper.rotation.y = 0.3; paper.userData.float = note * 1.5; s2.add(paper);
  }
  g.add(s2); g.add(glowLight(GOLD, 2, 35, 120, 14, 5));
  var s3 = new THREE.Group(); s3.position.set(200, 10, 0);
  s3.add(box(4, 8, 3, 0x3d8c3d).translateY(2)); s3.add(box(5, 5, 4, 0x4caf50).translateY(9));
  s3.add(box(1, 1, 0.3, 0x0a0a0a).translateX(-1).translateY(10).translateZ(2.1));
  s3.add(box(1, 1, 0.3, 0x0a0a0a).translateX(1).translateY(10).translateZ(2.1));
  s3.add(box(2, 2, 0.3, 0x0a0a0a).translateY(8).translateZ(2.1));
  [-1, 1].forEach(function (lx) { s3.add(box(1.5, 3, 1.5, 0x3d8c3d).translateX(lx).translateY(-1)); });
  for (var sp = 0; sp < 12; sp++) {
    var spark = box(0.5, 0.5, 0.5, EMER, EMER, 1);
    spark.userData.orbit = sp * (Math.PI * 2 / 12); spark.userData.radius = 6 + (sp % 3) * 2;
    spark.userData.speed = 0.5 + (sp % 4) * 0.2; s3.add(spark);
  }
  s3.add(box(1.5, 3, 1.5, AMETH, AMETH, 0.5).translateX(7).translateY(3).translateZ(2));
  g.add(s3); g.add(glowLight(EMER, 1.8, 35, 200, 14, 5)); g.add(glowLight(AMETH, 1, 20, 207, 13, 5));
  return { s1: s1, s2: s2, s3: s3 };
}

function buildBedrock(g) {
  P(g, box(40, 3, 40, 0x1a1a1e), 200, -158, 20);
  P(g, box(40, 14, 3, DEEP), 200, -152, 3); P(g, box(3, 14, 40, DEEP), 182, -152.5, 20);
  P(g, box(12, 8, 0.8, STONE2), 200, -150, 5); P(g, box(10, 6, 0.5, 0x0a1a0a, EMER, 0.35), 200, -150, 5.6);
  P(g, box(13, 0.8, 1, GOLD, GOLD, 0.4), 200, -154, 5.5); P(g, box(13, 0.8, 1, GOLD, GOLD, 0.4), 200, -146, 5.5);
  [-8, 8].forEach(function (tx) { torch(g, 200 + tx, -151, 6); });
  g.add(glowLight(EMER, 2.5, 30, 200, -148, 12));
  for (var e = 0; e < 15; e++) {
    var ember = P(g, box(0.3, 0.3, 0.3, e % 2 ? EMER : GOLD, e % 2 ? EMER : GOLD, 1), 200 + (Math.random() - 0.5) * 25, -155 + Math.random() * 10, 10 + Math.random() * 15);
    ember.userData.float = Math.random() * Math.PI * 2;
  }
}

export function buildScene() {
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x78a7ff);
  scene.fog = new THREE.FogExp2(0x78a7ff, 0.006);
  var amb = new THREE.AmbientLight(0xffeedd, 0.55); scene.add(amb);
  var sun = new THREE.DirectionalLight(0xffffff, 1.0); sun.position.set(50, 80, 30); scene.add(sun);
  var fill = new THREE.DirectionalLight(0xffccaa, 0.35); fill.position.set(-30, 20, -40); scene.add(fill);
  var hemi = new THREE.HemisphereLight(0xaaccff, 0x665544, 0.55); scene.add(hemi);
  var world = new THREE.Group(); scene.add(world);
  buildCampus(world);
  var stations = buildTrack(world);
  buildNether(world); buildEnd(world); buildBedrock(world); buildGlow(world);
  scene.userData.skyPresets = {
    overworld: { sky: 0x78a7ff, fog: 0xbdd5ff, d: 0.0028 },
    nether: { sky: 0x4a1010, fog: 0x5e1e1e, d: 0.0085 },
    end: { sky: 0x2a1c4e, fog: 0x3a2866, d: 0.0032 },
    bedrock: { sky: 0x0a0a12, fog: 0x12121c, d: 0.010 },
  };
  return { scene: scene, stations: stations, lights: { amb: amb, sun: sun, fill: fill, hemi: hemi } };
}
