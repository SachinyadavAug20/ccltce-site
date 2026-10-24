// Voxel campus + track + bedrock scene builder. Uses shared block helpers.
import * as THREE from "../vendor/three.module.js";
import { GOLD, EMER, RED, AMETH, STONE, STONE2, DEEP, DARK, OAK, DARKOAK, QUARTZ, box, glowLight } from "./narrative-blocks.js";

function buildCampus(g) {
  var ground = box(140, 2, 100, 0x2d5a1e); ground.position.set(0, -2, -10); g.add(ground);
  var dirt = box(140, 4, 100, 0x6b4423); dirt.position.set(0, -5, -10); g.add(dirt);
  var l = box(5, 20, 5, STONE); l.position.set(-12, 9, -8); g.add(l);
  var r = box(5, 20, 5, STONE); r.position.set(12, 9, -8); g.add(r);
  var top = box(32, 5, 5, STONE); top.position.set(0, 21, -8); g.add(top);
  var roof = box(36, 2, 8, DARKOAK); roof.position.set(0, 24, -8); g.add(roof);
  var sign = box(14, 3, 0.5, GOLD, GOLD, 0.5); sign.position.set(0, 21, -5.2); g.add(sign);
  g.add(glowLight(GOLD, 2, 30, 0, 20, -4));
  [-10, 10].forEach(function (x) {
    var torch = box(1.2, 2, 1.2, OAK); torch.position.set(x, 16, -5); g.add(torch);
    var flame = box(0.8, 1.2, 0.8, GOLD, GOLD, 1); flame.position.set(x, 17.5, -5); g.add(flame);
    g.add(glowLight(GOLD, 1.8, 25, x, 17, -4));
  });
  var bld = box(50, 14, 20, STONE2); bld.position.set(0, 6, -30); g.add(bld);
  var roofB = box(54, 2, 22, DARKOAK); roofB.position.set(0, 14, -30); g.add(roofB);
  for (var i = 0; i < 8; i++) {
    var win = box(3, 4, 0.5, GOLD, GOLD, 0.4);
    win.position.set(-20 + i * 5.7, 7, -20); g.add(win);
  }
  var door = box(6, 8, 0.5, DARKOAK); door.position.set(0, 3, -20); g.add(door);
  for (var p = 0; p < 10; p++) {
    var slab = box(4, 0.4, 3, STONE);
    slab.position.set((p % 2 ? 2 : -2), -0.8, 2 - p * 3); g.add(slab);
  }
  for (var t = 0; t < 5; t++) {
    var tp = box(0.8, 0.8, 0.8, GOLD, GOLD, 0.8);
    tp.position.set(-6, 0, 0 - t * 5); g.add(tp);
    g.add(glowLight(GOLD, 0.8, 12, -6, 1, 0 - t * 5));
  }
  for (var e = 0; e < 20; e++) {
    var ember = box(0.3, 0.3, 0.3, GOLD, GOLD, 1);
    ember.position.set((Math.random() - 0.5) * 40, Math.random() * 18, (Math.random() - 0.5) * 30);
    ember.userData.float = Math.random() * Math.PI * 2;
    g.add(ember);
  }
}

function buildTrack(g) {
  var bed = box(180, 1, 6, DARKOAK); bed.position.set(120, 3, 0); g.add(bed);
  var rail = box(180, 0.3, 1.5, 0x8a8a8a); rail.position.set(120, 3.7, 0); g.add(rail);
  for (var i = 0; i < 36; i++) {
    var tie = box(1.2, 0.5, 5, OAK); tie.position.set(40 + i * 5, 3.3, 0); g.add(tie);
  }
  var cart = box(4, 2, 3, STONE); cart.position.set(80, 5.5, 0); cart.userData.cart = true; g.add(cart);
  var cargo = box(2, 1.5, 2, GOLD, GOLD, 0.3); cargo.position.set(80, 7, 0); g.add(cargo);
  for (var a = 0; a < 6; a++) {
    var ax = 50 + a * 28;
    var al = box(2, 12, 2, STONE2); al.position.set(ax, 9, -5); g.add(al);
    var ar = box(2, 12, 2, STONE2); ar.position.set(ax, 9, 5); g.add(ar);
    var atop = box(2, 2, 12, STONE2); atop.position.set(ax, 15, 0); g.add(atop);
    var at = box(1, 1, 1, GOLD, GOLD, 0.9); at.position.set(ax, 13, 0); g.add(at);
    g.add(glowLight(GOLD, 1, 15, ax, 13, 0));
  }
  var s1 = new THREE.Group(); s1.position.set(40, 10, 0);
  for (var u = 0; u < 4; u++) {
    var unit = box(5, 2.5, 4, DARK); unit.position.y = u * 3; s1.add(unit);
    var led1 = box(0.6, 0.6, 0.3, RED, RED, 1); led1.position.set(1.8, u * 3 + 0.5, 2.1); led1.userData.blink = u; s1.add(led1);
    var led2 = box(0.6, 0.6, 0.3, EMER, EMER, 1); led2.position.set(0.8, u * 3 + 0.5, 2.1); led2.userData.blink = u + 1; s1.add(led2);
  }
  var screen = box(6, 4, 0.4, 0x0a2a0a, EMER, 0.25); screen.position.set(10, 4, 3); s1.add(screen);
  for (var cb = 0; cb < 5; cb++) {
    var code = box(1.5, 1, 0.3, cb % 2 ? GOLD : EMER, cb % 2 ? GOLD : EMER, 0.4);
    code.position.set(-3 + cb * 2.5, 8 + (cb % 3) * 1.5, 2);
    code.userData.float = cb * 1.2; s1.add(code);
  }
  g.add(s1);
  g.add(glowLight(RED, 1.5, 30, 40, 12, 5));
  g.add(glowLight(EMER, 1, 25, 50, 12, 5));
  var s2 = new THREE.Group(); s2.position.set(120, 10, 0);
  var trunk = box(2, 10, 2, DARKOAK); s2.add(trunk);
  var nodes = [[-5, 4, 2], [5, 4, -2], [-3, 7, -1], [3, 7, 1], [0, 10, 0], [-1, 5, 3], [1, 5, -3]];
  nodes.forEach(function (np, ni) {
    var n = box(2.2, 2.2, 2.2, GOLD, GOLD, 0.3);
    n.position.set(np[0], np[1], np[2]); n.userData.pulse = ni * 0.8; s2.add(n);
  });
  for (var note = 0; note < 4; note++) {
    var paper = box(2, 2.5, 0.2, QUARTZ);
    paper.position.set(8 + (note % 2) * 3, 3 + note * 2.5, 3);
    paper.rotation.y = 0.3; paper.userData.float = note * 1.5; s2.add(paper);
  }
  g.add(s2);
  g.add(glowLight(GOLD, 2, 35, 120, 14, 5));
  var s3 = new THREE.Group(); s3.position.set(200, 10, 0);
  var body = box(4, 8, 3, 0x3d8c3d); body.position.y = 2; s3.add(body);
  var head = box(5, 5, 4, 0x4caf50); head.position.y = 9; s3.add(head);
  var eyeL = box(1, 1, 0.3, 0x0a0a0a); eyeL.position.set(-1, 10, 2.1); s3.add(eyeL);
  var eyeR = box(1, 1, 0.3, 0x0a0a0a); eyeR.position.set(1, 10, 2.1); s3.add(eyeR);
  var mouth = box(2, 2, 0.3, 0x0a0a0a); mouth.position.set(0, 8, 2.1); s3.add(mouth);
  [-1, 1].forEach(function (lx) {
    var leg = box(1.5, 3, 1.5, 0x3d8c3d); leg.position.set(lx, -1, 0); s3.add(leg);
  });
  for (var sp = 0; sp < 12; sp++) {
    var spark = box(0.5, 0.5, 0.5, EMER, EMER, 1);
    spark.userData.orbit = sp * (Math.PI * 2 / 12);
    spark.userData.radius = 6 + (sp % 3) * 2;
    spark.userData.speed = 0.5 + (sp % 4) * 0.2;
    s3.add(spark);
  }
  var crystal = box(1.5, 3, 1.5, AMETH, AMETH, 0.5);
  crystal.position.set(7, 3, 2); crystal.rotation.z = 0.4; s3.add(crystal);
  g.add(s3);
  g.add(glowLight(EMER, 1.8, 35, 200, 14, 5));
  g.add(glowLight(AMETH, 1, 20, 207, 13, 5));
  return { s1: s1, s2: s2, s3: s3 };
}

function buildBedrock(g) {
  var floor = box(40, 3, 40, 0x1a1a1e); floor.position.set(200, -58, 20); g.add(floor);
  var wall1 = box(40, 14, 3, DEEP); wall1.position.set(200, -52, 3); g.add(wall1);
  var wall2 = box(3, 14, 40, DEEP); wall2.position.set(182, -52, 20); g.add(wall2);
  var frame = box(12, 8, 0.8, STONE2); frame.position.set(200, -50, 5); g.add(frame);
  var scr = box(10, 6, 0.5, 0x0a1a0a, EMER, 0.35); scr.position.set(200, -50, 5.6); g.add(scr);
  var trim = box(13, 0.8, 1, GOLD, GOLD, 0.4); trim.position.set(200, -54, 5.5); g.add(trim);
  var trim2 = box(13, 0.8, 1, GOLD, GOLD, 0.4); trim2.position.set(200, -46, 5.5); g.add(trim2);
  [-8, 8].forEach(function (tx) {
    var t = box(1, 2.5, 1, OAK); t.position.set(200 + tx, -50, 6); g.add(t);
    var f = box(0.7, 1, 0.7, GOLD, GOLD, 1); f.position.set(200 + tx, -48.5, 6); g.add(f);
    g.add(glowLight(GOLD, 1.5, 20, 200 + tx, -48, 8));
  });
  g.add(glowLight(EMER, 2.5, 30, 200, -48, 12));
  for (var e = 0; e < 15; e++) {
    var ember = box(0.3, 0.3, 0.3, e % 2 ? EMER : GOLD, e % 2 ? EMER : GOLD, 1);
    ember.position.set(200 + (Math.random() - 0.5) * 25, -55 + Math.random() * 10, 10 + Math.random() * 15);
    ember.userData.float = Math.random() * Math.PI * 2; g.add(ember);
  }
}

export function buildScene() {
  var scene = new THREE.Scene();
  scene.background = null;
  scene.add(new THREE.AmbientLight(0xffeedd, 0.7));
  var sun = new THREE.DirectionalLight(0xffcc88, 0.6);
  sun.position.set(50, 80, 30); scene.add(sun);
  var fill = new THREE.DirectionalLight(0xffaa66, 0.3);
  fill.position.set(-30, 20, -40); scene.add(fill);
  var world = new THREE.Group();
  scene.add(world);
  buildCampus(world);
  var stations = buildTrack(world);
  buildBedrock(world);
  return { scene: scene, stations: stations };
}
