// Gamification engine — loads data into VFS, mounts terminal + HUD, wires XP.
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // single shared fetch of data/content.json (main.js awaits the same promise)
  window.__CCLTCE_CONTENT__ =
    window.__CCLTCE_CONTENT__ ||
    fetch("data/content.json")
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; });

  function boot(data) {
    if (window.CCLTCE_VFS) CCLTCE_VFS.load(data || {});
    if (window.CCLTCE_TERM) CCLTCE_TERM.mount();
    if (window.CCLTCE_HUD) CCLTCE_HUD.mount();

    // +10 XP on first navigation interaction per session
    var nav = sessionStorage.getItem("ccltce-navxp");
    if (!nav && window.CCLTCE_HUD) {
      CCLTCE_HUD.addXP(10);
      sessionStorage.setItem("ccltce-navxp", "1");
    }

    // click a nav link or btn = +2 XP (throttled feel via dedupe)
    document.addEventListener("click", function (e) {
      if (!window.CCLTCE_HUD) return;
      if (e.target.closest("a, .btn, .t-card")) CCLTCE_HUD.addXP(2);
    }, { passive: true });

    if (window.CCLTCE_SFX) {
      document.addEventListener("pointerdown", function once() {
        CCLTCE_SFX.click();
        document.removeEventListener("pointerdown", once);
      }, { once: true });
    }

    if (!reduce && window.console && console.log) {
      console.log("%c[TIP] Ctrl+` opens the CCLTCE shell", "color:#ffaa00;font-size:12px");
    }
  }

  window.__CCLTCE_CONTENT__.then(boot);
})();
