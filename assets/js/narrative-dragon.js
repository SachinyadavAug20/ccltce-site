// Ender Dragon — orbit flight, click-the-head 3-hit kill, death cinematic:
// freeze+shake → spin+descend with purple beams → flash explosion → XP orbs → end portal reveal.
import * as THREE from "../vendor/three.module.js";

var C = new THREE.Vector3(200, -14, 20); // orbit centre — above island, below nether floor
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
  for (var i = 0; i < 8; i++) {
    var b = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 13),
      new THREE.MeshBasicMaterial({ color: 0xc026d3, transparent: true, opacity: 0.9 }));
    b.rotation.y = i * Math.PI / 4; b.rotation.x = i % 2 ? 0.3 : -0.3; beams.add(b);
  }
  beams.visible = false; root.add(beams);
  var flash = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xf5e9ff, transparent: true, opacity: 0 }));
  flash.visible = false; scene.add(flash);
  var pbeam = new THREE.Mesh(new THREE.BoxGeometry(2.2, 34, 2.2),
    new THREE.MeshBasicMaterial({ color: 0xc026d3, transparent: true, opacity: 0 }));
  pbeam.position.set(200, -7, 20); scene.add(pbeam);
  for (var n = 0; n < 40; n++) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4),
      new THREE.MeshBasicMaterial({ color: n % 3 ? 0xffaa00 : 0x17dd62 }));
    m.visible = false; scene.add(m);
    orbs.push({ m: m, v: new THREE.Vector3(), life: 0 });
  }
  function pick(e) {
    var r = host.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(hitbox, false).length > 0;
  }
  function ui() { var el = document.getElementById("dragon-hp"); if (el) el.textContent = hp > 0 ? "HP " + hp + " / 3" : "SLAIN!"; }
  function fallOrbs(dt) {
    for (var i = 0; i < orbs.length; i++) {
      var o = orbs[i]; if (o.life <= 0) continue;
      o.life -= dt; o.m.position.addScaledVector(o.v, dt); o.v.y -= 15 * dt;
      if (o.life <= 0) o.m.visible = false; else if (o.life < 0.5) o.m.scale.setScalar(Math.max(0.05, o.life * 2));
    }
  }
  function boom() {
    state = "flash"; tBoom = prev; root.visible = false; beams.visible = false;
    flash.position.set(200, -23, 20); flash.visible = true;
    for (var k = 0; k < orbs.length; k++) {
      var o = orbs[k], ang = Math.random() * Math.PI * 2, sp = 7 + Math.random() * 10;
      o.m.visible = true; o.m.scale.setScalar(1);
      o.m.position.set(200 + (Math.random() - 0.5) * 5, -22 + Math.random() * 5, 20 + (Math.random() - 0.5) * 5);
      o.v.set(Math.cos(ang) * sp, 5 + Math.random() * 8, Math.sin(ang) * sp);
      o.life = 2 + Math.random() * 1.5;
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
        if (d < 0.7) {
          root.position.set(C.x + (Math.random() - 0.5) * 1.8, C.y + (Math.random() - 0.5) * 1.4, C.z + (Math.random() - 0.5) * 1.8);
          root.rotation.z = (Math.random() - 0.5) * 0.5; beams.visible = true;
        } else if (d < 3) {
          var k = (d - 0.7) / 2.3;
          root.position.set(C.x, C.y + (-23 - C.y) * k, C.z);
          root.rotation.set(0, -a + d * 9, 0); beams.rotation.y = d * 4;
          for (var b2 = 0; b2 < beams.children.length; b2++) beams.children[b2].scale.z = 1 + k * 2;
        } else boom();
      } else if (state === "flash") {
        var db = el - tBoom, s = 1 + db * 55;
        flash.scale.set(s, s, s); flash.material.opacity = Math.max(0, 0.95 - db * 2.4);
        fallOrbs(dt);
        if (db > 0.4) { flash.visible = false; state = "orbs"; tOrb = el; }
      } else {
        var ko = state === "orbs" ? Math.min(1, (el - tOrb) / 1.2) : 1;
        pbeam.scale.y = Math.max(0.01, ko); pbeam.position.y = -24 + 17 * ko; pbeam.material.opacity = 0.5 * ko;
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
        var k = Math.min(1, Math.max(0, (prev - tDie - 0.7) / 2.3));
        return out.set(C.x, C.y + (-23 - C.y) * k, C.z);
      }
      if (state !== "alive") return out.set(200, -23, 20);
      return head ? head.getWorldPosition(out) : out.copy(root.position);
    },
    hp: function () { return hp; },
    state: function () { return state; },
    headScreen: function () {
      var v = head ? head.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3();
      v.project(camera);
      return { x: (v.x + 1) * 0.5 * innerWidth, y: (1 - v.y) * 0.5 * innerHeight };
    },
  };
  return api;
}
