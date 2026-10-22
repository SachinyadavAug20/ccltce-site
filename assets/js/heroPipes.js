// Pipe drawing helpers for the hero title: thick strokes, collar joints, bolts.
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var STROKE = 26;
  var TEAL = "#2dd4bf";
  var AMBER = "#fbbf24";

  function el(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  function hex(c) {
    var s = c.replace("#", "");
    return [0, 2, 4].map(function (i) { return parseInt(s.substr(i, 2), 16); });
  }

  function mix(a, b, t) {
    var pa = hex(a);
    var pb = hex(b);
    return "rgb(" + pa.map(function (v, i) { return Math.round(v + (pb[i] - v) * t); }).join(",") + ")";
  }

  // One pipe run: a dark casing for contrast plus the coloured pipe on top.
  function pipe(g, d, colour) {
    var common = {
      d: d,
      fill: "none",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    };
    var dark = el("path", Object.assign({ stroke: "#050d0f", "stroke-width": STROKE + 8, opacity: 0.75 }, common));
    var p = el("path", Object.assign({ stroke: colour, "stroke-width": STROKE }, common));
    g.appendChild(dark);
    g.appendChild(p);
    return p;
  }

  // Flange + bolt screws spaced along the run.
  function collars(g, path) {
    var len = path.getTotalLength();
    for (var d = 24; d < len - 6; d += 32) {
      var p = path.getPointAtLength(d);
      var q = path.getPointAtLength(Math.min(len, d + 1.5));
      var dx = q.x - p.x;
      var dy = q.y - p.y;
      var m = Math.hypot(dx, dy) || 1;
      var nx = (-dy / m) * 12;
      var ny = (dx / m) * 12;
      g.appendChild(el("line", {
        x1: p.x - nx, y1: p.y - ny, x2: p.x + nx, y2: p.y + ny,
        stroke: TEAL, "stroke-width": 5, "stroke-linecap": "round",
      }));
      [1, -1].forEach(function (s) {
        g.appendChild(el("circle", {
          cx: p.x + nx * s, cy: p.y + ny * s, r: 3.4,
          fill: "#04100f", stroke: AMBER, "stroke-width": 1.3,
        }));
      });
    }
  }

  window.CCLTCE_PIPES = { pipe: pipe, collars: collars, mix: mix, STROKE: STROKE, TEAL: TEAL };
})();
