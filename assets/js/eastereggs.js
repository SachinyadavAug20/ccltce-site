// Easter eggs — Konami collapse, rune rain, console clues.
(function () {
  var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var pos = 0;

  document.addEventListener("keydown", function (e) {
    if (e.key === KONAMI[pos] || e.key.toLowerCase() === KONAMI[pos]) {
      if (++pos === KONAMI.length) {
        pos = 0;
        if (window.CCLTCE_PHYSICS) CCLTCE_PHYSICS.collapse();
        if (window.CCLTCE_HUD) { CCLTCE_HUD.addXP(200); CCLTCE_HUD.relic("Mending Book"); }
      }
    } else pos = e.key === KONAMI[0] ? 1 : 0;
  });

  function matrix(seconds) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var c = document.createElement("canvas");
    c.className = "matrix-runes";
    c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    var g = c.getContext("2d");
    c.width = innerWidth; c.height = innerHeight;
    var GLYPHS = "ABCDEF0123456789#$%&/runecmd";
    var cols = Math.floor(c.width / 14);
    var drops = [];
    for (var i = 0; i < cols; i++) drops[i] = Math.random() * -40;
    var t0 = performance.now();
    (function frame(now) {
      if ((now - t0) / 1000 > seconds) { c.remove(); return; }
      g.fillStyle = "rgba(18,18,18,0.16)";
      g.fillRect(0, 0, c.width, c.height);
      g.font = "12px VT323, monospace";
      for (var j = 0; j < cols; j++) {
        var ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        g.fillStyle = Math.random() > 0.82 ? "#ffaa00" : "#17dd62";
        g.fillText(ch, j * 14, drops[j] * 14);
        if (drops[j] * 14 > c.height && Math.random() > 0.96) drops[j] = 0;
        drops[j] += 0.55;
      }
      requestAnimationFrame(frame);
    })(t0);
  }

  // console banner + crypto riddle
  console.log("%c[CCLTCE SYSTEM ACTIVE]", "color: #17dd62; font-size: 16px; font-weight: bold; background: #000; padding: 4px;");
  var token = ["43", "43", "4c", "54", "43", "45"].map(function (h) { return String.fromCharCode(parseInt(h, 16)); }).join("");
  try { console.log("%c[VAULT] token: " + btoa(token + ":soon"), "color: #ffaa00; font-size: 12px;"); }
  catch (e) { console.log("%c[VAULT] token: " + token + ":soon", "color: #ffaa00; font-size: 12px;"); }
  console.log("%c[RIDDLE] I speak without a mouth and hear without ears. Type my answer in the shell: sudo unlock ...", "color: #aaaaaa; font-size: 12px;");

  // icon-secret — pixel burst on every ref-icon click; awards hidden in click combos
  function pixelBurst(x, y) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var COLORS = ["#ffaa00", "#17dd62", "#00e5ff", "#ff5555", "#a78bfa"];
    for (var i = 0; i < 12; i++) {
      var p = document.createElement("span");
      p.className = "egg-pix";
      var a = Math.random() * Math.PI * 2, d = 26 + Math.random() * 42;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.background = COLORS[i % COLORS.length];
      p.style.setProperty("--dx", Math.cos(a) * d + "px");
      p.style.setProperty("--dy", Math.sin(a) * d + "px");
      document.body.appendChild(p);
      setTimeout(function (el) { return function () { el.remove(); }; }(p), 750);
    }
  }

  var iconLog = [], inspectorDone = false, masterDone = false;
  document.addEventListener("click", function (e) {
    var ico = e.target.closest(".ref-ico");
    if (!ico) return;
    pixelBurst(e.clientX, e.clientY);
    var now = Date.now();
    iconLog.push({ el: ico, t: now });
    iconLog = iconLog.filter(function (h) { return now - h.t < 4000; });
    if (!window.CCLTCE_HUD) return;
    var same = iconLog.filter(function (h) { return h.el === ico; }).length;
    if (!masterDone && same >= 5) {
      masterDone = true;
      CCLTCE_HUD.addXP(75);
      CCLTCE_HUD.relic("Pixel Master Pickaxe");
      CCLTCE_HUD.achievement("Blade Master — 5 rapid strikes on one icon");
    } else if (!inspectorDone && iconLog.filter(function (h, i) {
      return iconLog.findIndex(function (o) { return o.el === h.el; }) === i;
    }).length >= 3) {
      inspectorDone = true;
      CCLTCE_HUD.addXP(40);
      CCLTCE_HUD.achievement("Icon Inspector — clicked 3 different icons in 4s");
    }
  });

  window.CCLTCE_EGG = { matrix: matrix, token: token, pixelBurst: pixelBurst };
})();
