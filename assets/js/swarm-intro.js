/**
 * CCLTCE — Swarm Rebuild Opening Experience (Minecraft Edition)
 * Inspired by Joel Califa's Swarm & Dhvanil Patel's swarm-cursors.
 * Collaborative pixel builder intro with authentic Minecraft sound design,
 * XP progression, tools, and visual pacing.
 *
 * Runs on every refresh • Cinema pacing (~3.8s) • Instant skip (Esc/click).
 */
(function () {
  "use strict";

  // Prevent multiple simultaneous initializations
  if (window.CCLTCE_SWARM && window.CCLTCE_SWARM._active) return;

  var DURATION = 3800; // ~3.8s cinema pacing for full appreciation
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
      gain.gain.exponentialRampToValueAtTime(vol || 0.04, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.015);
    } catch (e) {}
  }

  var sfx = {
    // Minecraft block placement pop
    blockPop: function () {
      playTone(280, "triangle", 0.04, 0.06, 520);
    },
    // Mechanical typewriter tick
    typeTick: function () {
      playTone(1350 + Math.random() * 250, "triangle", 0.02, 0.03, 900);
    },
    // Stone button click
    buttonClick: function () {
      playTone(750, "square", 0.035, 0.05, 220);
    },
    // XP orb twinkle
    xpOrb: function () {
      playTone(1100 + Math.random() * 300, "sine", 0.06, 0.035, 1400);
    },
    // Minecraft level-up chime fanfare
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
  // Minecraft Collaborators (Steve, Alex, Miner, Hacker, Builder)
  // =========================================================================
  var CURSORS = [
    {
      id: "steve",
      name: "Steve",
      role: "DEV",
      color: "#55ff55",
      tool: "assets/cursors/iron-sword.svg"
    },
    {
      id: "alex",
      name: "Alex",
      role: "DESIGN",
      color: "#55ffff",
      tool: "assets/cursors/gold-pickaxe.svg"
    },
    {
      id: "miner",
      name: "Miner",
      role: "OPS",
      color: "#ffaa00",
      tool: "assets/cursors/netherite-axe.svg"
    },
    {
      id: "hacker",
      name: "Hacker",
      role: "SECURITY",
      color: "#ff5555",
      tool: "assets/cursors/redstone-torch.svg"
    },
    {
      id: "builder",
      name: "Builder",
      role: "CORE",
      color: "#ff55ff",
      tool: "assets/cursors/shield.svg"
    }
  ];

  function shouldPlay() {
    // Accessibility check: Skip immediately if prefers-reduced-motion is active
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return false;
    }
    // Allow user to bypass with ?intro=0 or ?skipintro=1
    var search = window.location.search;
    if (search.indexOf("intro=0") !== -1 || search.indexOf("skipintro=1") !== -1) {
      return false;
    }
    // Runs on every refresh!
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
        '<span id="swarm-coord" class="swarm-coords">LOC: X:128 Y:64 Z:256 • BIOME: CAMPUS</span>' +
      '</div>' +
      '<button type="button" class="swarm-skip-btn" id="swarm-skip-btn" title="Skip Intro (Escape)">' +
        'SKIP <span class="swarm-skip-key">[ESC]</span> ✕' +
      '</button>' +
      '<canvas id="swarm-canvas"></canvas>' +
      '<div id="swarm-box-nav" class="swarm-box">' +
        '<span class="swarm-box-tag">NAV_HEADER</span>' +
        '<span class="swarm-box-dim" id="swarm-nav-dim">100% × 56px</span>' +
      '</div>' +
      '<div id="swarm-box-hero" class="swarm-box">' +
        '<span class="swarm-box-tag">HERO_VIEWPORT</span>' +
        '<span class="swarm-box-dim" id="swarm-hero-dim">920 × 420</span>' +
        '<div class="swarm-hero-content">' +
          '<div class="swarm-logo-badge" id="swarm-logo">' +
            '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5L4.5 9.75 3 10.5l9 4.5 9-4.5-1.5-.75L12 13.5zm0 4.5L4.5 14.25 3 15l9 4.5 9-4.5-1.5-.75L12 18z"/></svg>' +
          '</div>' +
          '<div class="swarm-term-title" id="swarm-title"></div>' +
          '<div class="swarm-term-sub" id="swarm-sub"></div>' +
          '<div class="swarm-buttons-preview" id="swarm-btns">' +
            '<span class="swarm-btn-frame primary" id="swarm-btn-events">BROWSE EVENTS</span>' +
            '<span class="swarm-btn-frame" id="swarm-btn-challenge">TAKE CHALLENGE</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
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

  function start() {
    if (isPlaying) return;
    isPlaying = true;
    if (window.CCLTCE_SWARM) window.CCLTCE_SWARM._active = true;

    // Clear previous overlay if any
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

    // Build cursor DOM elements using authentic Minecraft pixel tool cursors
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

      // Distribute starting positions off-screen
      var startX = (idx % 2 === 0) ? -60 : W + 60;
      var startY = (idx * (H / activeCursors.length)) + 40;

      cursorNodes.push({
        def: c,
        el: node,
        x: startX,
        y: startY,
        tx: W / 2 + (Math.random() - 0.5) * 200,
        ty: H / 2 + (Math.random() - 0.5) * 200
      });
    });

    // Box and UI elements
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
    var heroY = isMobile ? 104 : ((H - heroH) / 2 + 10);
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
      var colors = ["#55ff55", "#facc15", "#22c55e", "#55ffff", "#ffffff", "#eab308"];
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 3 + Math.random() * 14;
        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          size: 3 + Math.floor(Math.random() * 6),
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: 0.015 + Math.random() * 0.025
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
        c.x += (c.tx - c.x) * 0.14;
        c.y += (c.ty - c.y) * 0.14;
        c.el.style.transform = "translate3d(" + Math.round(c.x) + "px, " + Math.round(c.y) + "px, 0)";
      }

      // Draw canvas guides and particles
      if (ctx) {
        ctx.clearRect(0, 0, W, H);

        // Draw dynamic connecting guide lines between cursors during build phase
        if (elapsed > 400 && elapsed < 3100) {
          ctx.beginPath();
          ctx.strokeStyle = "rgba(85, 255, 85, 0.16)";
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

        // Update & render XP particles
        for (var p = particles.length - 1; p >= 0; p--) {
          var pt = particles[p];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.22; // Minecraft gravity effect on XP orbs
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

    // =========================================================================
    // Choreographed Timeline (~3.8s cinema pacing)
    // =========================================================================

    // Phase 1 (100ms - 450ms): Cursors enter realm & converge to wireframe anchors
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (statusTxt) statusTxt.textContent = "SYNCHRONIZING VOXEL CHUNKS";
      sfx.blockPop();
      setXP(15, 5);

      // Steve heads to Nav
      if (cursorNodes[0]) {
        cursorNodes[0].tx = navX + 30;
        cursorNodes[0].ty = navY + navH / 2;
      }
      // Alex & Miner frame Hero
      if (cursorNodes[1]) {
        cursorNodes[1].tx = heroX + 40;
        cursorNodes[1].ty = heroY + 40;
      }
      if (cursorNodes[2]) {
        cursorNodes[2].tx = heroX + heroW - 40;
        cursorNodes[2].ty = heroY + heroH - 40;
      }
      // Hacker & Builder
      if (cursorNodes[3]) {
        cursorNodes[3].tx = heroX + heroW / 2;
        cursorNodes[3].ty = heroY + 90;
      }
      if (cursorNodes[4]) {
        cursorNodes[4].tx = heroX + heroW / 2;
        cursorNodes[4].ty = heroY + heroH - 60;
      }
    }, 200));

    // Phase 2 (500ms - 1100ms): Drawing Nav & Hero Wireframes
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (statusTxt) statusTxt.textContent = "GENERATING BLUEPRINT MESH";
      if (boxNav) boxNav.classList.add("active");
      if (boxHero) boxHero.classList.add("active");
      sfx.blockPop();
      setXP(30, 12);

      if (cursorNodes[0]) {
        cursorNodes[0].tx = navX + navW - 60;
        cursorNodes[0].ty = navY + navH / 2;
        spawnRipple(cursorNodes[0].tx, cursorNodes[0].ty, cursorNodes[0].def.color);
      }
      if (cursorNodes[1]) {
        cursorNodes[1].tx = heroX + heroW / 2;
        cursorNodes[1].ty = heroY + 60;
      }
    }, 600));

    // Phase 3 (1100ms - 1500ms): Wireframe solidifies & core emblem appears
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (boxNav) boxNav.classList.add("complete");
      if (boxHero) boxHero.classList.add("complete");
      if (logoBadge) logoBadge.classList.add("visible");
      if (statusTxt) statusTxt.textContent = "MOUNTING CORE DIAMOND CREST";
      sfx.xpOrb();
      setXP(48, 20);
      spawnRipple(heroX + heroW / 2, heroY + 60, "#55ff55");

      if (cursorNodes[0]) {
        cursorNodes[0].tx = navX + navW / 2;
        cursorNodes[0].ty = navY + navH / 2;
      }
      if (cursorNodes[1]) {
        cursorNodes[1].tx = heroX + heroW / 2 - 120;
        cursorNodes[1].ty = heroY + 140;
      }
      if (cursorNodes[2]) {
        cursorNodes[2].tx = heroX + heroW / 2 + 120;
        cursorNodes[2].ty = heroY + 140;
      }
    }, 1150));

    // Phase 4 (1500ms - 2500ms): Rhythmic Typewriter text assembly
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (statusTxt) statusTxt.textContent = "COMPILING OVERWORLD TITLE";
      var fullTitle = "CODING CLUB";
      var fullSub = "BUILD • SHIP • BREAK THINGS";
      var curIdx = 0;

      function typeNext() {
        if (!isPlaying) return;
        if (curIdx < fullTitle.length) {
          if (termTitle) {
            termTitle.innerHTML = fullTitle.slice(0, curIdx + 1) + '<span class="swarm-cursor-carat"></span>';
          }
          sfx.typeTick();
          curIdx++;
          timeouts.push(setTimeout(typeNext, 55));
        } else {
          if (termSub) {
            termSub.innerHTML = fullSub;
            sfx.blockPop();
          }
          if (termTitle) {
            termTitle.textContent = fullTitle;
          }
          setXP(72, 30);
        }
      }
      typeNext();

      if (cursorNodes[3]) {
        cursorNodes[3].tx = heroX + heroW / 2 + 80;
        cursorNodes[3].ty = heroY + heroH / 2;
      }
    }, 1550));

    // Phase 5 (2500ms - 3100ms): Place Minecraft Action Buttons
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (buttonsPreview) buttonsPreview.classList.add("visible");
      if (statusTxt) statusTxt.textContent = "BINDING ACTION TRIGGERS";
      sfx.buttonClick();
      setXP(88, 38);

      var btnEv = document.getElementById("swarm-btn-events");
      var btnCh = document.getElementById("swarm-btn-challenge");

      if (cursorNodes[1]) {
        cursorNodes[1].tx = heroX + heroW / 2 - 80;
        cursorNodes[1].ty = heroY + heroH - 55;
        spawnRipple(cursorNodes[1].tx, cursorNodes[1].ty, cursorNodes[1].def.color);
      }
      if (cursorNodes[2]) {
        cursorNodes[2].tx = heroX + heroW / 2 + 80;
        cursorNodes[2].ty = heroY + heroH - 55;
        spawnRipple(cursorNodes[2].tx, cursorNodes[2].ty, cursorNodes[2].def.color);
      }
    }, 2550));

    // Phase 6 (3100ms - 3400ms): Swarm Convergence & XP 100%
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      if (statusTxt) statusTxt.textContent = "REALM ONLINE // ALL SYSTEMS READY";
      setXP(100, 42);

      // Cursors orbit and converge into center
      var cx = heroX + heroW / 2;
      var cy = heroY + heroH / 2;
      for (var k = 0; k < cursorNodes.length; k++) {
        var angle = (k / cursorNodes.length) * Math.PI * 2;
        cursorNodes[k].tx = cx + Math.cos(angle) * 75;
        cursorNodes[k].ty = cy + Math.sin(angle) * 75;
      }
    }, 3100));

    // Phase 7 (3400ms - 3800ms): Climax XP Fanfare & Radiant Explosion
    timeouts.push(setTimeout(function () {
      if (!isPlaying) return;
      var cx = heroX + heroW / 2;
      var cy = heroY + heroH / 2;
      spawnParticles(cx, cy, 75);
      sfx.levelUp();

      // Cursors scatter outward in all directions
      for (var m = 0; m < cursorNodes.length; m++) {
        var angle = (m / cursorNodes.length) * Math.PI * 2 + 0.35;
        cursorNodes[m].tx = cx + Math.cos(angle) * (W * 0.75);
        cursorNodes[m].ty = cy + Math.sin(angle) * (H * 0.75);
      }
    }, 3400));

    // Phase 8 (3800ms): Seamless Dissolve into the interactive 3D voxel website
    timeouts.push(setTimeout(function () {
      finish(false);
    }, DURATION));

    // Skip Button Handler
    var skipBtn = document.getElementById("swarm-skip-btn");
    if (skipBtn) {
      function onSkip(e) {
        e.stopPropagation();
        finish(true);
      }
      skipBtn.addEventListener("click", onSkip);
      skipBtn.addEventListener("pointerdown", onSkip);
    }

    // Click anywhere on overlay skips immediately
    function onOverlayClick(e) {
      finish(true);
    }
    overlayEl.addEventListener("click", onOverlayClick);

    // Keyboard shortcuts (Escape or Space skips)
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
    if (window.CCLTCE_SWARM) window.CCLTCE_SWARM._active = false;

    // Clear all scheduled timeouts
    timeouts.forEach(function (tid) { clearTimeout(tid); });
    timeouts = [];

    // Cancel animation frame
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

  // Manual replay method
  function replay() {
    finish(true);
    setTimeout(function () {
      start();
    }, 50);
  }

  // Global key listener for Shift+S (Replay Intro)
  window.addEventListener("keydown", function (e) {
    if (e.shiftKey && (e.key === "S" || e.key === "s")) {
      var tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea") return;
      e.preventDefault();
      replay();
    }
  });

  // Expose API
  window.CCLTCE_SWARM = {
    _active: false,
    start: start,
    finish: finish,
    replay: replay
  };

  // Auto-run on every refresh
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      if (shouldPlay()) start();
    });
  } else {
    if (shouldPlay()) start();
  }
})();
