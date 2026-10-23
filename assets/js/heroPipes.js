// NASA Worm style interconnected pipeline typography engine.
// Generates authentic, bold tubular letterforms based on Richard Danne & Bruce Blackburn's
// 1975 NASA Worm font, with seamless fluid conduits and sleek aerospace manifold coupling.
(function () {
  var NS = "http://www.w3.org/2000/svg";

  // Clean, Bold Tubular Geometric Constants
  var STROKE_OUTER = 28; // Deep dark shadow casing
  var STROKE_PIPE  = 20; // Thick, bold metallic pipe wall
  var STROKE_CORE  = 5.5;// Luminous laser/fluid conduit
  var STROKE_PULSE = 3.5;// Flowing plasma pulse

  // Color tokens
  var TEAL   = "#2dd4bf";
  var CYAN   = "#38bdf8";
  var PURPLE = "#8b5cf6"; // NASA specimen purple
  var AMBER  = "#fbbf24";
  var DARK   = "#02090e";
  var WHITE  = "#ffffff";

  function el(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    if (attrs) {
      for (var k in attrs) n.setAttribute(k, attrs[k]);
    }
    return n;
  }

  // NASA Worm Letterforms (Centerline coordinates on y = 20 to 100, height = 80)
  // Cleanly tracked, continuous aerospace pipe flow with clear negative counters.
  // Letter 'I' is weighted with custom strokePipe=28 for balanced optical mass.
  var GLYPH_DATA = [
    // Word 0: CODING
    {
      id: "C1", ch: "C", word: 0, x: 24, w: 48,
      d: "M 72 20 L 44 20 A 20 20 0 0 0 24 40 L 24 80 A 20 20 0 0 0 44 100 L 72 100",
    },
    {
      id: "O", ch: "O", word: 0, x: 84, w: 50,
      d: "M 104 20 L 114 20 A 20 20 0 0 1 134 40 L 134 80 A 20 20 0 0 1 114 100 L 104 100 A 20 20 0 0 1 84 80 L 84 40 A 20 20 0 0 1 104 20 Z",
    },
    {
      id: "D", ch: "D", word: 0, x: 144, w: 48,
      d: "M 144 100 L 144 20 L 166 20 A 26 26 0 0 1 192 46 L 192 74 A 26 26 0 0 1 166 100 Z",
    },
    {
      id: "I", ch: "I", word: 0, x: 196, w: 28,
      strokePipe: 28, strokeOuter: 38, strokeCore: 8, strokePulse: 5,
      d: "M 210 20 L 210 100",
    },
    {
      id: "N", ch: "N", word: 0, x: 232, w: 48,
      // NASA Worm N: vertical up from 232, rounded corner, diagonal down to 282 baseline
      d: "M 232 100 L 232 38 A 18 18 0 0 1 250 20 L 264 82 A 18 18 0 0 0 282 100",
    },
    {
      id: "G", ch: "G", word: 0, x: 294, w: 48,
      // NASA Worm G: C-curve with upward turn and inward horizontal spur
      d: "M 342 20 L 314 20 A 20 20 0 0 0 294 40 L 294 80 A 20 20 0 0 0 314 100 L 330 100 A 14 14 0 0 0 344 86 L 344 62 L 322 62",
    },

    // Word 1: CLUB
    {
      id: "C2", ch: "C", word: 1, x: 382, w: 48,
      d: "M 430 20 L 402 20 A 20 20 0 0 0 382 40 L 382 80 A 20 20 0 0 0 402 100 L 430 100",
    },
    {
      id: "L", ch: "L", word: 1, x: 442, w: 42,
      d: "M 442 20 L 442 80 A 20 20 0 0 0 462 100 L 484 100",
    },
    {
      id: "U", ch: "U", word: 1, x: 496, w: 48,
      d: "M 496 20 L 496 80 A 20 20 0 0 0 516 100 L 524 100 A 20 20 0 0 0 544 80 L 544 20",
    },
    {
      id: "B", ch: "B", word: 1, x: 556, w: 42,
      // NASA Worm B: dual symmetrical rounded lobes meeting at y=60 with open counters
      d: "M 556 100 L 556 20 L 580 20 A 13 13 0 0 1 598 35 L 598 45 A 13 13 0 0 1 580 60 L 556 60 L 580 60 A 13 13 0 0 1 598 75 L 598 85 A 13 13 0 0 1 580 100 L 556 100",
    },
  ];

  // Interconnecting baseline pipeline runners along y = 100
  var RUNNERS = [
    { from: 72,  to: 104, type: "runner" },   // C1 -> O
    { from: 114, to: 144, type: "runner" },   // O -> D
    { from: 166, to: 210, type: "runner" },   // D -> I
    { from: 210, to: 232, type: "runner" },   // I -> N
    { from: 282, to: 314, type: "runner" },   // N -> G
    { from: 330, to: 402, type: "bridge" },   // G -> C2 (CODING to CLUB manifold bridge!)
    { from: 430, to: 462, type: "runner" },   // C2 -> L
    { from: 484, to: 516, type: "runner" },   // L -> U
    { from: 524, to: 556, type: "runner" },   // U -> B
  ];

  // Sleek, minimal central inter-word manifold coupling
  var COLLARS = [
    { x: 366, y: 100, kind: "manifold" },  // Central inter-word bypass coupler
  ];

  // Creates defs with 3D cylindrical lighting shaders and glowing plasma filters
  function createDefs(svg) {
    var defs = el("defs");

    // Glow filter for ambient and hover surge
    var filter = el("filter", { id: "pipe-glow", x: "-30%", y: "-30%", width: "160%", height: "160%" });
    var blur = el("feGaussianBlur", { stdDeviation: "5", result: "blur" });
    var merge = el("feMerge");
    merge.appendChild(el("feMergeNode", { in: "blur" }));
    merge.appendChild(el("feMergeNode", { in: "SourceGraphic" }));
    filter.appendChild(blur); filter.appendChild(merge);
    defs.appendChild(filter);

    // Intense surge bloom filter
    var surgeFilter = el("filter", { id: "surge-glow", x: "-50%", y: "-50%", width: "200%", height: "200%" });
    var sBlur = el("feGaussianBlur", { stdDeviation: "9", result: "sblur" });
    var sMerge = el("feMerge");
    sMerge.appendChild(el("feMergeNode", { in: "sblur" }));
    sMerge.appendChild(el("feMergeNode", { in: "SourceGraphic" }));
    surgeFilter.appendChild(sBlur); surgeFilter.appendChild(sMerge);
    defs.appendChild(surgeFilter);

    // Word 0: CODING (Photorealistic 3D Cylindrical Chrome -> Electric Sky)
    var grad0 = el("linearGradient", { id: "pipe-wall-0", x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
    grad0.appendChild(el("stop", { offset: "0%", "stop-color": "#0284c7" }));
    grad0.appendChild(el("stop", { offset: "10%", "stop-color": "#ffffff" }));
    grad0.appendChild(el("stop", { offset: "24%", "stop-color": "#e0f2fe" }));
    grad0.appendChild(el("stop", { offset: "50%", "stop-color": "#38bdf8" }));
    grad0.appendChild(el("stop", { offset: "78%", "stop-color": "#0369a1" }));
    grad0.appendChild(el("stop", { offset: "100%", "stop-color": "#021a2c" }));
    defs.appendChild(grad0);

    // Word 1: CLUB (Photorealistic 3D Cylindrical Aqua Teal)
    var grad1 = el("linearGradient", { id: "pipe-wall-1", x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
    grad1.appendChild(el("stop", { offset: "0%", "stop-color": "#0d9488" }));
    grad1.appendChild(el("stop", { offset: "10%", "stop-color": "#ffffff" }));
    grad1.appendChild(el("stop", { offset: "24%", "stop-color": "#a7f3d0" }));
    grad1.appendChild(el("stop", { offset: "50%", "stop-color": "#2dd4bf" }));
    grad1.appendChild(el("stop", { offset: "78%", "stop-color": "#0f766e" }));
    grad1.appendChild(el("stop", { offset: "100%", "stop-color": "#02211f" }));
    defs.appendChild(grad1);

    // Runner / Conduit Gradient (Continuous connecting baseline)
    var gradRunner = el("linearGradient", { id: "pipe-runner-grad", x1: "0%", y1: "0%", x2: "100%", y2: "0%" });
    gradRunner.appendChild(el("stop", { offset: "0%", "stop-color": "#38bdf8" }));
    gradRunner.appendChild(el("stop", { offset: "50%", "stop-color": "#818cf8" }));
    gradRunner.appendChild(el("stop", { offset: "100%", "stop-color": "#2dd4bf" }));
    defs.appendChild(gradRunner);

    svg.appendChild(defs);
    return defs;
  }

  // Renders a sleek, minimal aerospace coupling sleeve
  function renderCollar(parentGroup, c) {
    var g = el("g", { class: "pipe-collar", transform: "translate(" + c.x + " " + c.y + ")" });
    var h = 26; // sleek height matching pipe outer envelope
    var w = 6;

    // Brushed titanium collar ring
    var ring = el("rect", {
      x: -w / 2, y: -h / 2, width: w, height: h,
      rx: 1.5, ry: 1.5,
      fill: "#0b1924",
      stroke: PURPLE,
      "stroke-width": 1.4,
      opacity: "0.95",
    });
    g.appendChild(ring);

    // Luminous fiber-optic indicator LED
    var led = el("circle", {
      cx: 0, cy: 0, r: 1.8,
      fill: AMBER,
      class: "collar-led",
    });
    g.appendChild(led);

    parentGroup.appendChild(g);
  }

  window.CCLTCE_PIPES = {
    NS: NS,
    el: el,
    GLYPH_DATA: GLYPH_DATA,
    RUNNERS: RUNNERS,
    COLLARS: COLLARS,
    STROKE_OUTER: STROKE_OUTER,
    STROKE_PIPE: STROKE_PIPE,
    STROKE_CORE: STROKE_CORE,
    STROKE_PULSE: STROKE_PULSE,
    TEAL: TEAL,
    CYAN: CYAN,
    PURPLE: PURPLE,
    AMBER: AMBER,
    DARK: DARK,
    WHITE: WHITE,
    createDefs: createDefs,
    renderCollar: renderCollar,
  };
})();
