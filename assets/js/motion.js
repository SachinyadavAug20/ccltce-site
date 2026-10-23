// Motion — GSAP driven. Classic script, runs after chrome.js mounts.
(function () {
  var gsap = window.gsap;

  function init() {
    if (!gsap) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    document.documentElement.classList.add("gsap-ready");

    var hero = document.querySelector(".hero");
    if (hero) {
      var intro = [".hero-logo", ".hero-title", ".hero-sub", ".hero-cta"]
        .map(function (sel) { return hero.querySelector(sel); })
        .filter(Boolean);
      gsap.fromTo(intro,
        { opacity: 0.4, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.08, clearProps: "all" });
    }

    // scroll-reveal: team cards, res cards, events, notices, challenges, achievements
    var cards = document.querySelectorAll(".t-card, .res-card, .event, .notice-item, .challenge, .ach");
    if (cards.length && "IntersectionObserver" in window) {
      cards.forEach(function (c) { c.style.opacity = "0"; c.style.transform = "translateY(18px)"; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          gsap.to(en.target, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", clearProps: "transform" });
          io.unobserve(en.target);
        });
      }, { threshold: 0.12 });
      cards.forEach(function (c) { io.observe(c); });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
