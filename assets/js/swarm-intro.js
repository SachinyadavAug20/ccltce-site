/**
 * CCLTCE — Swarm Rebuild (Building the REAL Website Edition)
 * Inspired by Joel Califa's Swarm & Dhvanil Patel's swarm-cursors.
 *
 * Collaborative Minecraft cursors actively assemble the ACTUAL live DOM
 * elements (.nav-wrap, .hero-logo, .hero-badge, .hero-title, .hero-sub, .hero-cta)
 * with second-order spring mouse physics and authentic Minecraft sound design!
 *
 * Runs on every refresh • Smooth spring physics • Instant skip (Esc/click).
 */
(function () {
  "use strict";

  if (window.CCLTCE_SWARM && window.CCLTCE_SWARM._active) return;

  var DURATION = 4400; // ~4.4s deliberate cinema pacing
  var isPlaying = false;
  var animFrameId = null;
  var overlayEl = null;
  var audioCtx = null;
  var timeouts = [];

  // =========================================================================
  // Web Audio Procedural Synthesis (Minecraft Sound Design)
  // =========================================================================
  function getAudioCtx() {
    if (audioCtx) return audioCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    } catch (e) {}
    return audioCtx;
  }

  function playTone(freq, type, duration, vol, rampFreq) {
    if (localStorage.getItem("ccltce-sfx") === "off") return;
    try {
      var ctx = getAudioCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(function () {});
      }
      var t = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || "square";
      osc.frequency.setValueAtTime(freq, t);
      if (rampFreq && rampFreq !== freq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, rampFreq), t + duration);
      }
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol || 0.045, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.015);
    } catch (e) {}
  }

  var sfx = {
    blockPop: function () {
      playTone(280, "triangle", 0.045, 0.065, 540);
    },
    typeTick: function () {
      playTone(1350 + Math.random() * 250, "triangle", 0.02, 0.035, 900);
    },
    buttonClick: function () {
      playTone(750, "square", 0.035, 0.05, 220);
    },
    xpOrb: function () {
      playTone(1100 + Math.random() * 300, "sine", 0.06, 0.04, 1400);
    },
    levelUp: function () {
      var notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach(function (freq, i) {
        timeouts.push(setTimeout(function () {
          playTone(freq, "triangle", 0.16, 0.06);
          playTone(freq * 0.5, "sine", 0.16, 0.04);
        }, i * 65));
      });
    }
  };

  // =========================================================================
  // Minecraft Collaborators
  // =========================================================================
  var CURSORS = [
    {
      id: "steve",
      name: "Sachin Yadav",
      role: "DEV",
      color: "#55ff55",
      tool: "assets/cursors/iron-sword.svg"
    },
    {
      id: "alex",
      name: "Rashi Kasotiya",
      role: "DESIGN",
      color: "#55ffff",
      tool: "assets/cursors/gold-pickaxe.svg"
    },
    {
      id: "miner",
      name: "Adarsh Mishra",
      role: "OPS",
      color: "#ffaa00",
      tool: "assets/cursors/netherite-axe.svg"
    },
    {
      id: "hacker",
      name: "Ayush Vishwakarma",
      role: "SECURITY",
      color: "#ff5555",
      tool: "assets/cursors/redstone-torch.svg"
    },
    {
      id: "builder",
      name: "Aakash Gupta",
      role: "CORE",
      color: "#ff55ff",
      tool: "assets/cursors/shield.svg"
    }
  ];

  function shouldPlay() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return false;
    }
    var search = window.location.search;
    if (search.indexOf("intro=0") !== -1 || search.indexOf("skipintro=1") !== -1) {
      return false;
    }
    return true;
  }

  function createMarkup() {
    var overlay = document.createElement("div");
    overlay.id = "swarm-overlay";
    overlay.setAttribute("aria-hidden", "true");

    overlay.innerHTML =
      '<div class="swarm-hud-corner swarm-hud-tl"></div>' +
      '<div class="swarm-hud-corner swarm-hud-tr"></div>' +
      '<div class="swarm-hud-corner swarm-hud-bl"></div>' +
      '<div class="swarm-hud-corner swarm-hud-br"></div>' +
      '<div class="swarm-status-bar">' +
        '<span class="swarm-status-badge">' +
          '<span class="swarm-status-dot"></span>' +
          '<span id="swarm-status-txt">SEARCHING OVERWORLD CHUNKS...</span>' +
        '</span>' +
        '<span id="swarm-coord" class="swarm-coords">LOC: X:128 Y:64 Z:256 • REALM ASSEMBLE</span>' +
      '</div>' +
      '<button type="button" class="swarm-skip-btn" id="swarm-skip-btn" title="Skip Intro (Escape)">' +
        'SKIP <span class="swarm-skip-key">[ESC]</span> ✕' +
      '</button>' +
      '<canvas id="swarm-canvas"></canvas>' +
      '<div class="swarm-xp-bar-wrap">' +
        '<div class="swarm-xp-level" id="swarm-xp-lvl">&lt; LEVEL 1 &gt;</div>' +
        '<div class="swarm-xp-bar-track">' +
          '<div class="swarm-xp-bar-fill" id="swarm-xp-fill"></div>' +
        '</div>' +
      '</div>';

    return overlay;
  }

  function spawnRipple(x, y, color) {
    if (!overlayEl) return;
    var rip = document.createElement("div");
    rip.className = "swarm-click-ripple";
    rip.style.left = x + "px";
    rip.style.top = y + "px";
    rip.style.borderColor = color || "#55ff55";
    overlayEl.appendChild(rip);
    setTimeout(function () {
      if (rip.parentNode) rip.parentNode.removeChild(rip);
    }, 450);
  }

  function setXP(percent, level) {
    var fill = document.getElementById("swarm-xp-fill");
    var lvl = document.getElementById("swarm-xp-lvl");
    if (fill) fill.style.width = Math.min(100, Math.max(0, percent)) + "%";
    if (lvl && level !== undefined) {
      lvl.textContent = "< LEVEL " + level + " >";
      if (level >= 42) {
        lvl.classList.add("leveled-up");
      }
    }
  }

  function createTargetBox(id, rect, label, dimText) {
    var box = document.createElement("div");
    box.id = id;
    box.className = "swarm-target-box";
    box.style.left = Math.round(rect.left) + "px";
    box.style.top = Math.round(rect.top) + "px";
    box.style.width = Math.round(rect.width) + "px";
    box.style.height = Math.round(rect.height) + "px";
    box.innerHTML =
      '<span class="swarm-target-tag">' + label + '</span>' +
      '<span class="swarm-target-dim">' + (dimText || (Math.round(rect.width) + " × " + Math.round(rect.height))) + '</span>';
    return box;
  }

  function start() {
    if (isPlaying) return;
    isPlaying = true;
    if (window.CCLTCE_SWARM) window.CCLTCE_SWARM._active = true;

    // Apply building state to body so real DOM elements hide until assembled
    document.body.classList.add("swarm-building");

    var existing = document.getElementById("swarm-overlay");
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    overlayEl = createMarkup();
    document.body.appendChild(overlayEl);

    var canvas = document.getElementById("swarm-canvas");
    var ctx = canvas ? canvas.getContext("2d") : null;
    var W = document.documentElement.clientWidth || window.innerWidth;
    var H = window.innerHeight;
    var dpr = window.devicePixelRatio || 1;

    if (canvas) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      if (ctx) ctx.scale(dpr, dpr);
    }

    var isMobile = W <= 768;
    var activeCursors = isMobile ? CURSORS.slice(0, 3) : CURSORS;

    // Locate REAL page elements
    var realNav = document.querySelector(".nav-wrap");
    var realLogo = document.querySelector(".hero-logo");
    var realBadge = document.querySelector(".hero-badge");
    var realTitle = document.querySelector(".hero-title");
    var realSub = document.querySelector(".hero-sub");
    var realCta = document.querySelector(".hero-cta");

    var rNav = realNav ? realNav.getBoundingClientRect() : { left: 24, top: 20, width: W - 48, height: 60 };
    var rLogo = realLogo ? realLogo.getBoundingClientRect() : { left: W / 2 - 70, top: 60, width: 140, height: 140 };
    var rBadge = realBadge ? realBadge.getBoundingClientRect() : { left: W / 2 - 150, top: rLogo.top + rLogo.height + 10, width: 300, height: 26 };
    var rTitle = realTitle ? realTitle.getBoundingClientRect() : { left: W / 2 - 240, top: rBadge.top + 34, width: 480, height: 80 };
    var rSub = realSub ? realSub.getBoundingClientRect() : { left: W / 2 - 200, top: rTitle.top + rTitle.height + 10, width: 400, height: 60 };
    var rCta = realCta ? realCta.getBoundingClientRect() : { left: W / 2 - 180, top: rSub.top + rSub.height + 16, width: 360, height: 48 };

    // Create precision wireframe bounding boxes placed directly over the real elements
    var boxNav = createTargetBox("tbox-nav", rNav, "<header.nav-wrap>");
    var boxLogo = createTargetBox("tbox-logo", rLogo, "<img.hero-logo>");
    var boxTitle = createTargetBox("tbox-title", rTitle, "<h1.hero-title>");
    var boxCta = createTargetBox("tbox-cta", rCta, "<div.hero-cta>");

    overlayEl.appendChild(boxNav);
    overlayEl.appendChild(boxLogo);
    overlayEl.appendChild(boxTitle);
    overlayEl.appendChild(boxCta);

    // Build cursor nodes with authentic Minecraft tool pointers
    var cursorNodes = [];
    activeCursors.forEach(function (c, idx) {
      var node = document.createElement("div");
      node.className = "swarm-cursor-item";
      node.id = "cur-" + c.id;
      node.innerHTML =
        '<img class="swarm-pointer-tool" src="' + c.tool + '" alt="" width="32" height="32" />' +
        '<div class="swarm-cursor-badge" style="color: ' + c.color + ';">' +
          '<span class="swarm-cursor-dot" style="background: ' + c.color + '; box-shadow: 0 0 6px ' + c.color + ';"></span>' +
          '<span>' + c.name + ' [' + c.role + ']</span>' +
        '</div>';
      overlayEl.appendChild(node);

      var startX = (idx % 2 === 0) ? -80 : W + 80;
      var startY = (idx * (H / activeCursors.length)) + 50;

      cursorNodes.push({
        def: c,
        el: node,
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        tx: W / 2,
        ty: H / 2,
        tilt: 0,
        clicking: false
      });
    });

    var statusTxt = document.getElementById("swarm-status-txt");

    // XP Particles System
    var particles = [];
    function spawnParticles(originX, originY, count) {
      var colors = ["#55ff55", "#facc15", "#22c55e", "#55ffff", "#ffffff", "#ffd76a"];
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 3.5 + Math.random() * 14;
        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          size: 3 + Math.floor(Math.random() * 6),
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: 0.015 + Math.random() * 0.02
        });
      }
    }

    // =========================================================================
    // Ultra-Smooth Spring Physics Loop (Natural Mouse Dynamics)
    // =========================================================================
    var startTime = performance.now();
    function renderLoop(now) {
      if (!isPlaying) return;
      var elapsed = now - startTime;

      var spring = 0.052;
      var damping = 0.76;

      for (var i = 0; i < cursorNodes.length; i++) {
        var c = cursorNodes[i];
        var dx = c.tx - c.x;
        var dy = c.ty - c.y;

        c.vx = (c.vx + dx * spring) * damping;
        c.vy = (c.vy + dy * spring) * damping;

        c.x += c.vx;
        c.y += c.vy;

        var targetTilt = Math.max(-14, Math.min(14, c.vx * 0.85));
        c.tilt += (targetTilt - c.tilt) * 0.18;

        c.el.style.transform = "translate3d(" + Math.round(c.x) + "px, " + Math.round(c.y) + "px, 0) rotate(" + c.tilt.toFixed(1) + "deg)";
      }

      // Draw dynamic connecting guide lines and XP particles on Canvas
      if (ctx) {
        ctx.clearRect(0, 0, W, H);

        if (elapsed > 350 && elapsed < 3700) {
          ctx.beginPath();
          ctx.strokeStyle = "rgba(85, 255, 85, 0.18)";
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1;
          for (var j = 0; j < cursorNodes.length; j++) {
            var curA = cursorNodes[j];
            var curB = cursorNodes[(j + 1) % cursorNodes.length];
            ctx.moveTo(curA.x + 12, curA.y + 12);
            ctx.lineTo(curB.x + 12, curB.y + 12);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Render particles
        for (var p = particles.length - 1; p >= 0; p--) {
          var pt = particles[p];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.22; // Minecraft gravity
          pt.vx *= 0.97;
          pt.vy *= 0.97;
          pt.alpha -= pt.decay;

          if (pt.alpha <= 0) {
            particles.splice(p, 1);
            continue;
          }

          ctx.fillStyle = pt.color;
          ctx.globalAlpha = Math.max(0, pt.alpha);
          ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
        }
        ctx.globalAlpha = 1;
      }

      animFrameId = requestAnimationFrame(renderLoop);
    }
    animFrameId = requestAnimationFrame(renderLoop);

    function triggerClick(cursor, soundFn) {
      if (!cursor) return;
      cursor.clicking = true;
      cursor.el.classList.add("clicking");
      spawnRipple(cursor.x + 12, cursor.y + 12, cursor.def.color);
      if (soundFn) soundFn();
      setTimeout(function () {
        cursor.clicking = false;
        cursor.el.classList.remove("clicking");
      }, 140);
    }

    // =========================================================================
    // Choreographed Timeline (Building the REAL DOM Elements ~4.4s)
    // =========================================================================

    // Phase 1 (250ms): Cursors glide onto screen
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (statusTxt) statusTxt.textContent = "SYNCHRONIZING REPOSITORY MESH";
      sfx.blockPop();
      setXP(15, 6);

      // Steve targets real navigation bar
      if (cursorNodes[0]) {
        cursorNodes[0].tx = rNav.left + 24;
        cursorNodes[0].ty = rNav.top + rNav.height / 2;
      }
      // Alex heads towards real emblem
      if (cursorNodes[1]) {
        cursorNodes[1].tx = rLogo.left + rLogo.width / 2;
        cursorNodes[1].ty = rLogo.top - 40;
      }
      // Miner frames hero title
      if (cursorNodes[2]) {
        cursorNodes[2].tx = rTitle.left + 40;
        cursorNodes[2].ty = rTitle.top + rTitle.height / 2;
      }
      if (cursorNodes[3]) {
        cursorNodes[3].tx = rCta.left + 40;
        cursorNodes[3].ty = rCta.top + rCta.height / 2;
      }
      if (cursorNodes[4]) {
        cursorNodes[4].tx = rCta.left + rCta.width - 40;
        cursorNodes[4].ty = rCta.top + rCta.height / 2;
      }
    }, 250));

    // Phase 2 (650ms): Steve builds real .nav-wrap
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (statusTxt) statusTxt.textContent = "ASSEMBLING <NAV.NAV-WRAP>";
      if (boxNav) boxNav.classList.add("active");
      sfx.blockPop();
      setXP(30, 14);

      if (cursorNodes[0]) {
        cursorNodes[0].tx = rNav.left + rNav.width - 40;
        cursorNodes[0].ty = rNav.top + rNav.height / 2;
      }
    }, 650));

    // Phase 3 (1200ms): Real Nav reveals; Alex mounts real .hero-logo
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (boxNav) boxNav.classList.add("complete");
      if (realNav) realNav.classList.add("swarm-built");
      triggerClick(cursorNodes[0], sfx.buttonClick);

      if (statusTxt) statusTxt.textContent = "MOUNTING <IMG.HERO-LOGO>";
      if (boxLogo) boxLogo.classList.add("active");
      sfx.xpOrb();
      setXP(48, 22);

      if (cursorNodes[1]) {
        cursorNodes[1].tx = rLogo.left + rLogo.width / 2;
        cursorNodes[1].ty = rLogo.top + rLogo.height / 2;
      }
    }, 1200));

    // Phase 4 (1750ms): Real Logo reveals; Steve & Hacker construct Title & Motto
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (boxLogo) boxLogo.classList.add("complete");
      if (realLogo) realLogo.classList.add("swarm-built");
      if (realBadge) realBadge.classList.add("swarm-built");
      triggerClick(cursorNodes[1], sfx.blockPop);

      if (statusTxt) statusTxt.textContent = "ENGRAVING <H1.HERO-TITLE>";
      if (boxTitle) boxTitle.classList.add("active");
      setXP(68, 30);

      if (cursorNodes[3]) {
        cursorNodes[3].tx = rTitle.left + 40;
        cursorNodes[3].ty = rTitle.top + rTitle.height / 2;
      }
      if (cursorNodes[0]) {
        cursorNodes[0].tx = rTitle.left + rTitle.width - 60;
        cursorNodes[0].ty = rTitle.top + rTitle.height / 2;
      }
    }, 1750));

    // Phase 5 (2300ms): Title reveals; Miner & Builder assemble Action Buttons
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (boxTitle) boxTitle.classList.add("complete");
      if (realTitle) realTitle.classList.add("swarm-built");
      if (realSub) realSub.classList.add("swarm-built");
      sfx.typeTick();
      triggerClick(cursorNodes[3], sfx.blockPop);

      if (statusTxt) statusTxt.textContent = "BINDING <DIV.HERO-CTA>";
      if (boxCta) boxCta.classList.add("active");
      setXP(85, 37);

      if (cursorNodes[2]) {
        cursorNodes[2].tx = rCta.left + 80;
        cursorNodes[2].ty = rCta.top + rCta.height / 2;
      }
      if (cursorNodes[4]) {
        cursorNodes[4].tx = rCta.left + rCta.width - 80;
        cursorNodes[4].ty = rCta.top + rCta.height / 2;
      }
    }, 2300));

    // Phase 6 (2800ms): Real Buttons snap in; Cursors click them
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (boxCta) boxCta.classList.add("complete");
      if (realCta) realCta.classList.add("swarm-built");
      triggerClick(cursorNodes[2], sfx.buttonClick);
      triggerClick(cursorNodes[4], sfx.buttonClick);
      setXP(95, 41);
    }, 2800));

    // Phase 7 (3650ms): Swarm orbits and converges on real .hero-logo
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (statusTxt) statusTxt.textContent = "REALM ONLINE // ALL SYSTEMS NOMINAL";
      setXP(100, 42);

      var cx = rLogo.left + rLogo.width / 2;
      var cy = rLogo.top + rLogo.height / 2;

      for (var k = 0; k < cursorNodes.length; k++) {
        var angle = (k / cursorNodes.length) * Math.PI * 2;
        cursorNodes[k].tx = cx + Math.cos(angle) * 80;
        cursorNodes[k].ty = cy + Math.sin(angle) * 80;
      }
    }, 3150));

    // Phase 8 (3950ms): Climax Fanfare! Radiant XP Orbs burst from real logo
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      var cx = rLogo.left + rLogo.width / 2;
      var cy = rLogo.top + rLogo.height / 2;
      spawnParticles(cx, cy, 85);
      sfx.levelUp();

      for (var m = 0; m < cursorNodes.length; m++) {
        var angle = (m / cursorNodes.length) * Math.PI * 2 + 0.3;
        cursorNodes[m].tx = cx + Math.cos(angle) * (W * 0.85);
        cursorNodes[m].ty = cy + Math.sin(angle) * (H * 0.85);
      }
    }, 3950));

    // Phase 9 (4400ms): Dissolve cleanly into the live interactive website
    timeouts.push(setTimeout(function () {
      finish(false);
    }, DURATION));

    // Skip Handlers
    var skipBtn = document.getElementById("swarm-skip-btn");
    if (skipBtn) {
      function onSkip(e) {
        e.stopPropagation();
        finish(true);
      }
      skipBtn.addEventListener("click", onSkip);
      skipBtn.addEventListener("pointerdown", onSkip);
    }

    function onOverlayClick() {
      finish(true);
    }
    overlayEl.addEventListener("click", onOverlayClick);

    function onKey(e) {
      if (e.key === "Escape" || e.key === " " || e.code === "Space") {
        finish(true);
      }
    }
    window.addEventListener("keydown", onKey);

    overlayEl._cleanup = function () {
      overlayEl.removeEventListener("click", onOverlayClick);
      window.removeEventListener("keydown", onKey);
    };
  }

  function finish(isSkipped) {
    if (!isPlaying) return;
    isPlaying = false;
    if (window.CCLTCE_SWARM) window.CCLTCE_SWARM._active = false;

    // Immediately remove building state so all real DOM elements are 100% visible and interactive
    document.body.classList.remove("swarm-building");
    var built = document.querySelectorAll(".swarm-built");
    built.forEach(function (el) { el.classList.remove("swarm-built"); });

    timeouts.forEach(function (tid) { clearTimeout(tid); });
    timeouts = [];

    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    if (overlayEl) {
      if (overlayEl._cleanup) overlayEl._cleanup();
      overlayEl.classList.add("swarm-done");
      setTimeout(function () {
        if (overlayEl && overlayEl.parentNode) {
          overlayEl.parentNode.removeChild(overlayEl);
        }
        overlayEl = null;
      }, 450);
    }
  }

  function replay() {
    finish(true);
    setTimeout(function () {
      start();
    }, 60);
  }

  // Global key listener: Shift+S to replay intro
  window.addEventListener("keydown", function (e) {
    if (e.shiftKey && (e.key === "S" || e.key === "s")) {
      var tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea") return;
      e.preventDefault();
      replay();
    }
  });

  window.CCLTCE_SWARM = {
    _active: false,
    start: start,
    finish: finish,
    replay: replay
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      if (shouldPlay()) start();
    });
  } else {
    if (shouldPlay()) start();
  }
})();
