// Click FX — GSAP: Minecraft block-break clicks, hover sparks, ambient pixel motes.
// Classic script after motion.js; everything is pointer-events:none and delta-tweened.
(function () {
  var gsap = window.gsap;
  if (!gsap) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ORE = ["#17dd62", "#ffaa00", "#ff2222", "#aa00aa", "#ffff55", "#9a9a9a", "#6f6f6f", "#bc7b44"];

  var layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:3;overflow:hidden";
  document.body.appendChild(layer);

  function chip(x, y, size, color) {
    var el = document.createElement("i");
    el.style.cssText =
      "position:absolute;left:0;top:0;display:block;width:" + size + "px;height:" + size +
      "px;background:" + color + ";will-change:transform,opacity;transform:translate(" +
      Math.round(x) + "px," + Math.round(y) + "px)";
    layer.appendChild(el);
    return el;
  }
  function kill(el) { if (el.parentNode) el.parentNode.removeChild(el); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // Ambient dust: small, randomly spread, alive (drift + flicker loops)
  function motes(n) {
    for (var i = 0; i < n; i++) {
      var s = Math.round(rnd(3, 6));
      var el = chip(rnd(0, innerWidth - s), rnd(0, innerHeight - s), s, ORE[(Math.random() * ORE.length) | 0]);
      el.style.opacity = 0;
      gsap.to(el, {
        x: "+=" + rnd(-70, 70), y: "+=" + rnd(-50, 50),
        duration: rnd(4, 9), ease: "sine.inOut", yoyo: true, repeat: -1, delay: -rnd(0, 6),
      });
      gsap.to(el, {
        opacity: rnd(0.14, 0.4), duration: rnd(1.4, 3.2),
        ease: "steps(3)", yoyo: true, repeat: -1, delay: -rnd(0, 3),
      });
    }
  }

  // Click: block-break burst + selection-outline pop
  function burst(x, y) {
    for (var i = 0; i < 12; i++) {
      var s = Math.round(rnd(5, 11));
      var el = chip(x - s / 2, y - s / 2, s, ORE[(Math.random() * ORE.length) | 0]);
      var dx = rnd(-85, 85), dy = rnd(-95, 45);
      gsap.to(el, {
        keyframes: [
          { x: "+=" + dx, y: "+=" + dy, duration: rnd(0.22, 0.34), ease: "power2.out" },
          { x: "+=" + dx * 0.3, y: "+=" + rnd(40, 90), opacity: 0, duration: rnd(0.3, 0.45), ease: "power2.in" },
        ],
        onComplete: function () { kill(el); },
      });
    }
    var ring = chip(x - 16, y - 16, 32, "transparent");
    ring.style.border = "3px solid rgba(255,255,255,0.85)";
    gsap.fromTo(ring, { scale: 0.4, opacity: 0.95 },
      { scale: 1.7, opacity: 0, duration: 0.36, ease: "steps(5)", onComplete: function () { kill(ring); } });
  }

  // Hover: little spark pop off interactive elements (delegated, throttled)
  var cool = {};
  function sparks(el) {
    var now = Date.now(), id = el.dataset.fxid || (el.dataset.fxid = "f" + (cool.k = (cool.k || 0) + 1));
    if (cool[id] && now - cool[id] < 500) return;
    cool[id] = now;
    var r = el.getBoundingClientRect();
    for (var i = 0; i < 4; i++) {
      var s = Math.round(rnd(3, 6));
      var c = chip(rnd(r.left, r.right) - s / 2, r.top - 2, s, ORE[(Math.random() * ORE.length) | 0]);
      gsap.to(c, {
        y: "-=" + rnd(14, 30), x: "+=" + rnd(-16, 16), opacity: 0,
        duration: rnd(0.3, 0.5), delay: i * 0.04, ease: "power2.out",
        onComplete: function () { kill(c); },
      });
    }
  }

  var HOVER = "a, button, .btn, .t-btn, .t-card, .res-card, .event, .notice-item, .challenge, .ach";

  document.addEventListener("pointerdown", function (e) {
    if (reduce) return;
    if (e.pointerType === "touch" || window.innerWidth <= 768 || window.matchMedia("(max-width: 768px), (pointer: coarse)").matches) return;
    burst(e.clientX, e.clientY);
  }, { passive: true });

  document.addEventListener("pointerover", function (e) {
    if (reduce || !e.target.closest) return;
    if (e.pointerType === "touch" || window.innerWidth <= 768 || window.matchMedia("(max-width: 768px), (pointer: coarse)").matches) return;
    var el = e.target.closest(HOVER);
    if (el) sparks(el);
  }, { passive: true });

  if (!reduce) motes(16);
})();
