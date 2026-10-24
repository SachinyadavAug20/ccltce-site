// Narrative scene — voxel campus, minecart track, bedrock core. Minecraft palette only.
import * as THREE from "../vendor/three.module.js";

var GOLD = 0xffaa00, EMER = 0x17dd62, RED = 0xff2222;
var STONE = 0x3f3f46, DEEP = 0x141416, DARK = 0x1c1c1f, WHITE = 0xededed;

function box(w, h, d, color) {
  var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: color }));
  m.castShadow = m.receiveShadow = true;
  return m;
}

function buildCampus(g) {
  // LTCE entrance arch
  var base = box(60, 2, 30, STONE); base.position.set(0, -1, 0); g.add(base);
  var l = box(4, 18, 4, DARK); l.position.set(-10, 8, -8); g.add(l);
  var r = box(4, 18, 4, DARK); r.position.set(10, 8, -8); g.add(r);
  var top = box(28, 4, 4, DARK); top.position.set(0, 18, -8); g.add(top);
  // torch lights on arch
  [-8, 8].forEach(function (x) {
    var t = box(1, 1, 1, GOLD); t.position.set(x, 14, -6); g.add(t);
    var pl = new THREE.PointLight(GOLD, 1.2, 20); pl.position.set(x, 14, -6); g.add(pl);
  });
  // building block
  var bld = box(40, 12, 16, STONE); bld.position.set(0, 5, -25); g.add(bld);
  var roof = box(44, 2, 18, DEEP); roof.position.set(0, 12, -25); g.add(roof);
  // ground plane
  var ground = box(120, 1, 80, 0x27272a); ground.position.set(0, -2, -10); ground.receiveShadow = true; g.add(ground);
  // torch path
  for (var i = 0; i < 6; i++) {
    var p = box(1, 0.5, 1, GOLD); p.position.set(-3 + (i % 2) * 6, -0.5, 2 - i * 4); g.add(p);
  }
}

function buildTrack(g) {
  // rail from x=40 to x=200 at y=5
  var rail = new THREE.Mesh(new THREE.BoxGeometry(180, 0.3, 2), new THREE.MeshLambertMaterial({ color: 0x5a5a5a }));
  rail.position.set(120, 4, 0); g.add(rail);
  for (var i = 0; i < 36; i++) {
    var tie = box(1, 0.4, 4, 0x4a3728); tie.position.set(40 + i * 5, 3.7, 0); g.add(tie);
  }
  // Station 1: Web & Systems — floating servers + redstone
  var s1 = new THREE.Group(); s1.position.set(40, 8, 0);
  for (var j = 0; j < 3; j++) {
    var srv = box(4, 2, 3, DARK); srv.position.y = j * 3; s1.add(srv);
    var led = box(0.5, 0.5, 0.5, RED); led.position.set(1.8, j * 3, 1.5); s1.add(led);
  }
  g.add(s1);
  var pl1 = new THREE.PointLight(RED, 0.8, 25); pl1.position.set(40, 10, 4); g.add(pl1);

  // Station 2: Algorithmic BST — dark oak + gold ore nodes
  var s2 = new THREE.Group(); s2.position.set(120, 8, 0);
  var trunk = box(1.5, 8, 1.5, 0x4a3728); s2.add(trunk);
  [[-4, 3, 2], [4, 3, -2], [-2, 6, -1], [2, 6, 1], [0, 8, 0]].forEach(function (p) {
    var n = box(2, 2, 2, GOLD); n.position.set(p[0], p[1], p[2]); s2.add(n);
  });
  g.add(s2);
  var pl2 = new THREE.PointLight(GOLD, 1, 30); pl2.position.set(120, 12, 5); g.add(pl2);

  // Station 3: AI Core — monolith + emerald sparks
  var s3 = new THREE.Group(); s3.position.set(200, 8, 0);
  var mono = box(3, 10, 3, DEEP); s3.add(mono);
  var eye1 = box(1, 1, 0.5, EMER); eye1.position.set(-0.6, 3, 1.6); s3.add(eye1);
  var eye2 = box(1, 1, 0.5, EMER); eye2.position.set(0.6, 3, 1.6); s3.add(eye2);
  for (var k = 0; k < 8; k++) {
    var spark = box(0.4, 0.4, 0.4, EMER);
    spark.position.set(Math.cos(k * 0.785) * 5, 2 + k * 0.8, Math.sin(k * 0.785) * 5);
    spark.userData.spin = k * 0.3; s3.add(spark);
  }
  g.add(s3);
  var pl3 = new THREE.PointLight(EMER, 1, 30); pl3.position.set(200, 14, 5); g.add(pl3);
  return { s1: s1, s2: s2, s3: s3 };
}

function buildBedrock(g) {
  var floor = box(30, 2, 30, 0x111114); floor.position.set(200, -58, 20); g.add(floor);
  var wall1 = box(30, 12, 2, DEEP); wall1.position.set(200, -52, 5); g.add(wall1);
  var wall2 = box(2, 12, 30, DEEP); wall2.position.set(185, -52, 20); g.add(wall2);
  // terminal screen
  var scr = box(8, 5, 0.5, 0x0a0a0a); scr.position.set(200, -50, 6); g.add(scr);
  var glow = box(7.5, 4.5, 0.3, EMER); glow.position.set(200, -50, 6.3); glow.material.emissive = new THREE.Color(EMER); glow.material.emissiveIntensity = 0.4; g.add(glow);
  var pl = new THREE.PointLight(EMER, 1.5, 25); pl.position.set(200, -48, 12); g.add(pl);
  // gold trim
  var trim = box(10, 0.5, 1, GOLD); trim.position.set(200, -52.5, 6); g.add(trim);
}

export function buildScene() {
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0c0e);
  scene.fog = new THREE.Fog(0x0c0c0e, 60, 250);

  var ambient = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambient);
  var sun = new THREE.DirectionalLight(0xffcc88, 0.5);
  sun.position.set(30, 50, 20); scene.add(sun);

  var world = new THREE.Group();
  scene.add(world);
  buildCampus(world);
  var stations = buildTrack(world);
  buildBedrock(world);

  return { scene: scene, stations: stations };
}
