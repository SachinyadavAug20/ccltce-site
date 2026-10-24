// Ender Dragon — orbit flight, click-the-head 3-hit kill, death cinematic:
// freeze+shake → rise+spin with core/halo beams → white flash + ground shockwave → XP orbs → end portal reveal.
import * as THREE from "../vendor/three.module.js";

var C = new THREE.Vector3(200, -105, 20); // orbit centre — island top (-126) far below the nether floor (-5)
var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();

export function initDragon(scene, camera, host) {
  var root = null, head = null, hitbox = null, portal = null;
  scene.traverse(function (o) {
    if (o.userData.dragon) root = o;
    if (o.userData.dragonHead) head = o;
    if (o.userData.dragonHit) hitbox = o;
    if (o.userData.endPortal) portal = o;
  });
  if (!root || !hitbox) return null;
  var wings = [];
  root.traverse(function (o) { if (o.userData.wingL || o.userData.wingR) wings.push(o); });
  var hp = 3, state = "alive", tHit = -9, tDie = -9, tBoom = -9, tOrb = -9, prev = 0;
  var beams = new THREE.Group(), orbs = [];
  for (var i = 0; i < 8; i++) {          // beam = bright core + additive halo (no pink monolith)
    var bg = new THREE.Group();
    [[0.3, 0xffd8ff, 0.95], [1.2, 0xc026d3, 0.3]].forEach(function (q, qi) {
      bg.add(new THREE.Mesh(new THREE.BoxGeometry(q[0], q[0], 13), new THREE.MeshBasicMaterial({ color: q[1], transparent: true, opacity: q[2], blending: qi ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false })));
    });
    bg.rotation.y = i * Math.PI / 4; bg.rotation.x = i % 2 ? 0.3 : -0.3; beams.add(bg);
  }
  beams.visible = false; root.add(beams);
  var flash = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
  var ring = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1), new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  flash.visible = false; scene.add(flash); ring.visible = false; scene.add(ring);
  var pbeam = new THREE.Group(), pbm = [];
  [[1.1, 0xfff0ff, 0.95], [3.8, 0xc026d3, 0.22]].forEach(function (pb) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(pb[0], 34, pb[0]),
      new THREE.MeshBasicMaterial({ color: pb[1], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    pbeam.add(m); pbm.push([m.material, pb[2]]);
  });
  pbeam.position.set(200, -124, 20); scene.add(pbeam);
  for (var n = 0; n < 40; n++) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4),
      new THREE.MeshBasicMaterial({ color: n % 3 ? 0xffaa00 : 0x17dd62 }));
    m.visible = false; scene.add(m);
    orbs.push({ m: m, v: new THREE.Vector3(), life: 0 });
  }
  function aim(e) {
    var r = host.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1; ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    var h = ray.intersectObject(hitbox, false); return h.length ? h[0].distance : null;
  }
  function pick(e) { return aim(e) !== null; }
  function ui() { var el = document.getElementById("dragon-hp"); if (!el) return;
    el.textContent = hp > 0 ? "HP " + hp + " / 3" : "SLAIN!";
    var ov = el.closest(".narrative-overlay"); if (ov) ov.classList.toggle("slain", hp <= 0); }
  function fallOrbs(dt) {
    for (var i = 0; i < orbs.length; i++) {
      var o = orbs[i]; if (o.life <= 0) continue;
      o.life -= dt; o.m.position.addScaledVector(o.v, dt); o.v.y -= 15 * dt;
      if (o.m.position.y < -126.3) { o.m.position.y = -126.3; o.v.set(0, 0, 0); }
      if (o.life <= 0) o.m.visible = false; else if (o.life < 0.5) o.m.scale.setScalar(Math.max(0.05, o.life * 2));
    }
  }
  function boom() {
    state = "flash"; tBoom = prev; root.visible = false; beams.visible = false;
    flash.position.set(200, -107, 20); flash.visible = true;
    ring.position.set(200, -125.4, 20); ring.visible = true;
    for (var k = 0; k < orbs.length; k++) {
      var o = orbs[k], ang = Math.random() * Math.PI * 2, sp = 6 + Math.random() * 9;
      o.m.visible = true; o.m.scale.setScalar(1);
      o.m.position.set(200 + (Math.random() - 0.5) * 6, -108 + Math.random() * 4, 20 + (Math.random() - 0.5) * 6);
      o.v.set(Math.cos(ang) * sp, 4 + Math.random() * 7, Math.sin(ang) * sp);
      o.life = 2.2 + Math.random() * 1.6;
    }
    if (portal) portal.userData.pulse = undefined;
    if (window.CCLTCE_SFX) CCLTCE_SFX.levelUp();
    if (window.CCLTCE_HUD) CCLTCE_HUD.addXP(200);
  }
  var api = {
    armed: false,
    update: function (el) {
      var dt = Math.min(0.05, Math.max(0, el - prev)), a = el * 0.16; prev = el;
      if (state === "alive") {
        root.position.set(C.x + Math.cos(a) * 22, C.y + Math.sin(el * 0.5) * 3, C.z + Math.sin(a) * 22);
        root.rotation.set(0, -a, Math.sin(el * 0.9) * 0.07);
        if (el - tHit < 0.35) {
          root.position.x += (Math.random() - 0.5) * 1.4; root.position.y += (Math.random() - 0.5);
          root.rotation.z += (Math.random() - 0.5) * 0.25;
        }
        var f = Math.sin(el * 4.5) * 0.5;
        for (var w = 0; w < wings.length; w++) wings[w].rotation.z = wings[w].userData.wingL ? -f : f;
      } else if (state === "dying") {
        var d = el - tDie;
        if (d < 0.6) {
          root.position.set(C.x + (Math.random() - 0.5) * 1.8, C.y + (Math.random() - 0.5) * 1.4, C.z + (Math.random() - 0.5) * 1.8);
          root.rotation.z = (Math.random() - 0.5) * 0.5; beams.visible = true;
        } else if (d < 3.4) {
          var k = (d - 0.6) / 2.8; k = k * k * (3 - 2 * k);   // MC death: rise + fast spin, wings held open
          root.position.set(C.x, C.y + (-107 - C.y) * k, C.z);
          root.rotation.set(0, -a + d * 6, 0); beams.rotation.y = d * 4;
          for (var b2 = 0; b2 < beams.children.length; b2++) beams.children[b2].scale.z = 1 + k * 2.4;
        } else boom();
        for (var w2 = 0; w2 < wings.length; w2++) wings[w2].rotation.z = wings[w2].userData.wingL ? -0.75 : 0.75;
      } else if (state === "flash") {
        var db = el - tBoom, s = 1 + db * 70, rk = Math.min(1, db / 0.4);
        flash.scale.set(s, s, s); flash.material.opacity = Math.max(0, 0.98 - db * 2.4);
        ring.scale.set(2 + rk * 90, 1, 2 + rk * 90); ring.material.opacity = Math.max(0, 0.75 - rk * 0.75);
        fallOrbs(dt);
        if (db > 0.4) { flash.visible = false; ring.visible = false; state = "orbs"; tOrb = el; }
      } else {
        var ko = state === "orbs" ? Math.min(1, (el - tOrb) / 1.2) : 1;
        pbeam.scale.y = Math.max(0.01, ko); pbeam.position.y = -124 + 17 * ko;
        for (var pm = 0; pm < pbm.length; pm++) pbm[pm][0].opacity = pbm[pm][1] * ko;
        if (portal) { portal.scale.set(1 + 1.3 * ko, 1 + 1.3 * ko, 1); portal.material.emissiveIntensity = 0.9 + 1.2 * ko; }
        if (ko >= 1) state = "dead";
        fallOrbs(dt);
      }
    },
    hover: function (e) { host.style.cursor = api.armed && state === "alive" && pick(e) ? "crosshair" : ""; },
    click: function (e) {
      if (!api.armed || state !== "alive" || !pick(e)) return false;
      hp--; ui(); tHit = prev;
      if (window.CCLTCE_SFX) CCLTCE_SFX.mine();
      if (hp <= 0) { state = "dying"; tDie = prev; host.style.cursor = ""; }
      return true;
    },
    look: function (out) {
      if (state === "dying") {
        var k = Math.min(1, Math.max(0, (prev - tDie - 0.6) / 2.8));
        k = k * k * (3 - 2 * k);
        return out.set(C.x, C.y + (-107 - C.y) * k, C.z);
      }
      if (state !== "alive") return out.set(200, -107 - 13 * Math.min(1, (prev - tBoom) / 1.6), 20);
      return head ? head.getWorldPosition(out) : out.copy(root.position);
    },
    shake: function () {
      if (state === "dying") { var d = prev - tDie; return d < 0.9 ? 0.75 * (1 - d / 0.9) : (d < 3.4 ? 0.14 : 0); }
      if (state === "flash") return Math.max(0, 0.55 - (prev - tBoom) * 1.3);
      return 0;
    },
    hp: function () { return hp; },
    state: function () { return state; },
    aim: function (e) { return api.armed && state === "alive" ? aim(e) : null; },
    headScreen: function () {
      var v = head ? head.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3();
      v.project(camera);
      return { x: (v.x + 1) * 0.5 * innerWidth, y: (1 - v.y) * 0.5 * innerHeight };
    },
  };
  return api;
}
