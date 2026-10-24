// Motion — GSAP driven: intro, scroll-reveal, accordion, button physics.
(function () {
  var gsap = window.gsap;
  if (!gsap) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  document.documentElement.classList.add("gsap-ready");

  function init() {
    // hero intro
    var hero = document.querySelector(".hero");
    if (hero) {
      var intro = [".hero-logo", ".hero-title", ".hero-sub", ".hero-cta"]
        .map(function (s) { return hero.querySelector(s); }).filter(Boolean);
      gsap.fromTo(intro, { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power2.out", stagger: 0.09, clearProps: "all" });
    }

    // page-head fade
    var head = document.querySelector(".page-head");
    if (head) gsap.fromTo(head, { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", clearProps: "all" });

    // scroll-reveal cards
    var cards = document.querySelectorAll(".t-card, .res-card, .event, .notice-item, .challenge, .ach");
    if (cards.length && "IntersectionObserver" in window) {
      cards.forEach(function (c) { c.style.opacity = "0"; c.style.transform = "translateY(16px)"; });
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (!e.isIntersecting) return;
          gsap.to(e.target, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", clearProps: "transform" });
          io.unobserve(e.target);
        });
      }, { threshold: 0.1 });
      cards.forEach(function (c) { io.observe(c); });
    }

    // event accordion — smooth height
    document.querySelectorAll(".event").forEach(function (ev) {
      var body = ev.querySelector(".ev-body");
      if (!body) return;
      ev.addEventListener("toggle", function () {
        if (ev.open) gsap.fromTo(body, { height: 0, opacity: 0 },
          { height: "auto", opacity: 1, duration: 0.3, ease: "power2.out" });
      });
    });

    // button micro-physics
    document.querySelectorAll(".btn, .t-btn, .nav-cta a").forEach(function (btn) {
      btn.addEventListener("mouseenter", function () { gsap.to(btn, { scale: 1.02, duration: 0.12, ease: "power1.out" }); });
      btn.addEventListener("mouseleave", function () { gsap.to(btn, { scale: 1, duration: 0.12, ease: "power1.in" }); });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
