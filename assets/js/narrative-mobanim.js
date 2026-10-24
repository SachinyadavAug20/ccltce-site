// Living mobs — animates the hinged parts tagged in narrative-mobs*.js (leg/head/tail/wing/ear).
// Own requestAnimationFrame loop so narrative.js doesn't grow; parks itself when the journey
// section is off-screen or the tab is hidden, and is a no-op under Node (geometry tests).
var FLAGS = ["leg", "head", "tail", "wing", "ear"];

export function initMobAnim(scene) {
  var bins = { leg: [], head: [], tail: [], wing: [], ear: [] };
  scene.traverse(function (n) {
    var u = n.userData;
    for (var i = 0; i < FLAGS.length; i++) {
      if (u[FLAGS[i]] !== undefined) { bins[FLAGS[i]].push(n); break; }
    }
  });
  var t0 = null, sec = null;
  function loop() {
    requestAnimationFrame(loop);
    if (typeof document === "undefined" || document.hidden) return;
    if (!sec) sec = document.getElementById("narrative-scroll");
    if (!sec) return;
    var r = sec.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= innerHeight) return;                 // journey off-screen: skip
    if (t0 === null) t0 = performance.now();
    var t = (performance.now() - t0) / 1000, i, o;
    for (i = 0; i < bins.leg.length; i++) {
      o = bins.leg[i];
      o.rotation.x = Math.sin(t * 2.1 + o.userData.leg) * 0.1;         // walking gait
    }
    for (i = 0; i < bins.head.length; i++) {
      o = bins.head[i];
      o.rotation.y = Math.sin(t * 0.7 + o.userData.head) * 0.35;       // look around
      o.rotation.x = Math.sin(t * 1.3 + o.userData.head) * 0.06;       // small nod
    }
    for (i = 0; i < bins.tail.length; i++) {
      o = bins.tail[i];
      o.rotation.z = Math.sin(t * 4 + o.userData.tail) * 0.3;          // wag / drift
      o.rotation.x = Math.sin(t * 1.7 + o.userData.tail) * 0.15;
    }
    for (i = 0; i < bins.wing.length; i++) {
      o = bins.wing[i];
      o.rotation.z = (o.userData.wing ? -1 : 1) * (0.12 + Math.abs(Math.sin(t * 7)) * 0.55);  // flap
    }
    for (i = 0; i < bins.ear.length; i++) {
      o = bins.ear[i];
      o.rotation.z = Math.sin(t * 1.1 + o.userData.ear) * 0.25;        // twitch
    }
  }
  var n = bins.leg.length + bins.head.length + bins.tail.length + bins.wing.length + bins.ear.length;
  if (typeof window !== "undefined") window.CCLTCE_MOBS = { parts: n, flags: FLAGS, bins: bins, probe: function () { return { leg: bins.leg.length ? bins.leg[0].rotation.x : 0, head: bins.head.length ? bins.head[0].rotation.y : 0, wing: bins.wing.length ? bins.wing[0].rotation.z : 0, tail: bins.tail.length ? bins.tail[0].rotation.x : 0 }; } };
  if (typeof requestAnimationFrame === "function") loop();
  return { parts: n };
}
