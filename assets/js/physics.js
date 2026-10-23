// Rigid-body DOM collapse — custom integrator, gravity + floor bounce.
(function () {
  var gsap = window.gsap;
  var SEL = ".t-card, .notice-item, .event, .res-card, .ach, .challenge, .hero-title, .page-head h1";
  var bodies = [], running = false, overlay, floorY;

  function snapshot() {
    bodies = [];
    document.querySelectorAll(SEL).forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 20 || r.bottom < 0 || r.top > innerHeight) return;
      bodies.push({
        el: el,
        x: r.left + r.width / 2, y: r.top + r.height / 2,
        w: r.width, h: r.height,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * -6 - 2,
        rot: 0, vr: (Math.random() - 0.5) * 14,
      });
      el.style.position = "fixed";
      el.style.left = r.left + "px";
      el.style.top = r.top + "px";
      el.style.width = r.width + "px";
      el.style.height = r.height + "px";
      el.style.margin = "0";
      el.style.zIndex = "45";
      el.style.willChange = "transform";
    });
    floorY = innerHeight - 10;
  }

  function tick() {
    if (!running) return;
    var any = false;
    bodies.forEach(function (b) {
      b.vy += 0.55;
      b.x += b.vx;
      b.y += b.vy;
      b.rot += b.vr;
      if (b.y + b.h / 2 > floorY) {
        b.y = floorY - b.h / 2;
        b.vy *= -0.42;
        b.vx *= 0.86;
        b.vr *= 0.7;
        if (Math.abs(b.vy) < 1.2) b.vy = 0;
      }
      b.el.style.transform = "translate(" + (b.x - b.w / 2 - parseFloat(b.el.style.left)) + "px," +
        (b.y - b.h / 2 - parseFloat(b.el.style.top)) + "px) rotate(" + b.rot + "deg)";
      if (Math.abs(b.vy) > 0.1 || b.y + b.h / 2 < floorY - 1) any = true;
    });
    if (any) requestAnimationFrame(tick);
    else running = false;
  }

  function repair() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    bodies.forEach(function (b) {
      var el = b.el;
      if (gsap) {
        gsap.to(el, {
          left: el.style.left, top: el.style.top, duration: 0.01,
        });
      }
      el.style.transition = "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = "none";
      setTimeout(function () {
        el.style.cssText = "";
        el.style.transition = "";
      }, 750);
    });
    bodies = [];
    if (window.CCLTCE_SFX) CCLTCE_SFX.levelUp();
  }

  function collapse() {
    if (running || bodies.length) return;
    snapshot();
    if (!bodies.length) return;
    running = true;
    tick();
    overlay = document.createElement("button");
    overlay.type = "button";
    overlay.className = "repair-btn";
    overlay.textContent = "REPAIR WORLD";
    overlay.title = "/give @p mending_book";
    overlay.addEventListener("click", repair);
    document.body.appendChild(overlay);
    if (gsap) gsap.fromTo(overlay, { scale: 0 }, { scale: 1, duration: 0.4, ease: "back.out(2)" });
    if (window.CCLTCE_SFX) CCLTCE_SFX.mine();
  }

  window.CCLTCE_PHYSICS = { collapse: collapse, repair: repair };
})();
