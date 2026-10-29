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

  async function start() {
    var THREE = await import("../vendor/three.module.js");
    var [{ buildScene }, { createCameraPath, phaseAt, dimAt }, { initDragon }, { createLighting }, { createPerf }, { initCrystals }] =
      await Promise.all([
        import("./narrative-scene.js"),
        import("./narrative-camera.js"),
        import("./narrative-dragon.js"),
        import("./narrative-light.js"),
        import("./narrative-perf.js"),
        import("./narrative-crystals.js"),
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
    var curve = createCameraPath(), stations = built.stations;
    var viewport = wrapper.querySelector(".narrative-viewport");
    var perf = createPerf({ renderer: renderer, scene: scene, section: wrapper, camera: camera });
    window.CCLTCE_PERF = perf.profile();
    window.CCLTCE_PERF_LIVE = perf.profile;   // live re-read: budget must stay a constant count
    var dragon = initDragon(scene, camera, viewport);
    window.CCLTCE_DRAGON = dragon;
    var crystals = initCrystals(scene, camera, viewport);
    window.CCLTCE_CRYSTALS = crystals;
    var hint = wrapper.querySelector(".narrative-hint");
    var lookV = new THREE.Vector3(), lookA = new THREE.Vector3();
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
    var heroOverlay = document.querySelector(".hero-overlay");
    var heroClouds = heroOverlay ? heroOverlay.querySelectorAll(".cloud") : [];
    heroClouds.forEach(function (c, i) {
      if (c.dataset.n) return;
      c.dataset.n = 1;
      var w = 150 + (i % 3) * 45, h = 44 + (i % 2) * 22;
      c.style.width = w + "px"; c.style.height = h + "px";
      var n = 5 + (i % 6);
      var frag = document.createDocumentFragment();
      for (var k = 0; k < n; k++) {
        var size = 10 + Math.random() * 22;
        var cube = document.createElement("div");
        cube.className = "cloud-cube";
        cube.style.left = (Math.random() * (w - size)) + "px";
        cube.style.top = (Math.random() * h * 0.55) + "px";
        cube.style.width = size + "px"; cube.style.height = size + "px";
        frag.appendChild(cube);
      }
      var base = document.createElement("div"); base.className = "cloud-base";
      base.style.left = (w * 0.1) + "px"; base.style.width = (w * 0.8) + "px"; base.style.bottom = "3px";
      frag.appendChild(base);
      c.appendChild(frag);
      c.style.left = ((i / Math.max(heroClouds.length, 1)) * innerWidth + (i % 3) * 55) + "px";
    });
    var lastDim = "";
    function clamp01(v) { return Math.min(1, Math.max(0, v)); }
    function updateOverlays(t) {
      var phase = phaseAt(t);
      for (var key in overlays) { var el = overlays[key]; if (el) el.classList.toggle("on", key === phase); }
      if (heroOverlay) {
        var hf = clamp01((t - 0.05) / 0.16);
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
      // smooth cinematic scroll glide: responsive exponential tracking without runaway lag.
      // k blends 5→10 across raw 0.2–0.4 so the intro stays floaty and mid/late travel stays
      // tight — a hard switch would jolt the camera as it crosses the threshold.
      var k = 5 + 5 * clamp01((progress.raw - 0.2) / 0.2);
      var ease = 1 - Math.exp(-k * dt);
      progress.t += (progress.raw - progress.t) * ease;
      progress.s += (progress.t - progress.s) * (1 - Math.pow(0.0004, dt));
      if (Math.abs(progress.t - progress.s) < 0.0002) progress.s = progress.t;
    syncHud(progress.t);
    // minecraft clouds between the 3D scene and the hero text: steady horizontal drift,
    // then rise and fade away as the hero text fades out on scroll
    if (heroClouds.length) {
      var hf = clamp01((progress.t - 0.05) / 0.16);
      heroClouds.forEach(function (c) {
        var x = parseFloat(c.style.left || 0) + (16 + (+c.dataset.fast * 24)) * dt;
        if (x > innerWidth + 180) x = -180;
        c.style.left = x + "px";
        c.style.transform = "translateY(" + (-70 * hf) + "px) scale(" + (1 - 0.55 * hf) + ")";
        c.style.opacity = 0.9 * (1 - hf);
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
      var look = lookA.copy(curve.getPointAt(Math.min(u + 0.04, 1))), shake = 0;
      if (dragon) {
        dragon.update(el);
        var w = u > 0.75 ? clamp01((u - 0.75) / 0.1) : 0;   // dive → finale: keep the boss framed
        if (w > 0) look.lerp(dragon.look(lookV), w);
        shake = Math.max(dragon.shake(), crystals.shake());
      }
      crystals.update(dt);
      if (firstLook) { lookSm.copy(look); firstLook = false; }
      else lookSm.lerp(look, 1 - Math.pow(0.0005, dt));
      camera.lookAt(lookSm);
      if (shake > 0) {
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake;
        camera.rotateZ((Math.random() - 0.5) * shake * 0.12);
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
  }
  start().catch(function (err) {
    console.warn("Narrative WebGL path unavailable —", err);
  });
})();
