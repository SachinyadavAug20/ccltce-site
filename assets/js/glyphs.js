// Multi-set glyph atlas: several character palettes packed into one grid.
// Row 0 is the classic density ramp (light -> dense), used for creatures and
// most wave cells; the remaining rows are flavour sets that keep every cell unique.
const RAMP =
  " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

export const GLYPH_COLS = 24;

// Evenly spaced samples keep the ramp ordered by ink coverage.
const spread = (s, n) =>
  Array.from({ length: n }, (_, i) => s[Math.round((i * (s.length - 1)) / (n - 1))]).join("");

export const SETS = [
  " " + "@".repeat(GLYPH_COLS - 1),
  spread(RAMP, GLYPH_COLS),
  "0123456789$#@%&*+-=/\\|<>^",
  "░▒▓█▄▀▌▐─│┌┐└┘├┤┬┴┼",
  "αβγδεζηθικλμνξοπρστυφχψω",
  "λ∆Σ√π∞≈≠≤≥±÷×°·•—…‰",
].map((s) => (s + " ".repeat(GLYPH_COLS)).slice(0, GLYPH_COLS));

export const GLYPH_ROWS = SETS.length;

// Draws every character of every set into one atlas of cellW x cellH pixel cells.
export async function buildGlyphAtlas(cellW, cellH) {
  if (document.fonts && document.fonts.ready) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    } catch {}
  }

  const cv = document.createElement("canvas");
  cv.width = cellW * GLYPH_COLS;
  cv.height = cellH * GLYPH_ROWS;
  const ctx = cv.getContext("2d");

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${Math.round(cellH * 0.86)}px "JetBrains Mono", "DejaVu Sans Mono", monospace`;

  for (let r = 0; r < GLYPH_ROWS; r++) {
    for (let c = 0; c < GLYPH_COLS; c++) {
      const ch = SETS[r][c];
      if (ch === " ") continue;
      ctx.fillText(ch, c * cellW + cellW / 2, r * cellH + cellH / 2 + 1);
    }
  }

  return cv;
}
