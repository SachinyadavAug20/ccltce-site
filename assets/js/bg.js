const cv = document.getElementById("bg");

if (cv) {
  const ctx = cv.getContext("2d");
  const PAL = ["#04070a", "#0b1416", "#13302d", "#1d4a44", "#2c6e60", "#3f9483"];
  const BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];

  function paint() {
    cv.width = innerWidth;
    cv.height = innerHeight;
    const cell = 7;
    const cols = Math.ceil(cv.width / cell) + 1;
    const rows = Math.ceil(cv.height / cell) + 1;
    const gs = 13;
    const gx = Math.ceil(cols / gs) + 2;
    const gy = Math.ceil(rows / gs) + 2;
    const seed = Array.from({ length: gx * gy }, () => Math.random());

    const noise = (x, y) => {
      const fx = x / gs, fy = y / gs;
      const x0 = fx | 0, y0 = fy | 0, tx = fx - x0, ty = fy - y0;
      const g = (i, j) => seed[j * gx + i];
      const a = g(x0, y0), b = g(x0 + 1, y0), c = g(x0, y0 + 1), d = g(x0 + 1, y0 + 1);
      return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
    };

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let v = noise(x, y) * 0.7 + noise(x * 2.9, y * 2.9) * 0.3;
        v += (BAYER[y % 4][x % 4] / 16 - 0.5) * 0.6;
        v = Math.max(0, Math.min(0.999, v));
        ctx.fillStyle = PAL[(v * PAL.length) | 0];
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }

  let t;
  addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(paint, 150);
  });
  paint();
}
