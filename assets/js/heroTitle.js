// Hero title — Pacifico script wordmark with water fill effect.
// Water rises on load; on hover the water surges from the hovered letter
// and spreads to neighbours, turning warm. Letterforms never move.
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var STROKE = 16;
  var TEAL = "#2dd4bf";
  var HOT = "#ff6b5a";
  var DARK = "#050d0f";

  function el(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function mount() {
    var h1 = document.querySelector(".hero-title");
    if (!h1) return;
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "hero-title-svg");
    svg.setAttribute("viewBox", "0 0 10 10");
    svg.setAttribute("aria-hidden", "true");
    var defs = document.createElementNS(NS, "defs");
    svg.appendChild(defs);
    h1.innerHTML = '<span class="sr-only">Coding Club</span>';
    h1.appendChild(svg);

    fetch("assets/js/hero-script.json").then(function (r) { return r.json(); }).then(function (data) {
      var letters = data.letters.filter(function (l) { return !l.space; });
      var items = [];
      letters.forEach(function (l) {
        var g = document.createElementNS(NS, "g");
        g.setAttribute("class", "ht-l");
        var common = { d: l.d, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
        g.appendChild(el("path", Object.assign({ stroke: DARK, "stroke-width": STROKE + 9, opacity: 0.7 }, { d: l.d, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" })));
        var p = el("path", Object.assign({ stroke: TEAL, "stroke-width": STROKE }, { d: l.d, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }));
        g.appendChild(p);
        svg.appendChild(g);
        items.push({ g: g, path: p, origX: l.x });
      });

      layoutAndWire(svg, items);
    });
  }

  function layoutAndWire(svg, items) {
    var defs = svg.querySelector("defs");

    // Measure actual glyph widths to lay out proportionally
    var totalOrigWidth = items.reduce(function (sum, it, i) {
      return sum + (i < items.length - 1 ? 70 : 0);
    }, 0);

    var containerWidth = 780; // target content width
    var scale = containerWidth / totalOrigWidth;
    if (scale > 1) scale = 1;

    var x = 40;
    items.forEach(function (it) {
      var s = 0.85 * scale;
      it.g.setAttribute("transform", "translate(" + x + " 215) scale(" + s + ")");
      x += 70 * scale;
    });
    svg.setAttribute("viewBox", "0 0 " + (x + 40) + " 260");

    var defs = svg.querySelector("defs");
    items.forEach(function (it, i) {
      var mid = el("mask", { id: "hm-" + i, maskUnits: "userSpaceOnUse", x: -200, y: -200, width: 2000, height: 2000 });
      mid.appendChild(el("path", { d: it.path.getAttribute("d"), fill: "none", stroke: "#fff", "stroke-width": STROKE, "stroke-linecap": "round", "stroke-linejoin": "round" }));
      defs.appendChild(mid);
      var wrap = el("g", { mask: "url(#hm-" + i + ")" });
      var rect = el("rect", { x: -400, y: -400, width: 1200, height: 800, fill: TEAL });
      var surf = el("path", { d: "", fill: TEAL });
      wrap.appendChild(rect); wrap.appendChild(surf);
      it.g.appendChild(wrap);
      it.wrap = wrap; it.rect = rect; it.surf = surf;
    });

    wire(svg, items);
  }

  function wire(svg, items) {
    var gsap = window.gsap;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var state = items.map(function () { return { fill: reduce ? 1 : 0.18 }; });
    var wave = { t: 0, from: -1, phase: 0 };

    function paint() {
      items.forEach(function (it, i) {
        var s = state[i];
        var d = wave.from < 0 ? 0 : Math.abs(i - wave.from);
        var env = Math.exp(-d * 0.24);
        var surge = wave.from < 0 ? 0 : Math.max(0, Math.sin(wave.t - d * 0.6)) * env;
        var fill = Math.min(1, s.fill + surge * 0.9);
        if (wave.from >= 0 && d === 0) fill = Math.max(fill, 0.96);
        var bottom = 40;
        var level = bottom - (bottom + 260) * fill;
        var tint = wave.from >= 0 && (d < 2) ? HOT : TEAL;
        it.rect.setAttribute("fill", tint);
        it.surf.setAttribute("fill", tint);
        it.rect.setAttribute("y", level);
        it.rect.setAttribute("height", bottom - level + 400);
        var w = 220, x = -100, y = level;
        var amp = 4 + surge * 8;
        var path = "M" + x + " " + y;
        for (var j = 0; j <= 8; j++) {
          var tt = j / 8;
          path += " Q" + (x + w * tt - w / 16) + " " + (y + Math.sin(wave.phase + tt * 6 + d * 0.4) * amp) + " " + (x + w * tt) + " " + y;
        }
        path += " L" + (x + w) + " " + (y + amp + 80) + " L" + x + " " + (y + amp + 80) + " Z";
        it.surf.setAttribute("d", path);
      });
    }

    paint();
    if (!gsap || reduce) return;
    items.forEach(function (it, i) {
      gsap.to(state[i], { fill: 0.95, duration: 0.6, delay: i * 0.055, onUpdate: paint });
    });
    gsap.to(wave, { phase: 6.283, duration: 4.0, ease: "none", repeat: -1, onUpdate: paint });

    var tween = null, last = -1;
    svg.addEventListener("mousemove", function (e) {
      var box = svg.getBoundingClientRect();
      var mx = ((e.clientX - box.left) / box.width) * Number(svg.getAttribute("viewBox").split(" ")[2]);
      var idx = 0, best = 1e9;
      items.forEach(function (it, j) {
        var b = it.g.getBBox ? it.g.getBBox() : { x: j * 70 + 40, width: 56 };
        var cx = (it.g.transform.baseVal.numberOfItems ? it.g.transform.baseVal.getItem(0).matrix.e : 40) + b.width / 2;
        var dd = Math.abs(cx - mx);
        if (dd < best) { best = dd; idx = j; }
      });
      if (idx === last) return;
      last = idx;
      wave.from = idx;
      if (tween) tween.kill();
      tween = gsap.to(wave, { t: 6.2, duration: 2.0, ease: "none", onUpdate: paint });
    });
    svg.addEventListener("mouseleave", function () { last = -1; wave.from = -1; paint(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();