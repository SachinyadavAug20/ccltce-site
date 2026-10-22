// Hero title — "CODING CLUB" as chunky pipe letterforms (see heroPipes.js)
// laid out on one line, with a water ripple that spreads from the hovered
// letter to both sides.
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var GAP = 20;
  var WORD_GAP = 52;

  // Pipe centre-lines on a 100-unit tall box.
  var GLYPHS = {
    C: { d: ["M52 24 A32 38 0 1 0 52 76"] },
    O: { d: ["M33 10 A23 40 0 1 1 32.9 10"] },
    D: { d: ["M14 90 L14 10 L30 10 A26 40 0 0 1 30 90 Z"] },
    I: { d: ["M17 10 L17 90"] },
    N: { d: ["M14 90 L14 10 L52 90 L52 10"] },
    G: { d: ["M52 24 A32 38 0 1 0 52 76 L52 54 L36 54"] },
    L: { d: ["M14 10 L14 90 L46 90"] },
    U: { d: ["M14 10 L14 60 A19 30 0 0 0 52 60 L52 10"] },
    B: { d: ["M14 90 L14 10 L30 10 A20 20 0 0 1 30 50 L14 50 M30 50 A20 20 0 0 1 30 90 Z"] },
  };

  function mount() {
    var h1 = document.querySelector(".hero-title");
    var P = window.CCLTCE_PIPES;
    if (!h1 || !P) return;

    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "hero-title-svg");
    svg.setAttribute("viewBox", "0 0 10 10");
    svg.setAttribute("aria-hidden", "true");
    h1.innerHTML = '<span class="sr-only">Coding Club</span>';
    h1.appendChild(svg);

    var items = [];
    "CODING CLUB".split(" ").forEach(function (word, wi) {
      word.split("").forEach(function (ch) {
        var g = document.createElementNS(NS, "g");
        g.setAttribute("class", "ht-l");
        g.setAttribute("fill", "none");
        var colour = wi === 1 ? P.TEAL : "#ffffff";
        var paths = (GLYPHS[ch] || { d: [] }).d.map(function (d) { return P.pipe(g, d, colour); });
        svg.appendChild(g);
        items.push({ g: g, colour: colour, paths: paths, word: wi, w: 0 });
      });
    });

    // measure, then lay the letters out on a single line
    var x = P.STROKE / 2 + 4;
    var gapDone = false;
    items.forEach(function (it) {
      var b = it.g.getBBox();
      it.w = b.width;
      it.g.dataset.x = String(x - b.x);
      it.g.dataset.y = String(P.STROKE / 2 - b.y);
      it.g.setAttribute("transform", "translate(" + it.g.dataset.x + " " + it.g.dataset.y + ")");
      x += it.w + P.STROKE + GAP;
      if (!gapDone && it.word === 1) { x += WORD_GAP - GAP; gapDone = true; }
    });
    svg.setAttribute("viewBox", "0 0 " + (x + 8) + " 110");

    items.forEach(function (it) {
      it.paths.forEach(function (p) { P.collars(it.g, p); });
    });
    wire(svg, items, P);
  }

  function wire(svg, items, P) {
    var gsap = window.gsap;
    if (!gsap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var tween = null;
    var last = -1;

    function wave(from) {
      if (tween) tween.kill();
      var proxy = { t: 0 };
      tween = gsap.to(proxy, {
        t: 5.4,
        duration: 2.2,
        ease: "none",
        onUpdate: function () {
          items.forEach(function (it, j) {
            var d = Math.abs(j - from);
            var env = Math.exp(-d * 0.2);
            var s = Math.sin(proxy.t - d * 0.62);
            var y = Number(it.g.dataset.y) + s * 10 * env;
            it.g.setAttribute("transform", "translate(" + it.g.dataset.x + " " + y.toFixed(2) + ")");
            it.paths.forEach(function (p) {
              p.setAttribute("stroke", P.mix(it.colour, "#ffffff", Math.max(0, s) * env * 0.9));
            });
          });
        },
        onComplete: function () {
          items.forEach(function (it) {
            it.g.setAttribute("transform", "translate(" + it.g.dataset.x + " " + it.g.dataset.y + ")");
            it.paths.forEach(function (p) { p.setAttribute("stroke", it.colour); });
          });
        },
      });
    }

    svg.addEventListener("mousemove", function (e) {
      var box = svg.getBoundingClientRect();
      var x = ((e.clientX - box.left) / box.width) * svg.viewBox.baseVal.width;
      var idx = 0;
      var best = 1e9;
      items.forEach(function (it, j) {
        var b = it.g.getBBox();
        var cx = Number(it.g.dataset.x) + b.width / 2;
        var d = Math.abs(cx - x);
        if (d < best) { best = d; idx = j; }
      });
      if (idx !== last) { last = idx; wave(idx); }
    });
    svg.addEventListener("mouseleave", function () { last = -1; });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
