// 16×16 pixel-art avatar editor. Pure vanilla, no build.
// Stores a 16×16 matrix of hex colors (null = transparent/empty).
// Exports: openPixelEditor(initial, onSave), pixelMatrixToSvg(matrix, size)

const GRID = 16;
const PALETTE = [
  // rows of common colors — full picker below via input[type=color]
  "#000000","#1d2b53","#7e2553","#008751","#ab5236","#5f574f","#c2c3c7","#fff1e8",
  "#ff004d","#ffa300","#ffec27","#00e436","#29adff","#83769c","#ff77a8","#ffccaa",
  "#ffffff","#c0c0c0","#808080","#404040","#202020","#101010","#080808","#000000",
  "#e4002b","#f78200","#ffde00","#00a651","#00aeef","#6d3eb8","#ee2640","#f47b20",
  "#f9a825","#ff5722","#795548","#607d8b","#9e9d24","#3f51b5","#009688","#8bc34a",
  "#f9c8a0","#e8b48a","#d49a6c","#b8825a","#96664a","#7a5240","#5c3d2e","#3e2723",
  "#2b1b0e","#3d2314","#5c3317","#7f4f24","#a0522d","#1a1a1a","#4a3728","#696969",
  "#3b82f6","#22c55e","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899","#14b8a6",
];

export function pixelMatrixToSvg(matrix, size) {
  const S = size || 128;
  const px = S / GRID;
  let rects = "";
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const c = matrix[y] && matrix[y][x];
      if (!c) continue;
      rects += '<rect x="' + x * px + '" y="' + y * px + '" width="' + px + '" height="' + px + '" fill="' + c + '"/>';
    }
  }
  return "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + " " + S + '" shape-rendering="crispEdges">' +
    '<rect width="' + S + '" height="' + S + '" fill="#1a1a1a"/>' + rects + "</svg>"
  );
}

export function parsePixelMatrix(raw) {
  if (!raw) return null;
  try {
    const m = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(m) || m.length !== GRID) return null;
    if (!m.every((row) => Array.isArray(row) && row.length === GRID)) return null;
    return m;
  } catch { return null; }
}

export function openPixelEditor(initial, onSave) {
  // deep-copy initial matrix
  let matrix = [];
  for (let y = 0; y < GRID; y++) {
    matrix[y] = [];
    for (let x = 0; x < GRID; x++) {
      matrix[y][x] = (initial && initial[y] && initial[y][x]) || null;
    }
  }

  let color = "#eab308";
  let tool = "brush"; // brush | erase | fill | picker
  let drawing = false;

  // overlay
  const overlay = document.createElement("div");
  overlay.className = "pe-overlay";
  overlay.innerHTML =
    '<div class="pe-modal" role="dialog" aria-label="Pixel art editor">' +
    '<div class="pe-head"><h3>Pixel Avatar Editor</h3><button class="pe-close" type="button" aria-label="Close">✕</button></div>' +
    '<div class="pe-body">' +
    '<div class="pe-canvas-wrap"><canvas id="pe-canvas" width="' + GRID + '" height="' + GRID + '"></canvas></div>' +
    '<div class="pe-side">' +
    '<div class="pe-tools">' +
    '<button class="pe-tool active" data-tool="brush" title="Brush">✏️</button>' +
    '<button class="pe-tool" data-tool="erase" title="Eraser">⬜</button>' +
    '<button class="pe-tool" data-tool="fill" title="Fill">🪣</button>' +
    '<button class="pe-tool" data-tool="picker" title="Pick color"> eyedropper</button>' +
    "</div>" +
    '<div class="pe-color-row">' +
    '<input type="color" id="pe-color" value="' + color + '" title="Pick any color" />' +
    '<span class="pe-color-label" id="pe-color-label">' + color + "</span>" +
    "</div>" +
    '<div class="pe-palette" id="pe-palette"></div>' +
    '<div class="pe-actions">' +
    '<button class="btn" type="button" id="pe-clear">Clear</button>' +
    '<button class="btn" type="button" id="pe-random">Random</button>' +
    '<button class="btn btn-primary" type="button" id="pe-save">Save</button>' +
    "</div>" +
    "</div></div></div>";

  document.body.appendChild(overlay);
  const canvas = overlay.querySelector("#pe-canvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // palette
  const paletteEl = overlay.querySelector("#pe-palette");
  PALETTE.forEach((c) => {
    const sw = document.createElement("button");
    sw.type = "button";
    sw.className = "pe-swatch";
    sw.style.background = c;
    sw.title = c;
    sw.addEventListener("click", () => setColor(c));
    paletteEl.appendChild(sw);
  });

  const colorInput = overlay.querySelector("#pe-color");
  const colorLabel = overlay.querySelector("#pe-color-label");

  function setColor(c) {
    color = c;
    colorInput.value = c;
    colorLabel.textContent = c;
  }

  function draw() {
    ctx.clearRect(0, 0, GRID, GRID);
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (matrix[y][x]) {
          ctx.fillStyle = matrix[y][x];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 0.5 / 8; // scaled up visually via CSS
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, GRID); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(GRID, i); ctx.stroke();
    }
  }

  function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / rect.width * GRID);
    const y = Math.floor((e.clientY - rect.top) / rect.height * GRID);
    if (x < 0 || x >= GRID || y < 0 || y >= GRID) return null;
    return { x, y };
  }

  function floodFill(sx, sy, target, repl) {
    if (target === repl) return;
    const stack = [[sx, sy]];
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || x >= GRID || y < 0 || y >= GRID) continue;
      if (matrix[y][x] !== target) continue;
      matrix[y][x] = repl;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }

  function applyTool(x, y) {
    if (tool === "brush") matrix[y][x] = color;
    else if (tool === "erase") matrix[y][x] = null;
    else if (tool === "fill") floodFill(x, y, matrix[y][x], color);
    else if (tool === "picker") {
      const c = matrix[y][x];
      if (c) setColor(c);
    }
    draw();
  }

  canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    drawing = true;
    const cell = cellFromEvent(e);
    if (cell) applyTool(cell.x, cell.y);
  });
  canvas.addEventListener("mousemove", (e) => {
    if (!drawing || tool === "fill" || tool === "picker") return;
    const cell = cellFromEvent(e);
    if (cell) applyTool(cell.x, cell.y);
  });
  document.addEventListener("mouseup", () => { drawing = false; });

  // touch
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const cell = cellFromEvent(t);
    if (cell) applyTool(cell.x, cell.y);
  }, { passive: false });
  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const cell = cellFromEvent(t);
    if (cell && (tool === "brush" || tool === "erase")) applyTool(cell.x, cell.y);
  }, { passive: false });

  colorInput.addEventListener("input", () => setColor(colorInput.value));

  overlay.querySelectorAll(".pe-tool").forEach((btn) => {
    btn.addEventListener("click", () => {
      tool = btn.dataset.tool;
      overlay.querySelectorAll(".pe-tool").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  overlay.querySelector("#pe-clear").addEventListener("click", () => {
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) matrix[y][x] = null;
    draw();
  });

  overlay.querySelector("#pe-random").addEventListener("click", () => {
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        matrix[y][x] = Math.random() < 0.5 ? null : PALETTE[Math.floor(Math.random() * PALETTE.length)];
      }
    }
    draw();
  });

  overlay.querySelector("#pe-save").addEventListener("click", () => {
    onSave(matrix.map((row) => row.slice()));
    close();
  });

  function close() {
    overlay.remove();
    document.removeEventListener("mouseup", () => { drawing = false; });
  }

  overlay.querySelector(".pe-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
  });

  draw();
}
