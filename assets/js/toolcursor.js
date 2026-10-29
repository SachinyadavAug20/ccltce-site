// Tool cursor — GSAP-driven custom cursor (desktop, fine pointer, motion-OK).
// Native cursors stay for everyone else. The tool swap is an animated "equip"
// (crossfade + pop) and the follow is a short GSAP trail — no hotspot jumps.
//
// Visibility contract: the sprite is re-asserted on EVERY pointer event
// (move + over + enter), so no leave/focus/reload race can leave a window
// with cursor:none and no visible sprite. The native cursor is hidden only
// after the first event seeds + equips the sprite.
(function () {
  if (!window.gsap) return;
  // window.__TC_FORCE is a headless/probe hook only — never set on real pages
  if (!window.__TC_FORCE && !matchMedia("(pointer: fine) and (hover: hover)").matches) return;
  if (!window.__TC_FORCE && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var SIZE = 44;
  var TOOLS = {
    sword: { src: "assets/cursors/iron-sword.svg", ox: 0, oy: 0 },
    pickaxe: { src: "assets/cursors/gold-pickaxe.svg", ox: 6, oy: 9 },
    axe: { src: "assets/cursors/netherite-axe.svg", ox: 15, oy: 4 },
    torch: { src: "assets/cursors/redstone-torch.svg", ox: 24, oy: 16 },
    shield: { src: "assets/cursors/shield.svg", ox: 23, oy: 23 },
  };

  var style = document.createElement("style");
  style.textContent =
    "html.tool-cursor-on, html.tool-cursor-on * { cursor: none !important; }" +
    "html.tool-cursor-on input, html.tool-cursor-on textarea," +
    "html.tool-cursor-on select, html.tool-cursor-on [contenteditable='true'] { cursor: auto !important; }" +
    "#tool-cursor { position: fixed; left: 0; top: 0; z-index: 10000; pointer-events: none; }" +
    "#tool-cursor .tc-sprite { position: relative; width: 0; height: 0; will-change: transform; }" +
    "#tool-cursor img { position: absolute; width: " + SIZE + "px; height: " + SIZE + "px;" +
    " image-rendering: pixelated; will-change: transform, opacity; opacity: 0; visibility: hidden;" +
    " -webkit-user-drag: none; user-select: none; }";
  document.head.appendChild(style);

  var wrap = document.createElement("div");
  wrap.id = "tool-cursor";
  wrap.setAttribute("aria-hidden", "true");
  var sprite = document.createElement("div");
  sprite.className = "tc-sprite";
  var imgs = {}, imgReady = {};
  Object.keys(TOOLS).forEach(function (name) {
    var t = TOOLS[name];
    var im = new Image();
    im.src = t.src;
    im.alt = "";
    im.draggable = false;
    im.style.left = (SIZE / 2 - t.ox * (SIZE / 64)) + "px";
    im.style.top = (SIZE / 2 - t.oy * (SIZE / 64)) + "px";
    gsap.set(im, { autoAlpha: 0, scale: 0.55, rotation: -20 });
    sprite.appendChild(im);
    imgs[name] = im;
    imgReady[name] = false;
  });
  wrap.appendChild(sprite);
  document.body.appendChild(wrap);
  // cursor:none is applied only after the first pointer event seeds + equips the
  // sprite — hiding the native cursor on load leaves a window with NO cursor
  // until the mouse moves (visible gap on page load and wheel-only interaction).
  gsap.set(wrap, { autoAlpha: 0 });

  var xTo = gsap.quickTo(wrap, "x", { duration: 0.13, ease: "power3.out" });
  var yTo = gsap.quickTo(wrap, "y", { duration: 0.13, ease: "power3.out" });
  var rotTo = gsap.quickTo(sprite, "rotation", { duration: 0.35, ease: "power2.out" });

  var current = null;      // equipped tool name, or "hidden"
  var baseState = "sword"; // resolved state when not pressing
  var pressed = false;
  var lastX = 0, lastY = 0, seeded = false;
  var wrapVisible = false;

  function showWrap(on) {
    if (on === wrapVisible) return;
    wrapVisible = on;
    gsap.to(wrap, { autoAlpha: on ? 1 : 0, duration: on ? 0.12 : 0.1, overwrite: "auto" });
  }

  function equip(name) {
    if (name === current) {
      // self-heal: a leave/focus race must not leave the sprite hidden while
      // the pointer is on the page. Never restart an in-flight pop — only
      // re-assert once its tween has finished (or was killed).
      if (name !== "hidden") {
        if (imgReady[name] && !gsap.isTweening(imgs[name])) gsap.set(imgs[name], { autoAlpha: 1 });
        showWrap(true);
      }
      return;
    }
    var prevName = current;
    current = name;
    var prev = prevName && prevName !== "hidden" ? imgs[prevName] : null;
    var next = name === "hidden" ? null : imgs[name];
    if (prev) {
      imgReady[prevName] = false;
      gsap.killTweensOf(prev);
      gsap.to(prev, { autoAlpha: 0, scale: 0.5, rotation: -24, duration: 0.1, ease: "power2.in", overwrite: "auto" });
    }
    if (next) {
      imgReady[name] = false;
      gsap.killTweensOf(next);
      gsap.fromTo(next,
        { autoAlpha: 0, scale: 0.4, rotation: 26 },
        {
          autoAlpha: 1, scale: 1, rotation: 0, duration: 0.22, ease: "back.out(3)", overwrite: "auto",
          delay: prev ? 0.04 : 0,
          onComplete: function () { imgReady[name] = true; },
        });
      showWrap(true);
    } else {
      showWrap(false);
    }
  }

  function stateFor(el) {
    if (!el || el === document.documentElement || el === document.body) return "sword";
    if (el.closest && el.closest("[disabled], .disabled, .blocked, [aria-disabled='true']")) return "shield";
    if (el.closest && el.closest("input, textarea, select, [contenteditable='true']")) return "hidden";
    if (el.closest && el.closest("a, button, [role='button'], .clickable, summary, label, .btn, .t-btn, .foot-links a, .foot-social a, .nav-cta a, .mobile-menu a, .sound-toggle, .nav-burger, .brand, .tab, .home-tile")) return "pickaxe";
    return "sword";
  }

  function apply() {
    equip(pressed && baseState !== "hidden" ? "axe" : baseState);
  }

  function drive(e) {
    if (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    if (!seeded) {
      gsap.set(wrap, { x: e.clientX, y: e.clientY });
      seeded = true;
      document.documentElement.classList.add("tool-cursor-on");
    }
    xTo(e.clientX);
    yTo(e.clientY);
    var dx = e.clientX - lastX;
    lastX = e.clientX;
    var dy = e.clientY - lastY;
    lastY = e.clientY;
    var vel = Math.max(-14, Math.min(14, dx * 0.9));
    rotTo(vel);
    baseState = stateFor(e.target);
    apply(); // equip early-returns + self-heals, so running this every event is cheap
  }

  document.addEventListener("pointermove", drive, { passive: true });
  // pointerover also fires on element entry (and on some browsers at load under
  // the resting pointer) — equipping here removes the pre-move dead window.
  document.addEventListener("pointerover", drive, { passive: true });

  document.addEventListener("pointerdown", function (e) {
    if (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    if (baseState === "hidden") return;
    pressed = true;
    apply();
    gsap.to(sprite, { scale: 0.88, duration: 0.08, ease: "power2.out", overwrite: "auto" });
  }, { passive: true });

  document.addEventListener("pointerup", function () {
    if (!pressed) return;
    pressed = false;
    apply();
    gsap.to(sprite, { scale: 1, duration: 0.18, ease: "back.out(3)", overwrite: "auto" });
  }, { passive: true });

  document.documentElement.addEventListener("mouseleave", function () {
    current = "hidden";
    showWrap(false);
  });
  document.documentElement.addEventListener("pointerenter", function () {
    if (seeded) apply();
  });

  if (window.__TC_FORCE) {
    window.__TC_DEBUG = {
      state: function () { return { current: current, base: baseState, pressed: pressed, wrapVisible: wrapVisible }; },
      equip: equip,
    };
  }
})();
