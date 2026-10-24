// Breakable end crystals — click a pillar's crystal to shatter it (burst, sound, XP).
// Every crystal body, beam and its point light carries a matching index in userData.
import * as THREE from "../vendor/three.module.js";

var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();

export function initCrystals(scene, camera, host) {
  var parts = {}, lights = {}, targets = [], shards = [];
  scene.traverse(function (n) {
    var u = n.userData;
    if (u.crystal !== undefined) { (parts[u.crystal] = parts[u.crystal] || []).push(n); targets.push(n); }
    else if (u.crystalBeam !== undefined) (parts[u.crystalBeam] = parts[u.crystalBeam] || []).push(n);
    if (u.crystalLight !== undefined) lights[u.crystalLight] = n;
  });
  var total = Object.keys(parts).length, broken = 0;   // one id per crystal (body + beam share it)
  function ui() {
    var el = document.getElementById("crystal-hp");
    if (el) el.textContent = "◆ " + (total - broken) + " / " + total;
  }
  ui();

  function pick(e) {
    var r = host.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    var hit = ray.intersectObjects(targets, false);
    for (var i = 0; i < hit.length; i++) {
      var id = hit[i].object.userData.crystal;
      if (parts[id] && parts[id][0].visible) return { id: id, distance: hit[i].distance };
    }
    return null;
  }
  function burst(p) {
    for (var i = 0; i < 12; i++) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0xd8ccff : 0xc026d3 }));
      m.position.copy(p); scene.add(m);
      shards.push({ m: m, life: 1.3, v: new THREE.Vector3((Math.random() - 0.5) * 8, 3 + Math.random() * 5, (Math.random() - 0.5) * 8) });
    }
  }
  return {
    armed: false,
    peek: function (e) { return this.armed ? pick(e) : null; },
    hit: function (e) {
      var p = this.peek(e); if (!p) return false;
      var id = p.id, at = new THREE.Vector3();
      parts[id][0].getWorldPosition(at);
      for (var i = 0; i < parts[id].length; i++) parts[id][i].visible = false;
      if (lights[id]) lights[id].visible = false;
      burst(at); broken++; ui();
      if (window.CCLTCE_SFX) CCLTCE_SFX.mine();
      if (window.CCLTCE_HUD) CCLTCE_HUD.addXP(25);
      return true;
    },
    // screen position of an intact crystal the pointer can actually reach (never under the panel)
    aim: function () {
      var ov = document.querySelector(".narrative-overlay.on"), r = ov && ov.getBoundingClientRect();
      var v = new THREE.Vector3(), best = null, bd = 1e9;
      for (var i = 0; i < targets.length; i++) {
        var t = targets[i]; if (!t.visible) continue;
        t.getWorldPosition(v);
        var d = v.distanceTo(camera.position); if (d >= bd) continue;
        v.project(camera);
        var sx = (v.x + 1) * 0.5, sy = (1 - v.y) * 0.5, hr = host.getBoundingClientRect();
        var px = hr.left + sx * hr.width, py = hr.top + sy * hr.height;
        if (r && px > r.left && px < r.right && py > r.top && py < r.bottom) continue;
        if (Math.abs(v.x) > 1 || Math.abs(v.y) > 1) continue;
        bd = d; best = { x: px, y: py };
      }
      return best;
    },
    update: function (dt) {
      for (var i = shards.length - 1; i >= 0; i--) {
        var s = shards[i]; s.life -= dt;
        if (s.life <= 0) { scene.remove(s.m); shards.splice(i, 1); continue; }
        s.m.position.addScaledVector(s.v, dt); s.v.y -= 14 * dt;
        s.m.scale.setScalar(Math.max(0.05, s.life));
        s.m.rotation.x += dt * 6; s.m.rotation.y += dt * 5;
      }
    },
    left: function () { return total - broken; },
  };
}
