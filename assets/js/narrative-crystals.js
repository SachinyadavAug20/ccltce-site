// Breakable end crystals — click a pillar crystal to blast it with explosive debris,
// shockwave ring, flash light, screen shake, sound and XP.
import * as THREE from "../vendor/three.module.js";

var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();

export function initCrystals(scene, camera, host) {
  var parts = {}, lights = {}, targets = [], shards = [], blasts = [];
  var shakeVal = 0, hoveredId = null;

  scene.traverse(function (n) {
    var u = n.userData;
    if (u.crystal !== undefined) { (parts[u.crystal] = parts[u.crystal] || []).push(n); targets.push(n); }
    else if (u.crystalBeam !== undefined) (parts[u.crystalBeam] = parts[u.crystalBeam] || []).push(n);
    if (u.crystalLight !== undefined) lights[u.crystalLight] = n;
  });
  var total = Object.keys(parts).length, broken = 0;

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

  function detonate(id, pos) {
    if (!parts[id] || !parts[id][0].visible) return;
    for (var i = 0; i < parts[id].length; i++) parts[id][i].visible = false;
    if (lights[id]) lights[id].visible = false;
    broken++; ui();
    shakeVal = 0.45;

    // Expanding shockwave sphere
    var wave = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.MeshBasicMaterial({ color: 0xffaa22, transparent: true, opacity: 0.85 }));
    wave.position.copy(pos); scene.add(wave);
    blasts.push({ m: wave, life: 0.35, grow: 22 });

    // Flash light
    var flash = new THREE.PointLight(0xffeedd, 5, 20);
    flash.position.copy(pos); scene.add(flash);
    blasts.push({ light: flash, life: 0.28, decay: 18 });

    // 28 flying debris shards (glass, flame, crystal, obsidian)
    var colors = [0xd8ccff, 0xff5500, 0xc026d3, 0xffffff, 0x141018, 0xffaa00];
    for (var s = 0; s < 28; s++) {
      var sz = 0.15 + (s % 3) * 0.12;
      var sm = new THREE.Mesh(new THREE.BoxGeometry(sz, sz, sz),
        new THREE.MeshBasicMaterial({ color: colors[s % colors.length] }));
      sm.position.copy(pos); scene.add(sm);
      var spd = 6 + Math.random() * 9, th = Math.random() * Math.PI * 2, ph = (Math.random() - 0.2) * Math.PI;
      shards.push({
        m: sm, life: 0.8 + Math.random() * 0.6,
        v: new THREE.Vector3(Math.cos(th) * Math.cos(ph) * spd, Math.sin(ph) * spd + 4, Math.sin(th) * Math.cos(ph) * spd),
        rx: (Math.random() - 0.5) * 12, ry: (Math.random() - 0.5) * 12,
      });
    }

    if (window.CCLTCE_SFX) {
      if (window.CCLTCE_SFX.hit) window.CCLTCE_SFX.hit();
      else if (window.CCLTCE_SFX.mine) window.CCLTCE_SFX.mine();
    }
    if (window.CCLTCE_HUD) CCLTCE_HUD.addXP(25);

    // Chain blast nearby crystals (< 14u)
    var otherPos = new THREE.Vector3();
    Object.keys(parts).forEach(function (oid) {
      if (oid === id || !parts[oid] || !parts[oid][0].visible) return;
      parts[oid][0].getWorldPosition(otherPos);
      if (pos.distanceTo(otherPos) < 14) {
        setTimeout(function () { detonate(oid, otherPos); }, 90);
      }
    });
  }

  return {
    armed: false,
    peek: function (e) {
      if (!this.armed) return null;
      var p = pick(e), newHover = p ? p.id : null;
      if (newHover !== hoveredId) {
        if (hoveredId && parts[hoveredId] && parts[hoveredId][0].visible) parts[hoveredId][0].scale.set(1, 1, 1);
        hoveredId = newHover;
        if (hoveredId && parts[hoveredId] && parts[hoveredId][0].visible) parts[hoveredId][0].scale.set(1.2, 1.2, 1.2);
      }
      return p;
    },
    hit: function (e) {
      var p = this.peek(e); if (!p) return false;
      var at = new THREE.Vector3(); parts[p.id][0].getWorldPosition(at);
      detonate(p.id, at); return true;
    },
    aim: function () {
      var ov = document.querySelector(".narrative-overlay.on"), r = ov && ov.getBoundingClientRect();
      var v = new THREE.Vector3(), best = null, bd = 1e9;
      for (var i = 0; i < targets.length; i++) {
        var t = targets[i]; if (!t.visible) continue;
        t.getWorldPosition(v); var d = v.distanceTo(camera.position); if (d >= bd) continue;
        v.project(camera);
        var sx = (v.x + 1) * 0.5, sy = (1 - v.y) * 0.5, hr = host.getBoundingClientRect();
        var px = hr.left + sx * hr.width, py = hr.top + sy * hr.height;
        if (r && px > r.left && px < r.right && py > r.top && py < r.bottom) continue;
        if (Math.abs(v.x) > 1 || Math.abs(v.y) > 1) continue;
        bd = d; best = { x: px, y: py };
      }
      return best;
    },
    shake: function () { var s = shakeVal; shakeVal *= 0.88; return s > 0.005 ? s : 0; },
    update: function (dt) {
      for (var b = blasts.length - 1; b >= 0; b--) {
        var bl = blasts[b]; bl.life -= dt;
        if (bl.life <= 0) {
          if (bl.m) scene.remove(bl.m); if (bl.light) scene.remove(bl.light);
          blasts.splice(b, 1);
        } else {
          if (bl.m) { bl.m.scale.addScalar(bl.grow * dt); bl.m.material.opacity = Math.max(0, bl.life * 2.5); }
          if (bl.light) bl.light.intensity = Math.max(0, bl.light.intensity - bl.decay * dt);
        }
      }
      for (var i = shards.length - 1; i >= 0; i--) {
        var s = shards[i]; s.life -= dt;
        if (s.life <= 0) { scene.remove(s.m); shards.splice(i, 1); continue; }
        s.m.position.addScaledVector(s.v, dt); s.v.y -= 16 * dt;
        s.m.scale.setScalar(Math.max(0.05, s.life * 0.9));
        s.m.rotation.x += s.rx * dt; s.m.rotation.y += s.ry * dt;
      }
    },
    left: function () { return total - broken; },
  };
}
