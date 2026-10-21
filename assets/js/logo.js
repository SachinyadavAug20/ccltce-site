const svg = document.querySelector(".wordmark");

if (svg) {
  const NS = "http://www.w3.org/2000/svg";
  const STR = "< CODING CLUB >";
  const CX = 360;
  const LAYERS = [
    { cls: "wm o", dx: 0, dy: 112 },
    { cls: "wm w", dx: -6, dy: 122, fill: "url(#g-green)" },
    { cls: "wm p", dx: 2, dy: 115, fill: "url(#g-pink)" },
    { cls: "wm c", dx: -1, dy: 107, fill: "url(#g-cream)" },
  ];

  const mkText = (cls, x, y, ch, fill) => {
    const t = document.createElementNS(NS, "text");
    t.setAttribute("class", cls);
    t.setAttribute("x", x.toFixed(2));
    t.setAttribute("y", y);
    if (fill) t.setAttribute("fill", fill);
    t.textContent = ch;
    return t;
  };

  function build() {
    const g = svg.querySelector("g");
    const measure = mkText("wm c", CX, -300, STR);
    svg.appendChild(measure);
    const total = measure.getComputedTextLength();
    const start = CX - total / 2;

    g.innerHTML = "";
    g.appendChild(measure);
    measure.setAttribute("visibility", "hidden");

    const parts = [...STR].map((ch, i) => ({
      ch,
      w: measure.getSubStringLength(i, 1),
    }));

    let acc = 0;
    const letters = [];
    parts.forEach(({ ch, w }) => {
      const cx = start + acc + w / 2;
      if (ch.trim()) {
        const lg = document.createElementNS(NS, "g");
        LAYERS.forEach((L) => lg.appendChild(mkText(L.cls, cx + L.dx, L.dy, ch, L.fill)));
        g.appendChild(lg);
        letters.push({ el: lg, cx, ox: 0, oy: 0, rot: 0 });
      }
      acc += w;
    });

    svg.appendChild(g);
    return letters;
  }

  let letters = [];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function interact() {
    let mx = -9999, my = -9999;
    addEventListener("pointermove", (e) => {
      mx = e.clientX;
      my = e.clientY;
    });

    const tick = () => {
      requestAnimationFrame(tick);
      if (document.hidden || !letters.length) return;

      const r = svg.getBoundingClientRect();
      const sx = r.width / 720, sy = r.height / 160;
      if (!sx) return;

      for (const L of letters) {
        const hx = r.left + L.cx * sx;
        const hy = r.top + 112 * sy;
        const dx = mx - hx, dy = my - hy;
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.max(0, 1 - d / 150);
        const push = 15 * k * k;
        const tx = (-dx / d) * push;
        const ty = (-dy / d) * push * 0.6;
        const tr = k * k * ((dx < 0 ? 14 : -14));

        L.ox += (tx - L.ox) * 0.13;
        L.oy += (ty - L.oy) * 0.13;
        L.rot += (tr - L.rot) * 0.13;
        L.el.setAttribute(
          "transform",
          `translate(${L.ox.toFixed(2)} ${L.oy.toFixed(2)}) rotate(${L.rot.toFixed(2)} ${(L.cx).toFixed(2)} 112)`
        );
      }
    };
    tick();
  }

  const start = () => {
    letters = build();
    if (!reduced) interact();
  };

  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).then(start);
  } else {
    start();
  }
}
