// Low-end profile for the narrative scene: pixel-ratio ladder, a camera-ranked point-light
// budget, a one-shot cache of animated meshes, and skipping the draw while off-screen.
// The scene ships ~110 point lights — every extra one costs each fragment a full loop.
// The budget keeps a CONSTANT count and only swaps which lights are on, so the shader
// program (keyed on light count) never has to recompile mid-scroll.
var KEY = "ccltce-perf";
var DPRS = [1.5, 1.1, 0.8];
var BUDGET = [40, 24, 14];

export function createPerf(o) {
  var renderer = o.renderer, scene = o.scene, section = o.section, camera = o.camera;
  var anim = [], items = [];
  scene.traverse(function (n) {
    var u = n.userData;
    if (u.float !== undefined || u.blink !== undefined || u.pulse !== undefined ||
        u.orbit !== undefined || u.cart || u.cloud !== undefined) anim.push(n);
    if (n.isPointLight) items.push({ l: n, s: 0 });
  });

  var tier = 0, dpr = 0, slow = 0, rest = 0, good = 0, acc = 0, frames = 0, need = 0, beat = 0;
  try {
    var raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && raw.t !== undefined) { tier = raw.t; dpr = raw.d || 0; }
  } catch (e) { }
  if (!tier && ((navigator.hardwareConcurrency || 8) <= 4 || /Android|iPhone|iPad|Mobi/i.test(navigator.userAgent))) tier = 1;

  function size() {
    renderer.setPixelRatio(Math.min(DPRS[dpr], devicePixelRatio || 1));
    renderer.setSize(innerWidth, innerHeight, false);
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ t: tier, d: dpr })); } catch (e) { } }
  function step(down) { if (down ? dpr < 2 : dpr > 0) { dpr += down ? 1 : -1; size(); save(); } }
  function lights() {
    // brightness ÷ distance from the camera — the lights you can actually see stay on
    var c = camera.position, n = items.length;
    for (var i = 0; i < n; i++) {
      var l = items[i].l, dx = l.position.x - c.x, dy = l.position.y - c.y, dz = l.position.z - c.z;
      items[i].s = (l.intensity * l.distance) / (1 + Math.sqrt(dx * dx + dy * dy + dz * dz));
    }
    items.sort(function (a, b) { return b.s - a.s; });
    for (var j = 0; j < n; j++) items[j].l.visible = j < need;   // count never changes → no recompile
  }
  need = BUDGET[Math.min(2, tier)]; size(); lights();

  return {
    anim: anim,
    // one-second FPS windows: ladder the pixel ratio down under load, raise the light
    // budget only when a sustained dip really forces it (that one does recompile)
    frame: function (dt) {
      if (++beat >= 12) { beat = 0; lights(); }
      acc += dt; frames++;
      if (acc < 1) return;
      var fps = frames / acc; acc = 0; frames = 0;
      if (fps < 42) { slow++; rest = 0; good = 0; }
      else if (fps > 57) {
        slow = 0; good++;
        if (++rest > 4) { rest = 0; step(false); }
        // give the light budget back after a sustained stretch of headroom (recompiles once)
        if (good > 10) { good = 0; if (tier > 0) { tier--; need = BUDGET[tier]; save(); } }
      }
      else { slow = 0; good = 0; }
      if (slow >= 2) { slow = 0; if (dpr < 2) step(true); else if (tier < 2) { tier++; need = BUDGET[tier]; save(); } }
    },
    visible: function () {
      var r = section.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight;
    },
    resize: function () { size(); lights(); },
    profile: function () {
      var on = 0;
      for (var i = 0; i < items.length; i++) if (items[i].l.visible) on++;
      return { tier: tier, dpr: dpr, lights: need, on: on, animated: anim.length };
    },
  };
}
