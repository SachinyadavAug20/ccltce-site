// Hero FX — cinematic sky-drop entrance + Minecraft-item block bob on hover (GSAP).
// Entrance: the type falls out of the cloud bank on load — staggered drop from above
// with a soft settle. Hover: pop + gentle float, interruptible.
(function () {
  if (!window.gsap) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(pointer: fine)").matches;

  // ── sky-drop entrance ─────────────────────────────────────────────
  // Skipped when the swarm intro plays — it assembles the hero itself;
  // replaying the drop after it caused the "washed/faded title" look.
  var overlay = document.querySelector(".hero-overlay");
  if (overlay && !reduce && !document.documentElement.classList.contains("swarm-queued")) {
    var parts = overlay.querySelectorAll(".hero-logo, .hero-badge, .hero-title, .hero-sub, .hero-cta");
    if (parts.length) {
      gsap.from(parts, {
        y: -110,            // drop from the sky, through where the clouds part
        opacity: 0,
        duration: 0.75,
        stagger: 0.08,      // logo → badge → title → sub → cta cascade
        ease: "power3.out",
        clearProps: "transform",   // leave opacity to the scroll fade, clear motion residue
        delay: 0.15,
      });
    }
  }

  // ── vanilla splash text — yellow, rotated, pulsing twice per second like the real menu ──
  var SPLASHES = [
    "Also try the shell!", "Turing complete!", "Exploding creepers!", "Read more books!",
    "The creeper is a spy!", "Made by students!", "Has an ending!", "100% vanilla!",
    "Don't waste iron!", "Now in beta!", "Closed source!", "The bee's knees!",
    "Kinda dragon free!", "As seen on TV!", "CTRL+` or Ctrl+`!", "Removed Herobrine",
    "Place ALL the blocks!", "Leveraging synergy!", "Bread is pain!", "90% pure!",
    "More polygons!", "Local multiplayer!", "farm up!", "Missingno is watching",
  ];
  var title = overlay && overlay.querySelector(".hero-title");
  if (title && !title.dataset.splash) {
    title.dataset.splash = 1;
    var sp = document.createElement("span");
    sp.className = "hero-splash";
    sp.textContent = SPLASHES[Math.floor(Math.random() * SPLASHES.length)];
    title.appendChild(sp);
    if (!reduce) {
      setInterval(function () {                            // fade-swap every 4s, like re-entering the menu
        var rng = Math.floor(Math.random() * SPLASHES.length);
        sp.textContent = SPLASHES[rng];
        gsap.fromTo(sp, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(3)" });
      }, 4000);
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
