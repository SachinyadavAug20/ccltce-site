// Lorenz attractor canvas — mounts into [data-math-canvas]; cursor drives rotation.
(function () {
  var mount = document.querySelector("[data-math-canvas]");
  if (!mount) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cv = document.createElement("canvas");
  cv.className = "math-canvas";
  cv.setAttribute("aria-hidden", "true");
  mount.appendChild(cv);
  var ctx = cv.getContext("2d");
  if (!ctx) return;

  var W = 0, H = 0, DPR = Math.min(devicePixelRatio || 1, 1.5);
  function fit() {
    var r = mount.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    cv.width = W * DPR;
    cv.height = H * DPR;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  fit();
  var rz;
  addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(fit, 180); });

  // Lorenz: sigma=10, rho=28, beta=8/3
  var x = 0.1, y = 0, z = 0, pts = [], rotY = 0, rotX = 0, tRotY = 0, tRotX = 0;
  var COLS = ["#17dd62", "#ffaa00", "#ff2222"];
  for (var i = 0; i < 220; i++) pts.push({ x: 0, y: 0, z: 0, c: COLS[i % 3] });

  mount.addEventListener("pointermove", function (e) {
    var r = mount.getBoundingClientRect();
    tRotY = ((e.clientX - r.left) / r.width - 0.5) * 1.4;
    tRotX = ((e.clientY - r.top) / r.height - 0.5) * 0.9;
  }, { passive: true });

  function step() {
    var dt = 0.005;
    var dx = 10 * (y - x), dy = x * (28 - z) - y, dz = x * y - (8 / 3) * z;
    x += dx * dt; y += dy * dt; z += dz * dt;
    pts.shift();
    pts[pts.length - 1] = { x: x, y: y, z: z, c: COLS[(Math.random() * 3) | 0] };
  }

  var running = false;
  function draw() {
    ctx.fillStyle = "rgba(18,18,18,0.28)";
    ctx.fillRect(0, 0, W, H);
    rotY += (tRotY - rotY) * 0.06;
    rotX += (tRotX - rotX) * 0.06;
    var cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
    var s = Math.min(W, H) / 55, ox = W / 2, oy = H / 2 + H * 0.12;
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i], q = pts[i - 1];
      var px = p.x, py = p.y - 25, pz = p.z;
      var qx = q.x, qy = q.y - 25, pz2 = q.z;
      var x1 = cy * px + sy * pz, z1 = -sy * px + cy * pz, y1 = py;
      var y2 = cx * y1 - sx * z1, z2 = sx * y1 + cx * z1;
      var x1b = cy * qx + sy * pz2, z1b = -sy * qx + cy * pz2, y1b = qy;
      var y2b = cx * y1b - sx * z1b, z2b = sx * y1b + cx * z1b;
      var d = 90 / (90 + z2);
      var db = 90 / (90 + z2b);
      ctx.strokeStyle = p.c;
      ctx.globalAlpha = 0.5 + d * 0.4;
      ctx.lineWidth = Math.max(1, d * 1.6);
      ctx.beginPath();
      ctx.moveTo(ox + x1b * s * db, oy + y2b * s * db);
      ctx.lineTo(ox + x1 * s * d, oy + y2 * s * d);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  if (reduce) {
    for (var k = 0; k < 900; k++) step();
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, W, H);
    draw();
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !running) {
          running = true;
          (function loop() {
            if (!running) return;
            step(); draw();
            requestAnimationFrame(loop);
          })();
        } else if (!e.isIntersecting) running = false;
      });
    }, { threshold: 0.05 });
    io.observe(mount);
  }
})();
