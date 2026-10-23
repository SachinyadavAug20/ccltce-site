// XP rail (right edge) + 9-slot hotbar — subtle progression HUD.
(function () {
  var gsap = window.gsap;
  var XP0 = parseInt(localStorage.getItem("ccltce-xp") || "0", 10);
  var xp = XP0, relics = [];
  try { relics = JSON.parse(localStorage.getItem("ccltce-relics") || "[]"); } catch (e) {}
  var RELIC_ICONS = { "Sudo Pickaxe": "#pick", "Redstone Dust": "#dust", "Golden Apple": "#apple", "Void Feather": "#feather", "Mending Book": "#book" };
  var fill, tip, slots, rail, toast, toastT;

  var RANKS = [[1, "Guest Explorer"], [5, "Script Kiddie"], [10, "Bug Hunter"], [25, "Kernel Crafter"], [50, "Redstone Sage"]];
  function rank() {
    var r = RANKS[0][1];
    RANKS.forEach(function (p) { if (xp >= p[0] * 100) r = p[1]; });
    return r;
  }
  function level() { return 1 + Math.floor(xp / 100); }
  function need() { return 100 - (xp % 100); }
  function paint() {
    fill.style.height = (xp % 100) + "%";
    rail.setAttribute("aria-valuenow", String(xp % 100));
  }

  function burstGold() {
    var c = document.createElement("canvas");
    c.className = "hud-fx";
    document.body.appendChild(c);
    c.width = innerWidth; c.height = innerHeight;
    var g = c.getContext("2d"), parts = [];
    var ox = innerWidth - 18, oy = innerHeight / 2;
    for (var i = 0; i < 26; i++) parts.push({
      x: ox + (Math.random() - 0.5) * 40, y: oy + (Math.random() - 0.5) * 200,
      vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 8 - 2,
      s: 3 + ((Math.random() * 5) | 0), c: Math.random() > 0.5 ? "#ffaa00" : "#17dd62",
    });
    var t0 = performance.now();
    (function frame(now) {
      if ((now - t0) / 1000 > 1.6) { c.remove(); return; }
      g.clearRect(0, 0, c.width, c.height);
      parts.forEach(function (p) {
        p.vy += 0.45; p.x += p.vx; p.y += p.vy;
        g.fillStyle = p.c;
        g.fillRect(p.x | 0, p.y | 0, p.s, p.s);
      });
      requestAnimationFrame(frame);
    })(t0);
  }

  function showToast(text) {
    toast.textContent = text;
    toast.hidden = false;
    toast.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(function () {
      toast.classList.remove("on");
      setTimeout(function () { toast.hidden = true; }, 280);
    }, 2600);
    if (gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(toast, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" });
    }
  }

  function tipText() {
    return "Lv " + level() + " · " + rank() + "\n" +
      (xp % 100) + "% to next level · " + need() + " XP left\n" +
      "Earn XP by clicking, using the shell (Ctrl+`),\njoining events and solving challenges.";
  }
  function showTip() { tip.textContent = tipText(); tip.hidden = false; }
  function hideTip() { tip.hidden = true; }
  function paintSlots() {
    slots.forEach(function (s, i) {
      var r = relics[i];
      s.textContent = r ? (RELIC_ICONS[r] || "★") : "";
      s.title = r || "empty slot";
      s.classList.toggle("filled", !!r);
    });
  }

  function addXP(n) {
    var before = level();
    xp += n;
    localStorage.setItem("ccltce-xp", String(xp));
    paint();
    if (level() > before) {
      if (window.CCLTCE_SFX) CCLTCE_SFX.levelUp();
      burstGold();
      showToast("★ Level " + level() + "! " + rank());
      if (gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.fromTo(fill, { filter: "brightness(2)" }, { filter: "brightness(1)", duration: 0.5 });
      }
    }
  }

  function relic(name) {
    if (relics.indexOf(name) > -1) return;
    relics.push(name);
    localStorage.setItem("ccltce-relics", JSON.stringify(relics));
    paintSlots();
  }

  function mount() {
    rail = document.createElement("div");
    rail.className = "xp-rail";
    rail.setAttribute("role", "progressbar");
    rail.setAttribute("aria-label", "Explorer progress");
    rail.setAttribute("aria-valuemin", "0");
    rail.setAttribute("aria-valuemax", "100");
    rail.innerHTML =
      '<div class="xp-rail-track"><span class="xp-rail-fill"></span></div>' +
      '<div class="xp-tip" hidden></div>';
    document.body.appendChild(rail);
    fill = rail.querySelector(".xp-rail-fill");
    tip = rail.querySelector(".xp-tip");
    paint();
    rail.addEventListener("mouseenter", showTip);
    rail.addEventListener("mouseleave", hideTip);
    rail.addEventListener("click", function (e) {
      e.stopPropagation();
      if (tip.hidden) showTip(); else hideTip();
    });

    toast = document.createElement("div");
    toast.className = "xp-toast";
    toast.hidden = true;
    document.body.appendChild(toast);

    var hot = document.createElement("div");
    hot.className = "hotbar";
    hot.setAttribute("role", "toolbar");
    hot.setAttribute("aria-label", "Relic hotbar");
    hot.innerHTML = "<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>";
    document.body.appendChild(hot);
    slots = [].slice.call(hot.querySelectorAll("i"));
    paintSlots();
    document.addEventListener("keydown", function (e) {
      if (/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || "")) return;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9) {
        slots.forEach(function (s, i) { s.classList.toggle("sel", i === n - 1); });
        if (window.CCLTCE_SFX) CCLTCE_SFX.click();
      }
    });
    slots[0].classList.add("sel");
  }

  window.CCLTCE_HUD = { mount: mount, addXP: addXP, relic: relic, level: level, rank: rank, need: need, xp: function () { return xp; } };
})();
