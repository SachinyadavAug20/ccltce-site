// Team FX — GSAP: card entrance, idle head bob, hover punch, character-sheet modal.
// Classic script after clickfx.js; waits for .t-card (main.js fetches data).
(function () {
  var gsap = window.gsap;
  if (!gsap) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    var n = 0, id = setInterval(function () {
      if (document.querySelector(".t-card") || ++n > 40) {
        clearInterval(id);
        if (document.querySelector(".t-card")) fn();
      }
    }, 250);
  }

  ready(function () {
    var cards = [].slice.call(document.querySelectorAll(".t-card"));
    cards.forEach(function (c) { c.setAttribute("tabindex", "0"); c.setAttribute("aria-haspopup", "dialog"); });
    if (!reduce) enhance(cards);
    mountModal(cards);
  });

  function enhance(cards) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var idx = [].indexOf.call(e.target.parentNode.children, e.target);
        gsap.from(e.target, { y: 30, opacity: 0, duration: 0.45, ease: "power2.out", delay: idx * 0.07 });
      });
    }, { threshold: 0.15 });
    cards.forEach(function (c, i) {
      io.observe(c);
      gsap.to(c.querySelector(".t-head"), { y: -5, duration: 1.5, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.18 });
      c.addEventListener("pointerenter", function () {
        gsap.to(c, { y: -6, duration: 0.14, ease: "steps(2)" });
        gsap.fromTo(c.querySelector(".t-head"), { scale: 1 }, { scale: 1.14, duration: 0.12, yoyo: true, repeat: 1, ease: "steps(2)" });
      });
      c.addEventListener("pointerleave", function () { gsap.to(c, { y: 0, duration: 0.16, ease: "steps(2)" }); });
    });
  }

  var ov, panel, last, openTl;

  function mountModal(cards) {
    ov = document.createElement("div");
    ov.className = "tf-overlay";
    ov.hidden = true;
    ov.innerHTML =
      '<div class="tf-panel" role="dialog" aria-modal="true" aria-label="Team member">' +
      '<span class="tf-strip"></span><button class="tf-close" type="button" aria-label="Close">&#10005;</button>' +
      '<div class="tf-head"><img alt="" width="176" height="176" /></div>' +
      '<span class="tf-badge"><i></i><span class="tf-role"></span></span>' +
      '<h2 class="tf-name"></h2><p class="tf-area"></p>' +
      '<div class="tf-lore"><p class="tf-lore-b"></p></div>' +
      '<p class="tf-item"></p>' +
      '<div class="tf-links"></div></div>';
    document.body.appendChild(ov);
    panel = ov.querySelector(".tf-panel");
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    ov.querySelector(".tf-close").addEventListener("click", close);
    ov.addEventListener("keydown", trap);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !ov.hidden) close(); });
    var grid = document.querySelector(".grid.team");
    grid.addEventListener("click", function (e) {
      var c = e.target.closest(".t-card");
      if (c && !e.target.closest("a")) open(c);
    });
    grid.addEventListener("keydown", function (e) {
      var c = e.target.closest(".t-card");
      if (c && (e.key === "Enter" || e.key === " ") && !e.target.closest("a")) { e.preventDefault(); open(c); }
    });
  }

  function trap(e) {
    if (e.key !== "Tab" || ov.hidden) return;
    var f = ov.querySelectorAll("a[href], button");
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }

  function open(card) {
    var d = card.dataset, q = function (s) { return ov.querySelector(s); };
    if (ov.hidden) last = document.activeElement;
    q(".tf-head img").src = card.querySelector(".t-head img").src;
    q(".tf-role").textContent = d.role || "";
    q(".tf-name").textContent = d.name || "";
    q(".tf-area").textContent = d.area || "";
    q(".tf-lore-b").textContent = d.bio || "";
    q(".tf-item").innerHTML = d.item ? 'Holds: <b>' + String(d.item).replace(/[&<>]/g, "") + "</b>" : "";
    q(".tf-strip").style.background = d.accent || "#17DD62";
    q(".tf-badge").style.background = d.accent || "#17DD62";
    q(".tf-links").innerHTML = [["PORT", d.portfolio], ["GH", "https://github.com/" + d.github],
      ["X", "https://x.com/" + d.twitter], ["LI", "https://linkedin.com/in/" + d.linkedin]]
      .map(function (l) { return '<a class="tf-btn" href="' + l[1] + '" target="_blank" rel="noopener">' + l[0] + "</a>"; }).join("");
    ov.hidden = false;
    document.body.style.overflow = "hidden";
    q(".tf-close").focus();
    if (openTl) openTl.kill();
    if (reduce) { gsap.set(ov, { opacity: 1 }); return; }
    var parts = [q(".tf-name"), q(".tf-area"), q(".tf-lore"), q(".tf-item")];
    openTl = gsap.timeline();
    openTl.fromTo(ov, { opacity: 0 }, { opacity: 1, duration: 0.16, ease: "steps(3)" })
      .fromTo(panel, { y: 34, scale: 0.86, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.8)" }, "-=0.05")
      .fromTo(q(".tf-head"), { scale: 0, rotation: -10 }, { scale: 1, rotation: 0, duration: 0.34, ease: "back.out(2.4)" }, "-=0.14")
      .fromTo(q(".tf-badge"), { scaleX: 0 }, { scaleX: 1, duration: 0.2, ease: "steps(5)" }, "-=0.16")
      .fromTo(parts, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.2, stagger: 0.05, ease: "power2.out" }, "-=0.08")
      .fromTo(q(".tf-links").children, { scale: 0 }, { scale: 1, duration: 0.2, stagger: 0.04, ease: "back.out(2.6)" }, "-=0.12");
  }

  function close() {
    document.body.style.overflow = "";
    var finished = false;
    var done = function () {
      if (finished) return;
      finished = true;
      ov.hidden = true;
      if (last && last.focus) last.focus();
    };
    if (reduce) return done();
    gsap.to(panel, { y: 18, scale: 0.9, opacity: 0, duration: 0.16, ease: "power2.in" });
    gsap.to(ov, { opacity: 0, duration: 0.18, ease: "steps(3)", onComplete: done });
    setTimeout(done, 600); // safety if the rAF ticker stalls (hidden tab)
  }
})();
