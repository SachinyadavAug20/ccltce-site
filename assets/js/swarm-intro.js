/**
 * CCLTCE — Swarm Rebuild Opening Experience
 * Inspired by Joel Califa's Swarm & Dhvanil Patel's swarm-cursors.
 * Zero-dependency, ultra-fast collaborative pixel builder intro.
 */
(function () {
  "use strict";

  // Prevent multiple initializations
  if (window.CCLTCE_SWARM) return;

  var DURATION = 2200; // Snappy ~2.2s total duration
  var STORAGE_KEY = "ccltce_swarm_seen";
  var isPlaying = false;
  var animFrameId = null;
  var overlayEl = null;
  var audioCtx = null;
  var timeouts = [];

  // Audio synthesis helper (zero-dependency Web Audio API)
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
      if (rampFreq) {
        osc.frequency.exponentialRampToValueAtTime(rampFreq, t + duration);
      }
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol || 0.04, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.01);
    } catch (e) {}
  }

  var sfx = {
    tick: function () { playTone(1200, "square", 0.02, 0.025, 900); },
    type: function () { playTone(1400 + Math.random() * 200, "triangle", 0.025, 0.03, 1000); },
    click: function () { playTone(800, "square", 0.04, 0.05, 300); },
    chord: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        setTimeout(function () { playTone(f, "triangle", 0.12, 0.035); }, i * 45);
      });
    },
    burst: function () {
      [600, 900, 1200, 1600].forEach(function (f, i) {
        setTimeout(function () { playTone(f, "sine", 0.18, 0.04, f * 1.5); }, i * 30);
      });
    }
  };

  // Cursor definitions (Minecraft tools & identities)
  var CURSORS = [
    {
      id: "steve",
      name: "Steve",
      role: "DEV",
      color: "#22c55e",
      path: "M4 4h8v4h-8zM4 8h4v4h-4zM12 8h4v4h-4zM8 12h4v4h-4zM16 12h4v4h-4zM20 16h4v4h-4zM24 20h4v4h-4z"
    },
    {
      id: "alex",
      name: "Alex",
      role: "DESIGN",
      color: "#38bdf8",
      path: "M6 2h12v4H6zM4 6h4v4H4zM16 6h4v4h-4zM2 10h4v4H2zM18 10h4v4h-4zM10 10h4v12h-4z"
    },
    {
      id: "miner",
      name: "Miner",
      role: "OPS",
      color: "#f59e0b",
      path: "M8 4h8v4H8zM6 8h12v4H6zM4 12h16v4H4zM8 16h8v8H8z"
    },
    {
      id: "hacker",
      name: "Hacker",
      role: "SECURITY",
      color: "#ef4444",
      path: "M10 2h4v6h-4zM8 8h8v4H8zM6 12h12v4H6zM10 16h4v8h-4z"
    },
    {
      id: "builder",
      name: "Builder",
      role: "CORE",
      color: "#c084fc",
      path: "M4 4h16v4H4zM4 8h4v12H4zM16 8h4v12h-4zM8 16h8v4H8z"
    }
  ];

  function shouldPlay() {
    // Accessibility check: Skip immediately on prefers-reduced-motion
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return false;
    }
    // URL override (?intro=1 or ?replay=1 forces play)
    var search = window.location.search;
    if (search.indexOf("intro=1") !== -1 || search.indexOf("replay=1") !== -1) {
      return true;
    }
    // Only run on homepage / first session entrance
    if (sessionStorage.getItem(STORAGE_KEY)) {
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
        '<span class="swarm-status-badge"><span class="swarm-status-dot"></span><span id="swarm-status-txt">BLUEPRINT COMPILING</span></span>' +
        '<span id="swarm-coord" class="swarm-coords">LOC: X:128 Y:64 Z:256</span>' +
      '</div>' +
      '<button type="button" class="swarm-skip-btn" id="swarm-skip-btn" title="Skip Intro">' +
        'SKIP <span class="swarm-skip-key">[ESC]</span> ✕' +
      '</button>' +
      '<canvas id="swarm-canvas"></canvas>' +
      '<div id="swarm-box-nav" class="swarm-box">' +
        '<span class="swarm-box-tag">NAV_HEADER</span>' +
        '<span class="swarm-box-dim" id="swarm-nav-dim">100% × 56px</span>' +
      '</div>' +
      '<div id="swarm-box-hero" class="swarm-box">' +
        '<span class="swarm-box-tag">HERO_VIEWPORT</span>' +
        '<span class="swarm-box-dim" id="swarm-hero-dim">960 × 440</span>' +
        '<div class="swarm-hero-content">' +
          '<div class="swarm-logo-badge" id="swarm-logo">' +
            '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5L4.5 9.75 3 10.5l9 4.5 9-4.5-1.5-.75L12 13.5zm0 4.5L4.5 14.25 3 15l9 4.5 9-4.5-1.5-.75L12 18z"/></svg>' +
          '</div>' +
          '<div class="swarm-term-title" id="swarm-title"></div>' +
          '<div class="swarm-term-sub" id="swarm-sub"></div>' +
          '<div class="swarm-buttons-preview" id="swarm-btns">' +
            '<span class="swarm-btn-frame primary">BROWSE EVENTS</span>' +
            '<span class="swarm-btn-frame">TAKE CHALLENGE</span>' +
          '</div>' +
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
    rip.style.borderColor = color;
    overlayEl.appendChild(rip);
    setTimeout(function () {
      if (rip.parentNode) rip.parentNode.removeChild(rip);
    }, 450);
  }

  function start() {
    if (isPlaying) return;
    isPlaying = true;

    // Clear previous elements if any
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

    // Build cursor DOM elements
    var cursorNodes = [];
    activeCursors.forEach(function (c) {
      var node = document.createElement("div");
      node.className = "swarm-cursor-item";
      node.id = "cur-" + c.id;
      node.innerHTML =
        '<svg class="swarm-pointer-svg" viewBox="0 0 24 24" shape-rendering="crispEdges">' +
          '<polygon points="0,0 0,18 5,14 8,22 11,21 8,13 14,13" fill="' + c.color + '" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>' +
        '</svg>' +
        '<div class="swarm-cursor-badge" style="background: ' + c.color + '; border-color: #000;">' +
          '<span class="swarm-cursor-dot"></span>' +
          '<span>' + c.name + '</span>' +
        '</div>';
      overlayEl.appendChild(node);
      cursorNodes.push({
        def: c,
        el: node,
        x: W / 2 + (Math.random() - 0.5) * W * 0.8,
        y: H + 80 + Math.random() * 100,
        tx: W / 2,
        ty: H / 2
      });
    });

    // Boxes & elements
    var boxNav = document.getElementById("swarm-box-nav");
    var boxHero = document.getElementById("swarm-box-hero");
    var navDim = document.getElementById("swarm-nav-dim");
    var heroDim = document.getElementById("swarm-hero-dim");
    var statusTxt = document.getElementById("swarm-status-txt");
    var coordTxt = document.getElementById("swarm-coord");
    var logoBadge = document.getElementById("swarm-logo");
    var termTitle = document.getElementById("swarm-title");
    var termSub = document.getElementById("swarm-sub");
    var buttonsPreview = document.getElementById("swarm-btns");

    // Position bounding boxes based on screen size
    var navW = Math.max(260, Math.min(W - (isMobile ? 24 : 48), 1200));
    var navH = isMobile ? 44 : 56;
    var navX = Math.max(isMobile ? 12 : 24, (W - navW) / 2);
    var navY = isMobile ? 46 : 16;
    if (boxNav) {
      boxNav.style.left = navX + "px";
      boxNav.style.top = navY + "px";
      boxNav.style.width = navW + "px";
      boxNav.style.height = navH + "px";
      if (navDim) navDim.textContent = Math.round(navW) + " × " + navH;
    }

    var heroW = Math.max(280, Math.min(W - (isMobile ? 24 : 48), isMobile ? (W - 24) : 920));
    var heroH = Math.min(H - (isMobile ? 160 : 180), isMobile ? 380 : 420);
    var heroX = Math.max(isMobile ? 12 : 24, (W - heroW) / 2);
    var heroY = isMobile ? 104 : ((H - heroH) / 2 + 20);
    if (boxHero) {
      boxHero.style.left = heroX + "px";
      boxHero.style.top = heroY + "px";
      boxHero.style.width = heroW + "px";
      boxHero.style.height = heroH + "px";
      if (heroDim) heroDim.textContent = Math.round(heroW) + " × " + Math.round(heroH);
    }

    // Particle system for the XP burst climax
    var particles = [];
    function spawnParticles(originX, originY, count) {
      var colors = ["#22c55e", "#facc15", "#4ade80", "#ffffff", "#38bdf8"];
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 4 + Math.random() * 12;
        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.floor(Math.random() * 5),
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: 0.02 + Math.random() * 0.03
        });
      }
    }

    // Animation Loop
    var startTime = performance.now();
    function renderLoop(now) {
      if (!isPlaying) return;
      var elapsed = now - startTime;

      // Update cursor positions with smooth lerping
      for (var i = 0; i < cursorNodes.length; i++) {
        var c = cursorNodes[i];
        c.x += (c.tx - c.x) * 0.18;
        c.y += (c.ty - c.y) * 0.18;
        c.el.style.transform = "translate3d(" + Math.round(c.x) + "px, " + Math.round(c.y) + "px, 0)";
      }

      // Draw canvas guides and particles
      if (ctx) {
        ctx.clearRect(0, 0, W, H);

        // Draw dynamic connecting guide lines between cursors during build phase
        if (elapsed > 300 && elapsed < 1650) {
          ctx.beginPath();
          ctx.strokeStyle = "rgba(34, 197, 94, 0.15)";
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1;
          for (var j = 0; j < cursorNodes.length; j++) {
            var curA = cursorNodes[j];
            var curB = cursorNodes[(j + 1) % cursorNodes.length];
            ctx.moveTo(curA.x, curA.y);
            ctx.lineTo(curB.x, curB.y);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Update & render XP particles
        for (var p = particles.length - 1; p >= 0; p--) {
          var pt = particles[p];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vx *= 0.96;
          pt.vy *= 0.96;
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

    // =========================================================================
    // Choreographed Timeline
    // =========================================================================

    // Phase 1 (100ms - 400ms): Cursors converge to wireframe anchors
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (statusTxt) statusTxt.textContent = "SYNCHRONIZING REPOSITORY";
      sfx.tick();

      // Steve draws Nav
      if (cursorNodes[0]) {
        cursorNodes[0].tx = navX + 20;
        cursorNodes[0].ty = navY + navH / 2;
      }
      // Alex and Miner frame Hero
      if (cursorNodes[1]) {
        cursorNodes[1].tx = heroX + 40;
        cursorNodes[1].ty = heroY + 40;
      }
      if (cursorNodes[2]) {
        cursorNodes[2].tx = heroX + heroW - 40;
        cursorNodes[2].ty = heroY + heroH - 40;
      }
      if (cursorNodes[3]) {
        cursorNodes[3].tx = heroX + heroW / 2;
        cursorNodes[3].ty = heroY + 120;
      }
    }, 150));

    // Phase 2 (400ms - 800ms): Draw Wireframes
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (statusTxt) statusTxt.textContent = "BUILDING UI BLUEPRINT";
      if (boxNav) boxNav.classList.add("active");
      if (boxHero) boxHero.classList.add("active");
      sfx.tick();

      if (cursorNodes[0]) {
        cursorNodes[0].tx = navX + navW - 60;
        cursorNodes[0].ty = navY + navH / 2;
        spawnRipple(cursorNodes[0].tx, cursorNodes[0].ty, cursorNodes[0].def.color);
      }
      if (cursorNodes[1]) {
        cursorNodes[1].tx = heroX + heroW / 2;
        cursorNodes[1].ty = heroY + 60;
      }
    }, 450));

    // Phase 3 (750ms): Solidify wireframe & reveal logo
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (boxNav) boxNav.classList.add("complete");
      if (boxHero) boxHero.classList.add("complete");
      if (logoBadge) logoBadge.classList.add("visible");
      if (statusTxt) statusTxt.textContent = "MOUNTING CORE EMBLEM";
      sfx.click();
      spawnRipple(heroX + heroW / 2, heroY + 60, "#22c55e");
    }, 750));

    // Phase 4 (900ms - 1300ms): Fast Typewriter effect
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (statusTxt) statusTxt.textContent = "COMPILING ASSETS";
      var fullTitle = "CODING CLUB";
      var fullSub = "BUILD • SHIP • BREAK";
      var curIdx = 0;

      function typeNext() {
        if (!isPlaying) return;
        if (curIdx < fullTitle.length) {
          if (termTitle) {
            termTitle.innerHTML = fullTitle.slice(0, curIdx + 1) + '<span class="swarm-cursor-carat"></span>';
          }
          sfx.type();
          curIdx++;
          timeouts.push(setTimeout(typeNext, 40));
        } else {
          if (termSub) {
            termSub.innerHTML = fullSub;
            sfx.tick();
          }
          if (termTitle) {
            termTitle.textContent = fullTitle;
          }
        }
      }
      typeNext();

      if (cursorNodes[3]) {
        cursorNodes[3].tx = heroX + heroW / 2 + 100;
        cursorNodes[3].ty = heroY + heroH / 2;
      }
    }, 900));

    // Phase 5 (1350ms): Place Action Buttons
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (buttonsPreview) buttonsPreview.classList.add("visible");
      if (statusTxt) statusTxt.textContent = "READY // INITIATING RUNTIME";
      sfx.click();
      if (cursorNodes[1]) {
        cursorNodes[1].tx = heroX + heroW / 2 - 80;
        cursorNodes[1].ty = heroY + heroH - 50;
        spawnRipple(cursorNodes[1].tx, cursorNodes[1].ty, cursorNodes[1].def.color);
      }
      if (cursorNodes[2]) {
        cursorNodes[2].tx = heroX + heroW / 2 + 80;
        cursorNodes[2].ty = heroY + heroH - 50;
        spawnRipple(cursorNodes[2].tx, cursorNodes[2].ty, cursorNodes[2].def.color);
      }
    }, 1350));

    // Phase 6 (1650ms): Swarm convergence & chime
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (statusTxt) statusTxt.textContent = "WORLD RENDER: READY";
      sfx.chord();

      // Cursors converge to center
      var cx = heroX + heroW / 2;
      var cy = heroY + heroH / 2;
      for (var k = 0; k < cursorNodes.length; k++) {
        var angle = (k / cursorNodes.length) * Math.PI * 2;
        cursorNodes[k].tx = cx + Math.cos(angle) * 70;
        cursorNodes[k].ty = cy + Math.sin(angle) * 70;
      }
    }, 1650));

    // Phase 7 (1850ms): Climax explosion & XP burst
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      var cx = heroX + heroW / 2;
      var cy = heroY + heroH / 2;
      spawnParticles(cx, cy, 55);
      sfx.burst();

      // Cursors scatter outward
      for (var m = 0; m < cursorNodes.length; m++) {
        var angle = (m / cursorNodes.length) * Math.PI * 2 + 0.3;
        cursorNodes[m].tx = cx + Math.cos(angle) * (W * 0.7);
        cursorNodes[m].ty = cy + Math.sin(angle) * (H * 0.7);
      }
    }, 1850));

    // Phase 8 (2100ms): Seamless completion & fade out
    timeouts.push(setTimeout(function () {
      finish(false);
    }, DURATION));

    // Listeners for skip
    var skipBtn = document.getElementById("swarm-skip-btn");
    if (skipBtn) {
      skipBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        finish(true);
      });
    }

    function onOverlayClick(e) {
      // Any click on overlay skips
      finish(true);
    }
    overlayEl.addEventListener("click", onOverlayClick);

    function onKey(e) {
      if (e.key === "Escape" || e.key === " " || e.code === "Space") {
        finish(true);
      }
    }
    window.addEventListener("keydown", onKey);

    // Save cleanup ref
    overlayEl._cleanup = function () {
      overlayEl.removeEventListener("click", onOverlayClick);
      window.removeEventListener("keydown", onKey);
    };
  }

  function finish(isSkipped) {
    if (!isPlaying) return;
    isPlaying = false;

    // Clear all scheduled timeouts
    timeouts.forEach(function (tid) { clearTimeout(tid); });
    timeouts = [];

    // Cancel animation frame
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    // Mark as seen in session
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {}

    if (overlayEl) {
      if (overlayEl._cleanup) overlayEl._cleanup();
      overlayEl.classList.add("swarm-done");
      setTimeout(function () {
        if (overlayEl && overlayEl.parentNode) {
          overlayEl.parentNode.removeChild(overlayEl);
        }
        overlayEl = null;
      }, 400);
    }
  }

  // Replay method
  function replay() {
    finish(true);
    setTimeout(function () {
      start();
    }, 50);
  }

  // Global key listener for Shift+S (Replay Intro)
  window.addEventListener("keydown", function (e) {
    if (e.shiftKey && (e.key === "S" || e.key === "s")) {
      // Don't trigger if user is typing in an input or textarea
      var tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea") return;
      e.preventDefault();
      replay();
    }
  });

  // Expose API
  window.CCLTCE_SWARM = {
    start: start,
    finish: finish,
    replay: replay
  };

  // Auto-run if conditions match
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      if (shouldPlay()) start();
    });
  } else {
    if (shouldPlay()) start();
  }
})();
