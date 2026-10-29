// Hero emblem — Minecraft-item block bob on hover (GSAP).
// The glow was removed from hero.css; motion lives here so it stays smooth
// and interruptible: pop on enter, gentle float while hovered, settle on leave.
(function () {
  if (!window.gsap) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (matchMedia("(pointer: coarse)").matches) return; // touch has no hover
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
