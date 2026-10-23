// Motion — GSAP driven. Classic script, runs after chrome.js mounts.
// The navbar logo and wordmark stay still; only the hero copy animates in.
(function () {
  var gsap = window.gsap;

  function init() {
    if (!gsap) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    document.documentElement.classList.add("gsap-ready");

    var hero = document.querySelector(".hero");
    if (!hero) return;
    var intro = [".hero-logo", ".hero-sub", ".hero-cta"]
      .map(function (sel) { return hero.querySelector(sel); })
      .filter(Boolean);
    gsap.fromTo(intro,
      { opacity: 0.4, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.08, clearProps: "all" });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
