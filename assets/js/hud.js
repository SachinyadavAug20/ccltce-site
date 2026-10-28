// XP rail (right edge) + 9-slot quick/relic hotbar — subtle progression HUD.
(function () {
  var gsap = window.gsap;
  var xp = parseInt(localStorage.getItem("ccltce-xp") || "0", 10), relics = [];
  try { relics = JSON.parse(localStorage.getItem("ccltce-relics") || "[]"); } catch (e) {}
  var RELIC = { "Sudo Pickaxe": "#pick", "Redstone Dust": "#dust", "Golden Apple": "#apple", "Void Feather": "#feather", "Mending Book": "#book" };
  var QUICK = [["⌂", "Home", "index.html"], ["E", "Events", "events.html"], ["T", "Team", "team.html"],
    ["⚔", "Challenges", "challenges.html"], ["R", "Resources", "resources.html"], ["N", "Notices", "notices.html"],
    ["★", "Achievements", "achievements.html"], ["$", "Open shell (Ctrl+`)", null], ["W", "CCLTCE Week", "challenges.html"]];
  var fill, tip, slots, rail, toast, toastT;
  // batch localStorage writes — clicks earn XP constantly; don't hit storage every time
  var xpDirty = false, relicsDirty = false, saveT = 0;
  function flush() {
    if (saveT) { clearTimeout(saveT); saveT = 0; }
    if (xpDirty) { try { localStorage.setItem("ccltce-xp", String(xp)); } catch (e) {} xpDirty = false; }
    if (relicsDirty) { try { localStorage.setItem("ccltce-relics", JSON.stringify(relics)); } catch (e) {} relicsDirty = false; }
  }
  function scheduleSave() {
    if (saveT) return;
    saveT = setTimeout(flush, 400);
  }
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", function () { if (document.hidden) flush(); });
  var RANKS = [[1, "Guest Explorer"], [5, "Script Kiddie"], [10, "Bug Hunter"], [25, "Kernel Crafter"], [50, "Redstone Sage"]];
  function rank() {
    var r = RANKS[0][1];
    RANKS.forEach(function (p) { if (xp >= p[0] * 100) r = p[1]; });
    return r;
  }
  function level() { return 1 + Math.floor(xp / 100); }
  function need() { return 100 - (xp % 100); }
  function paint() {
    if (!fill || !rail) return;
    fill.style.height = (xp % 100) + "%";
    rail.setAttribute("aria-valuenow", String(xp % 100));
  }
  function burstGold() {
    var c = document.createElement("canvas");
    c.className = "hud-fx";
    document.body.appendChild(c);
    c.width = innerWidth; c.height = innerHeight;
    var g = c.getContext("2d"), parts = [], ox = innerWidth - 18, oy = innerHeight / 2;
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
    if (!toast) return;
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
    return "Lv " + level() + " · " + rank() + "\n" + (xp % 100) + "% to next · " + need() + " XP left\n" +
      "Earn XP by clicking, shell (Ctrl+`), events,\nchallenges. Relics fill the hotbar below.";
  }
  function showTip() { if (!tip) return; tip.textContent = tipText(); tip.hidden = false; }
  function hideTip() { if (tip) tip.hidden = true; }
  function paintSlots() {
    if (!slots) return;
    slots.forEach(function (s, i) {
      var r = relics[i], q = QUICK[i] || ["", "", null];
      s.textContent = r ? (RELIC[r] || "★") : q[0];
      s.title = r || q[1];
      s.classList.toggle("filled", !!r);
      s.classList.toggle("quick", !r);
    });
  }
  function addXP(n) {
    var before = level();
    xp += n;
    xpDirty = true;
    scheduleSave();
    if (fill) paint();
    if (level() > before) {
      if (window.CCLTCE_SFX) CCLTCE_SFX.levelUp();
      if (rail) burstGold();
      if (toast) showToast("★ Level " + level() + "! " + rank());
      if (fill && gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.fromTo(fill, { filter: "brightness(2)" }, { filter: "brightness(1)", duration: 0.5 });
      }
    }
  }
  function relic(name) {
    if (relics.indexOf(name) > -1) return;
    relics.push(name);
    relicsDirty = true;
    scheduleSave();
    if (slots) paintSlots();
  }
  function mount() {
    // Skip desktop game HUD on mobile/touch screens (< 900px or touch) — concentrated mobile app shell
    if (matchMedia("(max-width: 899px), (pointer: coarse)").matches) return;
    rail = document.createElement("div");
    rail.className = "xp-rail";
    rail.setAttribute("role", "progressbar");
    rail.setAttribute("aria-label", "Explorer progress");
    rail.setAttribute("aria-valuemin", "0");
    rail.setAttribute("aria-valuemax", "100");
    rail.innerHTML = '<div class="xp-rail-track"><span class="xp-rail-fill"></span></div><div class="xp-tip" hidden></div>';
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
    hot.setAttribute("aria-label", "Quick slots");
    hot.innerHTML = "<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>";
    document.body.appendChild(hot);
    slots = [].slice.call(hot.querySelectorAll("i"));
    paintSlots();
    hot.addEventListener("click", function (e) {
      var s = e.target.closest("i"), i = slots.indexOf(s);
      if (i < 0 || relics[i]) return;
      var q = QUICK[i];
      if (!q) return;
      if (window.CCLTCE_SFX) CCLTCE_SFX.click();
      addXP(2);
      if (q[2]) location.href = q[2];
      else if (window.CCLTCE_TERM) CCLTCE_TERM.toggle();
    });
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
  window.CCLTCE_HUD = { mount: mount, addXP: addXP, relic: relic, level: level, rank: rank, need: need, xp: function () { return xp; }, flush: flush };
})();
