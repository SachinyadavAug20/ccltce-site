// Narrative scroll — pinned scroll story (motion-OK desktop only).
// Desktop: full WebGL cinematic (Three.js, dragon, crystals, adaptive perf) — loaded lazily.
// Phones/tablets/reduced-motion: skip entirely — narrative.css renders the static app view
// (hero → quick tiles → content in normal scroll) with zero JS and zero Three.js download.
(function () {
  var wrapper = document.getElementById("narrative-scroll");
  if (!wrapper) return;
  if (
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    matchMedia("(max-width: 899px), (pointer: coarse)").matches
  ) return;

  // one-shot isometric voxel-cloud sprite: shaded cubes (light top, cool sides) drawn
  // once per cloud as its background — reads as 3D without DOM cube spam.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function cloudSprite(w, h, seed, band) {
    var pals = band === "sky" ? [["#eef3fa", "#d5deea", "#bcc9db"], ["#e9eff8", "#ced9e8", "#b6c4d8"]]
      : band === "mid" ? [["#ffffff", "#e8eef6", "#ccd6e2"], ["#fbfcff", "#e3eaf4", "#c8d3e1"]]
      : [["#ffffff", "#eef3f9", "#d4dce6"], ["#f6f9fd", "#e6ecf4", "#ccd6e1"]];
    var pal = pals[seed & 1];
    var dpr = 2, cv = document.createElement("canvas");
    cv.width = Math.max(16, Math.round(w * dpr));
    cv.height = Math.max(16, Math.round(h * dpr));
    var g = cv.getContext("2d"), rnd = mulberry32(seed);
    var rows = 1 + (rnd() < 0.5 ? 1 : 0) + (rnd() < 0.22 ? 1 : 0);
    var sizeK = 0.78 + rnd() * 0.5;
    var c = Math.max(10, Math.min(44, Math.round((h / 3.8) * sizeK)));
    var cols = Math.max(4, Math.floor((w - c) / c) - rows + 2);
    var cells = [], mid = (cols - 1) * (0.36 + rnd() * 0.28);
    var falloff = 0.55 + rnd() * 0.35, peakK = 0.7 + rnd() * 0.75;
    for (var i = 0; i < cols; i++) {
      var edge = Math.abs(i - mid) / (mid || 1);
      var peak = Math.max(1, Math.round((1 - edge * falloff) * 2.4 * peakK + rnd() * 1.8));
      for (var j = 0; j < rows; j++) {
        if (rnd() < edge * 0.3) continue;
        var hh = Math.max(1, peak - (j === 1 && rnd() < 0.5 ? 1 : 0));
        for (var k = 0; k < hh; k++) cells.push([i, j, k]);
      }
    }
    // random bumps & overhangs
    var bumps = 2 + Math.floor(rnd() * 4);
    for (var bi = 0; bi < bumps && cells.length; bi++) {
      var src = cells[Math.floor(rnd() * cells.length)], mk = -1;
      for (var ci = 0; ci < cells.length; ci++)
        if (cells[ci][0] === src[0] && cells[ci][1] === src[1] && cells[ci][2] > mk) mk = cells[ci][2];
      cells.push([src[0], src[1], mk + 1]);
    }
    if (rnd() < 0.7) cells.push([rnd() < 0.5 ? -1 : cols, Math.floor(rnd() * rows), 0]);
    if (rnd() < 0.5) cells.push([Math.floor(rnd() * cols), rows, 0]);

    if (!cells.length) cells.push([0, 0, 0]);
    cells.sort(function (a, b) { return (a[0] + a[1]) - (b[0] + b[1]) || a[2] - b[2]; });
    var pts = cells.map(function (q) {
      return [(q[0] - q[1]) * c, (q[0] + q[1]) * (c / 2) - q[2] * c];
    });
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pts.forEach(function (p) {
      if (p[0] - c < minX) minX = p[0] - c;
      if (p[0] + c > maxX) maxX = p[0] + c;
      if (p[1] < minY) minY = p[1];
      if (p[1] + 2 * c > maxY) maxY = p[1] + 2 * c;
    });
    var sc = Math.min((w * 0.97) / (maxX - minX), (h * 0.97) / (maxY - minY));
    var ox = (w - (maxX - minX) * sc) / 2 - minX * sc;
    var oy = (h - (maxY - minY) * sc) / 2 - minY * sc;
    g.setTransform(dpr * sc, 0, 0, dpr * sc, ox * dpr, oy * dpr);
    pts.forEach(function (p) {
      var x = p[0], y = p[1];
      [[0, [[x, y], [x + c, y + c / 2], [x, y + c], [x - c, y + c / 2]]],
       [1, [[x + c, y + c / 2], [x, y + c], [x, y + 2 * c], [x + c, y + 1.5 * c]]],
       [2, [[x - c, y + c / 2], [x, y + c], [x, y + 2 * c], [x - c, y + 1.5 * c]]]].forEach(function (f) {
        g.fillStyle = pal[f[0]];
        g.beginPath();
        g.moveTo(f[1][0][0], f[1][0][1]);
        for (var q = 1; q < f[1].length; q++) g.lineTo(f[1][q][0], f[1][q][1]);
        g.closePath(); g.fill();
        g.strokeStyle = pal[f[0]]; g.lineWidth = 0.6; g.stroke();
      });
    });
    return cv.toDataURL("image/png");
  }

  async function start() {
    var THREE = await import("../vendor/three.module.js");
    var [{ buildScene }, { createCameraPath, phaseAt, dimAt }, { initDragon }, { createLighting }, { createPerf }, { initCrystals }, { buildEaster }] =
      await Promise.all([
        import("./narrative-scene.js"),
        import("./narrative-camera.js"),
        import("./narrative-dragon.js"),
        import("./narrative-light.js"),
        import("./narrative-perf.js"),
        import("./narrative-crystals.js"),
        import("./narrative-easter.js"),
      ]);
    var canvas = document.getElementById("narrative-webgl");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "narrative-webgl";
      canvas.setAttribute("aria-hidden", "true");
      wrapper.prepend(canvas);
    }
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, powerPreference: "high-performance" });
    var camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 500);
    var built = buildScene(), scene = built.scene, L = built.lights;
    window.CCLTCE_SCENE = scene;         // scene handle — debug inspection of the End/campus builds
    var curve = createCameraPath(), stations = built.stations;
    var viewport = wrapper.querySelector(".narrative-viewport");
    var perf = createPerf({ renderer: renderer, scene: scene, section: wrapper, camera: camera });
    window.CCLTCE_PERF = perf.profile();
    window.CCLTCE_PERF_LIVE = perf.profile;   // live re-read: budget must stay a constant count
    var dragon = initDragon(scene, camera, viewport);
    window.CCLTCE_DRAGON = dragon;
    var crystals = initCrystals(scene, camera, viewport);
    window.CCLTCE_CRYSTALS = crystals;
    var easter = buildEaster(scene);
    var hint = wrapper.querySelector(".narrative-hint");
    var lookV = new THREE.Vector3(), lookA = new THREE.Vector3();
    // campus cloud fade — they thin out as the camera nears the portal so the punch
    // into the nether reads clean (no flat white slab crowding the obsidian frame)
    var cloudGrps = [];
    scene.traverse(function (o) { if (o.userData && o.userData.cloud !== undefined) cloudGrps.push(o); });
    cloudGrps.forEach(function (g) {
      g.userData.mats = [];
      g.children.forEach(function (m) { if (m.material && m.material.transparent) g.userData.mats.push(m.material); });
    });
    var light = createLighting(scene, L);
    var progress = { raw: 0, t: 0, s: 0, dim: "overworld" };
    var lastHud = -1;
    var overlays = {
      surface: wrapper.querySelector(".narrative-overlay.surface"),
      station1: wrapper.querySelector(".narrative-overlay.station-1"),
      station2: wrapper.querySelector(".narrative-overlay.station-2"),
      station3: wrapper.querySelector(".narrative-overlay.station-3"),
      bedrock: wrapper.querySelector(".narrative-overlay.bedrock"),
    };
    // F3 easter egg — vanilla debug screen (toggle with the F3 key, camera coords + biome)
    var dbgBox = null, dbgOn = false, dbgFace = new THREE.Vector3();
    addEventListener("keydown", function (e) {
      if (e.key !== "F3") return;
      e.preventDefault();
      if (!dbgBox) {
        dbgBox = document.createElement("pre");
        dbgBox.style.cssText = "position:fixed;left:14px;top:70px;z-index:70;margin:0;padding:8px 11px;" +
          "background:rgba(16,16,18,.82);color:#d8dee6;font:11px/1.55 ui-monospace,Menlo,monospace;" +
          "border:1px solid #3a3a3c;border-radius:4px;pointer-events:none;white-space:pre;display:none;backdrop-filter:blur(2px)";
        document.body.appendChild(dbgBox);
      }
      dbgOn = !dbgOn;
      dbgBox.style.display = dbgOn ? "block" : "none";
      if (window.CCLTCE_SFX && window.CCLTCE_SFX.tick) window.CCLTCE_SFX.tick();
    });
    var heroOverlay = document.querySelector(".hero-overlay");
    var cloudLayer = viewport.querySelector(".hero-clouds");
    var heroClouds = cloudLayer ? cloudLayer.querySelectorAll(".cloud") : [];
    var heroHaze = cloudLayer ? cloudLayer.querySelector(".hero-haze") : null;
    heroClouds.forEach(function (c, i) {
      if (c.dataset.n) return;
      c.dataset.n = 1;
      var w = parseFloat(c.style.width) || 360 + (i % 3) * 80;
      var h = parseFloat(c.style.height) || 100 + (i % 2) * 50;
      c.style.width = w + "px"; c.style.height = h + "px";
      var band = c.classList.contains("cloud-near") ? "near" : c.classList.contains("cloud-mid") ? "mid" : "sky";
      if (c.offsetParent) {   // layer is display:none on mobile — skip the canvas work
        c.style.backgroundImage = "url(" + cloudSprite(w, h, i * 7919 + 17, band) + ")";
        c.style.backgroundSize = "100% 100%";
        c.style.backgroundRepeat = "no-repeat";
      }
      // normalize left to px (mid band uses % in markup — parseFloat would read "64%" as 64),
      // then zero it: position now lives in c._x and is composed into transform only
      var leftRaw = c.style.left || "";
      var leftPx = leftRaw.indexOf("%") > -1
        ? (parseFloat(leftRaw) / 100) * innerWidth
        : (parseFloat(leftRaw) || 0);
      c.style.left = "0px";
      // parting lane: clouds split to the side their center sits on (fly-through feel)
      var cx = leftPx + w / 2;
      c.dataset.side = cx < innerWidth / 2 ? "-1" : "1";
      // stagger the part start so the bank peels open instead of snapping
      c.dataset.lag = (Math.random() * 0.35).toFixed(3);
      // band depth: near sweeps hardest (closest to camera), sky barely moves
      c.dataset.band = band;
      c.dataset.drift = band === "mid" ? "0.45" : band === "near" ? "1.4" : "1";
      // remember base top so parting can lift each cloud at its own rate
      c.dataset.baseTop = (parseFloat(c.style.top) || 0);
      c.dataset.bob = (Math.random() * Math.PI * 2).toFixed(3);
      c._x = leftPx;   // drift lives in JS — transform only, never layout
    });
    var lastDim = "";
    function clamp01(v) { return Math.min(1, Math.max(0, v)); }
    function updateOverlays(t) {
      var phase = phaseAt(t);
      for (var key in overlays) { var el = overlays[key]; if (el) el.classList.toggle("on", key === phase); }
      if (heroOverlay) {
        // hold hero text at FULL opacity through the first ~scroll-screens;
        // only begin the lift after t=0.10, gone by t≈0.22
        var hf = clamp01((t - 0.10) / 0.12);
        heroOverlay.style.opacity = 1 - hf;
        heroOverlay.style.transform = "translateY(" + (-50 * hf) + "px)";
        heroOverlay.style.display = hf >= 1 ? "none" : "";
      }
      if (hint) hint.style.opacity = t > 0.04 ? "0" : "1";
    }
    // simple stable cinematic: fixed 45° lens, level horizon, damped scroll follow + damped look
    var clock = new THREE.Clock(), lastEl = 0, firstLook = true;
    var lookSm = new THREE.Vector3();
    function animate() {
      requestAnimationFrame(animate);
      var el = clock.getElapsedTime(), dt = Math.min(0.1, Math.max(0.001, el - lastEl));
      lastEl = el;
      // slow single-stage cinematic glide: one fixed-rate exponential follow, no cascaded damping
      // (the old raw→t→s double lag rang the camera into little useless wiggles on stop)
      var k = 1.5;
      progress.t += (progress.raw - progress.t) * (1 - Math.exp(-k * dt));
      progress.s = progress.t;
    syncHud(progress.t);
    // minecraft clouds between the 3D scene and the hero text:
    // steady drift at rest → on scroll the bank PEELS OPEN to either side (fly-through),
    // each cloud accelerating outward on its own lane with stagger + scale-up as it passes the camera
    // hero mist fades on scroll whether or not any DOM clouds remain
    var hf = clamp01((progress.t - 0.04) / 0.20);
    var he = hf * hf * (3 - 2 * hf);            // smoothstep — soft launch, hard finish
    if (heroHaze) {
      heroHaze.style.opacity = 1 - he;
      heroHaze.style.transform = "translate(-50%,-50%) scale(" + (1 + he * 0.6) + ")";
    }
    if (heroClouds.length) {
      heroClouds.forEach(function (c) {
        var lag = +c.dataset.lag;
        var lp = clamp01((he - lag) / (1 - lag)); // per-cloud stagger of the part
        var le = lp * lp;                          // ease-in: clouds accelerate as they sweep past
        var side = +c.dataset.side;
        var band = c.dataset.band;
        // depth-based parting: near band rushes past the camera, sky barely peels
        var sweep = band === "near" ? 1.35 : band === "mid" ? 0.9 : 0.55;
        var grow = band === "near" ? 1.6 : band === "mid" ? 0.8 : 0.45;
        // drift accumulates in JS, composed into transform — no layout writes per frame
        c._x += (16 + (+c.dataset.fast * 24)) * (+c.dataset.drift) * dt;
        if (c._x > innerWidth + 180) c._x = -180;
        var sweepX = side * le * innerWidth * sweep;
        var bob = Math.sin(el * 0.6 + (+c.dataset.bob)) * 6 * (1 - he);
        var lift = (-70 * he) + bob;
        var scale = 1 + le * grow;                 // grow as it rushes the camera
        c.style.transform = "translate3d(" + (c._x + sweepX) + "px," + lift + "px,0) scale(" + scale + ")";
        c.style.opacity = (band === "mid" ? 0.82 : band === "near" ? 0.78 : 0.9) * (1 - lp * lp);
      });
    }
    if (document.hidden || !perf.visible()) return;   // off-screen: no draw, no light work
      perf.frame(dt);
      if (stations.s1) stations.s1.rotation.y = Math.sin(el * 0.3) * 0.12;
      if (stations.s2) stations.s2.rotation.y = el * 0.15;
      if (stations.s3) stations.s3.rotation.y = el * 0.2;
      var anim = perf.anim;
      for (var ai = 0; ai < anim.length; ai++) {
        var o = anim[ai], u = o.userData;
        if (u.float !== undefined) { o.position.y += Math.sin(el * 1.2 + u.float) * 0.004; o.rotation.y = Math.sin(el * 0.6 + u.float) * 0.3; }
        if (u.blink !== undefined) o.visible = Math.sin(el * 4 + u.blink * 1.7) > -0.3;
        if (u.pulse !== undefined) { var s = 1 + Math.sin(el * 2 + u.pulse) * 0.12; o.scale.set(s, s, s); }
        if (u.orbit !== undefined) {
          var a = el * u.speed + u.orbit, r = u.radius;
          o.position.x = Math.cos(a) * r; o.position.z = Math.sin(a) * r; o.position.y = 4 + Math.sin(el + u.orbit) * 2;
        }
        if (u.cart) { o.position.x = 40 + ((el * 6) % 160); o.position.y = 5.5 + Math.sin(el * 3) * 0.1; }
        if (u.cloud !== undefined) o.position.x = u.baseX + Math.sin(el * 0.02 + u.cloud) * 10;
      }
      // damped scroll follow — the frame loop owns the camera so nothing drifts off-screen
      var u = Math.min(Math.max(progress.s, 0), 1);
      camera.position.copy(curve.getPointAt(u));
      var look = lookA.copy(curve.getPointAt(Math.min(u + 0.012, 1))), shake = 0;
      if (u > 0.7432 && u < 0.9225) {
        // dive: the spline looks east into the void — hold the island (and its beams) in frame
        var iw = clamp01((u - 0.7432) / 0.06) * (1 - clamp01((u - 0.8825) / 0.04));
        look.lerp(lookV.set(200, -118, 20), iw * 0.9);
      }
      if (dragon) {
        dragon.update(el);
        var w = u > 0.7733 ? clamp01((u - 0.7733) / 0.1) : 0;   // dive → finale: keep the boss framed
        if (w > 0) look.lerp(dragon.look(lookV), w);
        shake = Math.max(dragon.shake(), crystals.shake());
      }
      crystals.update(dt);
      if (easter) easter.update(el, camera);
      if (cloudGrps.length) {
        var cd = clamp01((26 - camera.position.x) / 11);   // full at lawn, gone by x = 26
        // clouds ghost in with the first bit of scroll — the hero title zone stays clean
        var cr = 0.3 + 0.7 * clamp01(progress.t / 0.10);
        for (var cg = 0; cg < cloudGrps.length; cg++) {
          var gm = cloudGrps[cg].userData.mats;
          for (var ci = 0; ci < gm.length; ci++) gm[ci].opacity = 0.55 * cd * cr;
          cloudGrps[cg].visible = cd > 0.02;
        }
      }
      if (firstLook) { lookSm.copy(look); firstLook = false; }
      else lookSm.lerp(look, 1 - Math.exp(-1.8 * dt));   // slow steady gaze — no snap, no swing
      camera.lookAt(lookSm);
      if (shake > 0) {
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake;
        camera.rotateZ((Math.random() - 0.5) * shake * 0.12);
      }
      var ov = window.CCLTCE_CAM_OVERRIDE;   // debug camera pose { px,py,pz, lx,ly,lz } — overrides the fly-through
      if (ov) { camera.position.set(ov.px, ov.py, ov.pz); camera.lookAt(ov.lx, ov.ly, ov.lz); }
      if (dbgOn && dbgBox) {
        var bx = camera.position, bw = camera.getWorldDirection(dbgFace);
        var biome = bx.x < 40 ? "plains" : bx.x < 80 ? "camp_inside" : bx.x < 205 ? "nether_wastes" : (u > 0.7 ? "the_end" : "small_islands");
        var perfNow = typeof window.CCLTCE_PERF_LIVE === "function" ? window.CCLTCE_PERF_LIVE() : null;
        var heading = Math.round((Math.atan2(bw.x, bw.z) * 180 / Math.PI + 360) % 360);
        dbgBox.textContent =
          "CCLTCE vanilla-cine 1.0 (" + Math.round(perfNow ? perfNow.fps || 60 : 60) + " fps)\n" +
          "XYZ: " + bx.x.toFixed(3) + " / " + bx.y.toFixed(3) + " / " + bx.z.toFixed(3) + "\n" +
          "Dim: " + progress.dim + "   Biome: " + biome + "\n" +
          "Facing: " + heading + "\u00b0\n" +
          "Scroll: u = " + u.toFixed(3) + "   Glide: k = 1.5\n" +
          "Sneak: no   Sprint: no   Fly: spline\n" +
          "Easter eggs: creeper \u263a ghast TNT mossy & more \u2014 keep looking";
      }
      light.tick(progress.dim, camera);
      renderer.render(scene, camera);
    }
    // HUD (overlays + dimension) is synced from the frame loop, and only when the glide actually moved
    function syncHud(t) {
      if (t === lastHud) return;
      lastHud = t;
      updateOverlays(t);
      var dim = dimAt(t);
      if (dim !== lastDim) {
        lastDim = dim; progress.dim = dim; light.sky(dim); light.lights(dim);
        if (dragon) dragon.armed = dim === "end";
        crystals.armed = dim === "end";
        window.CCLTCE_DIM = dim;
        document.documentElement.setAttribute("data-dim", dim);
        if (window.CCLTCE_HUD && window.CCLTCE_HUD.achievement) {
          if (dim === "nether") CCLTCE_HUD.achievement("We Need To Go Deeper");
          else if (dim === "end") CCLTCE_HUD.achievement("The End?");
          else if (dim === "bedrock") CCLTCE_HUD.achievement("Into The Void");
        }
        if (window.CCLTCE_SFX && window.CCLTCE_SFX.setPhase) window.CCLTCE_SFX.setPhase(dim);
      }
    }
    function onScroll() {
      var rect = wrapper.getBoundingClientRect();
      progress.raw = clamp01(-rect.top / (wrapper.offsetHeight - innerHeight));
    }
    addEventListener("scroll", onScroll, { passive: true });
    viewport.addEventListener("pointermove", function (e) {
      var c = crystals.peek(e), d = dragon ? dragon.aim(e) : null;
      if (dragon) dragon.hover(e);
      viewport.style.cursor = (c && (d === null || c.distance < d)) || d !== null ? "crosshair" : "";
    }, { passive: true });
    // nearest target wins, so a crystal behind the boss can't steal its hit
    viewport.addEventListener("click", function (e) {
      var c = crystals.peek(e), d = dragon ? dragon.aim(e) : null;
      if (c && (d === null || c.distance < d)) crystals.hit(e);
      else if (d !== null) dragon.click(e);
    });
    addEventListener("resize", function () {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      perf.resize();
      onScroll();   // viewport height changes (mobile URL bar) re-normalize raw
    });
    light.sky("overworld"); light.lights("overworld");
    updateOverlays(0); animate(); onScroll();
    window.CCLTCE_PROGRESS = progress;   // live scroll glide { raw, t, s } — tests + debug console
    window.CCLTCE_CAM = camera;          // camera handle — debug views for the frame-loop-owned camera
  }
  start().catch(function (err) {
    console.warn("Narrative WebGL path unavailable —", err);
  });
})();
