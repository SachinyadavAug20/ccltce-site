// Hero title — NASA Worm style interconnected pipeline wordmark.
// Renders "CODING CLUB" as a continuous aerospace pipeline system with
// industrial coupling joints, flowing luminous plasma cores, and interactive hover surges.
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var VB_W = 620;
  var VB_H = 120;

  function el(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    if (attrs) {
      for (var k in attrs) n.setAttribute(k, attrs[k]);
    }
    return n;
  }

  function mount() {
    var h1 = document.querySelector(".hero-title");
    var P = window.CCLTCE_PIPES;
    if (!h1 || !P) return;

    var svg = el("svg", {
      class: "hero-title-svg",
      viewBox: "0 0 " + VB_W + " " + VB_H,
      role: "img",
      "aria-label": "Coding Club",
    });

    // Hidden accessible text for screen readers
    h1.innerHTML = '<span class="sr-only">Coding Club</span>';
    h1.appendChild(svg);

    // Create aerospace gradients, glow filters, and surge shaders
    P.createDefs(svg);

    // Layer groups for proper pipeline z-stacking
    var gCasings = el("g", { class: "pipe-layer-casings" });
    var gRunners = el("g", { class: "pipe-layer-runners" });
    var gLetters = el("g", { class: "pipe-layer-letters" });
    var gPlasma  = el("g", { class: "pipe-layer-plasma" });
    var gCollars = el("g", { class: "pipe-layer-collars" });

    svg.appendChild(gCasings);
    svg.appendChild(gRunners);
    svg.appendChild(gLetters);
    svg.appendChild(gPlasma);
    svg.appendChild(gCollars);

    var letterItems = [];
    var plasmaPaths = [];

    // 1. Render interconnecting baseline pipeline runners
    P.RUNNERS.forEach(function (r) {
      var d = "M " + r.from + " 100 L " + r.to + " 100";
      var casing = el("path", {
        d: d, fill: "none", stroke: P.DARK, "stroke-width": P.STROKE_OUTER,
        "stroke-linecap": "round", "stroke-linejoin": "round", opacity: "0.9",
      });
      gCasings.appendChild(casing);

      var wall = el("path", {
        d: d, fill: "none", stroke: "url(#pipe-runner-grad)", "stroke-width": P.STROKE_PIPE,
        "stroke-linecap": "round", "stroke-linejoin": "round",
      });
      gRunners.appendChild(wall);

      var core = el("path", {
        d: d, fill: "none", stroke: (r.type === "bridge" ? P.PURPLE : P.CYAN), "stroke-width": P.STROKE_CORE,
        "stroke-linecap": "round", "stroke-linejoin": "round", opacity: "0.85",
      });
      gRunners.appendChild(core);

      var plasma = el("path", {
        d: d, fill: "none", stroke: P.WHITE, "stroke-width": P.STROKE_PULSE,
        "stroke-dasharray": "10 24", "stroke-dashoffset": "0", "stroke-linecap": "round",
        opacity: "0.85",
      });
      gPlasma.appendChild(plasma);
      plasmaPaths.push(plasma);
    });

    // 2. Render NASA Worm Letterforms
    P.GLYPH_DATA.forEach(function (gData, i) {
      var lg = el("g", { class: "ht-letter", "data-index": i, "data-id": gData.id });
      var swPipe  = gData.strokePipe  || P.STROKE_PIPE;
      var swOuter = gData.strokeOuter || P.STROKE_OUTER;
      var swCore  = gData.strokeCore  || P.STROKE_CORE;
      var swPulse = gData.strokePulse || P.STROKE_PULSE;

      // Outer casing for contrast
      var casing = el("path", {
        d: gData.d, fill: "none", stroke: P.DARK, "stroke-width": swOuter,
        "stroke-linecap": "round", "stroke-linejoin": "round", opacity: "0.92",
      });
      gCasings.appendChild(casing);

      // Main metallic pipe wall
      var wallGrad = gData.word === 0 ? "url(#pipe-wall-0)" : "url(#pipe-wall-1)";
      var wall = el("path", {
        d: gData.d, fill: "none", stroke: wallGrad, "stroke-width": swPipe,
        "stroke-linecap": "round", "stroke-linejoin": "round",
      });
      lg.appendChild(wall);

      // Inner luminous fluid core
      var defaultCoreCol = gData.word === 0 ? "#7dd3fc" : "#5eead4";
      var core = el("path", {
        d: gData.d, fill: "none", stroke: defaultCoreCol, "stroke-width": swCore,
        "stroke-linecap": "round", "stroke-linejoin": "round",
      });
      lg.appendChild(core);

      // Plasma pulse dash stroke
      var plasma = el("path", {
        d: gData.d, fill: "none", stroke: P.WHITE, "stroke-width": swPulse,
        "stroke-dasharray": "12 30", "stroke-dashoffset": "0", "stroke-linecap": "round",
        opacity: "0.75",
      });
      lg.appendChild(plasma);
      plasmaPaths.push(plasma);

      gLetters.appendChild(lg);

      letterItems.push({
        index: i,
        id: gData.id,
        ch: gData.ch,
        word: gData.word,
        cx: gData.x + gData.w / 2,
        group: lg,
        casing: casing,
        wall: wall,
        core: core,
        plasma: plasma,
        strokeCore: swCore,
        defaultCore: defaultCoreCol,
        defaultWall: wallGrad,
      });
    });

    // 3. Render Pipe Collars (Bolted coupling joints & indicator LEDs)
    P.COLLARS.forEach(function (c) {
      P.renderCollar(gCollars, c);
    });

    // 4. Wire continuous plasma flow & interactive hover surges
    wireInteraction(svg, letterItems, plasmaPaths, P);
  }

  function wireInteraction(svg, letterItems, plasmaPaths, P) {
    var gsap = window.gsap;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Continuous smooth plasma flow through the interconnected pipes
    var offset = 0;
    var animFrame = null;
    function flowTick() {
      offset = (offset - 0.75) % 400;
      for (var i = 0; i < plasmaPaths.length; i++) {
        plasmaPaths[i].setAttribute("stroke-dashoffset", offset.toFixed(1));
      }
      animFrame = requestAnimationFrame(flowTick);
    }
    if (!reduce) {
      flowTick();
    }

    // Hover state management
    var surgeState = { active: false, centerIdx: -1, intensity: 0 };
    var surgeTween = null;

    function applySurge(centerIdx, intensity) {
      letterItems.forEach(function (it, j) {
        var dist = Math.abs(j - centerIdx);
        var falloff = Math.exp(-dist * 0.42) * intensity;

        if (falloff > 0.05) {
          // Surge active on this letter: heat up fluid & ignite glow
          var heatColor = dist === 0 ? "#fbbf24" : (dist <= 1 ? "#f59e0b" : "#8b5cf6");
          it.core.setAttribute("stroke", heatColor);
          it.core.setAttribute("stroke-width", (it.strokeCore + falloff * 5).toFixed(1));
          it.group.setAttribute("filter", "url(#surge-glow)");

          // Hydraulic pressure lift
          var liftY = -falloff * 4.5;
          it.group.setAttribute("transform", "translate(0 " + liftY.toFixed(2) + ")");
          it.casing.setAttribute("transform", "translate(0 " + liftY.toFixed(2) + ")");
        } else {
          // Normal state
          it.core.setAttribute("stroke", it.defaultCore);
          it.core.setAttribute("stroke-width", it.strokeCore);
          it.group.removeAttribute("filter");
          it.group.removeAttribute("transform");
          it.casing.removeAttribute("transform");
        }
      });

      // Illuminate nearby coupling collar LEDs as surge passes
      var surgeCx = centerIdx >= 0 && letterItems[centerIdx] ? letterItems[centerIdx].cx : -999;
      var collars = svg.querySelectorAll(".collar-led");
      collars.forEach(function (led, k) {
        var cData = P.COLLARS[k];
        if (!cData) return;
        var distToSurge = Math.abs(surgeCx - cData.x);
        if (distToSurge < 70 && intensity > 0.2) {
          led.setAttribute("fill", "#fbbf24");
          led.setAttribute("r", "3.2");
        } else {
          led.setAttribute("fill", cData.kind === "manifold" ? P.AMBER : P.TEAL);
          led.setAttribute("r", "2.2");
        }
      });
    }

    // Mousemove tracking along the SVG
    svg.addEventListener("mousemove", function (e) {
      var rect = svg.getBoundingClientRect();
      var mx = ((e.clientX - rect.left) / rect.width) * VB_W;

      // Find nearest letter
      var nearestIdx = 0;
      var minDist = 1e9;
      letterItems.forEach(function (it, j) {
        var d = Math.abs(it.cx - mx);
        if (d < minDist) {
          minDist = d;
          nearestIdx = j;
        }
      });

      surgeState.centerIdx = nearestIdx;
      surgeState.active = true;

      if (gsap && !reduce) {
        if (surgeTween) surgeTween.kill();
        surgeState.intensity = 1.0;
        applySurge(nearestIdx, 1.0);
      } else {
        applySurge(nearestIdx, 1.0);
      }
    });

    svg.addEventListener("mouseleave", function () {
      surgeState.active = false;
      if (gsap && !reduce) {
        if (surgeTween) surgeTween.kill();
        surgeTween = gsap.to(surgeState, {
          intensity: 0,
          duration: 0.6,
          ease: "power2.out",
          onUpdate: function () {
            applySurge(surgeState.centerIdx, surgeState.intensity);
          },
          onComplete: function () {
            applySurge(-1, 0);
          },
        });
      } else {
        applySurge(-1, 0);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
