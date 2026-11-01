// Hero FX — cinematic sky-drop entrance + Minecraft-item block bob on hover (GSAP).
// Entrance: the type falls out of the cloud bank on load — staggered drop from above
// with a soft settle. Hover: pop + gentle float, interruptible.
(function () {
  if (!window.gsap) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(pointer: fine)").matches;

  // ── sky-drop entrance ─────────────────────────────────────────────
  var overlay = document.querySelector(".hero-overlay");
  if (overlay && !reduce) {
    var parts = overlay.querySelectorAll(".hero-logo, .hero-badge, .hero-title, .hero-sub, .hero-cta");
    if (parts.length) {
      gsap.from(parts, {
        y: -110,            // drop from the sky, through where the clouds part
        opacity: 0,
        duration: 1.05,
        stagger: 0.11,      // logo → badge → title → sub → cta cascade
        ease: "power3.out",
        clearProps: "transform",   // leave opacity to the scroll fade, clear motion residue
        delay: 0.15,
      });
    }
  }

  // ── emblem hover bob (fine pointers only) ─────────────────────────
  if (reduce || !fine) return;
  var logo = document.querySelector(".hero-logo");
  if (!logo) return;

  var bob = null;
  logo.addEventListener("pointerenter", function () {
    gsap.to(logo, { scale: 1.06, duration: 0.32, ease: "back.out(2.6)", overwrite: "auto" });
    if (!bob) {
      bob = gsap.to(logo, {
        y: -7, duration: 0.85, ease: "sine.inOut",
        yoyo: true, repeat: -1, delay: 0.28, overwrite: false,
      });
    }
  });
  logo.addEventListener("pointerleave", function () {
    if (bob) { bob.kill(); bob = null; }
    gsap.to(logo, { scale: 1, y: 0, duration: 0.4, ease: "power2.out", overwrite: "auto" });
  });
})();
