// Deterministic Minecraft-style pixel face generator (SVG data URI).
// Same seed (email/id) always produces the same face — like GitHub identicons.
// No build step; pure vanilla. ~9x9 head grid with skin, hair, eyes, mouth, extras.

const SKINS = ["#f9c8a0", "#e8b48a", "#d49a6c", "#b8825a", "#96664a", "#7a5240", "#5c3d2e", "#c68642"];
const HAIRS = ["#2b1b0e", "#3d2314", "#5c3317", "#7f4f24", "#a0522d", "#1a1a1a", "#4a3728", "#696969", "#8b4513", "#2f1810"];
const EYES = ["#3b82f6", "#22c55e", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#14b8a6", "#1f2937", "#78350f"];
const SHIRTS = ["#0e7490", "#166534", "#7c2d12", "#4c1d95", "#9f1239", "#854d0e", "#1e3a8a", "#365314", "#701a75", "#334155"];
const MOUTHS = ["smile", "flat", "open", "grin"];

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function pick(arr, r) {
  return arr[Math.floor(r() * arr.length)];
}

// 9x9 face bitmap helpers — draw on a tiny canvas grid then scale to SVG rects
function buildFace(seedStr) {
  const seed = hashStr(seedStr || "ccltce");
  const r = rng(seed);
  const skin = pick(SKINS, r);
  const skinDark = shade(skin, -28);
  const hair = pick(HAIRS, r);
  const hairDark = shade(hair, -20);
  const eye = pick(EYES, r);
  const shirt = pick(SHIRTS, r);
  const mouth = pick(MOUTHS, r);
  const hasHat = r() < 0.35;
  const hasBeard = r() < 0.25;
  const hasFreckles = r() < 0.2;
  const eyeStyle = r() < 0.5 ? "round" : "pixel";

  // 9 cols x 10 rows (rows 0-8 face, row 9 neck/shirt)
  const G = 9;
  const grid = [];
  for (let y = 0; y < 10; y++) {
    grid[y] = [];
    for (let x = 0; x < G; x++) grid[y][x] = null;
  }

  // face base (rows 1-7, cols 1-7 roughly)
  for (let y = 1; y <= 7; y++) {
    for (let x = 1; x <= 7; x++) {
      grid[y][x] = skin;
    }
  }
  // shade right side of face
  for (let y = 2; y <= 6; y++) {
    grid[y][7] = skinDark;
  }
  // chin shade
  for (let x = 2; x <= 6; x++) grid[7][x] = skinDark;

  // hair — top + sides
  const hairStyle = Math.floor(r() * 4);
  for (let x = 1; x <= 7; x++) grid[0][x] = hair;
  grid[1][1] = hair; grid[1][7] = hair;
  if (hairStyle === 0) {
    // flat top
    for (let x = 1; x <= 7; x++) grid[1][x] = hair;
    grid[2][1] = hair; grid[2][7] = hair;
  } else if (hairStyle === 1) {
    // side swept
    grid[1][2] = hair; grid[1][3] = hair;
    grid[2][1] = hair;
    grid[1][6] = hairDark;
  } else if (hairStyle === 2) {
    // spiky
    grid[0][2] = null; grid[0][6] = null;
    grid[0][1] = hair; grid[0][3] = hair; grid[0][5] = hair; grid[0][7] = hair;
  } else {
    // long sides
    grid[2][1] = hair; grid[2][7] = hair;
    grid[3][1] = hair; grid[3][7] = hair;
  }

  // eyes (row 3-4)
  const eyeY = 3;
  const leftEyeX = 2, rightEyeX = 6;
  if (eyeStyle === "round") {
    grid[eyeY][leftEyeX] = eye; grid[eyeY][rightEyeX] = eye;
    grid[eyeY + 1][leftEyeX] = shade(eye, -40); grid[eyeY + 1][rightEyeX] = shade(eye, -40);
  } else {
    grid[eyeY][leftEyeX] = "#fff"; grid[eyeY][rightEyeX] = "#fff";
    grid[eyeY][leftEyeX + 1] = eye; // hmm may bleed
    // simpler pixel eyes
    grid[eyeY][leftEyeX] = eye; grid[eyeY][rightEyeX] = eye;
    grid[eyeY - 0][leftEyeX + 0] = eye;
  }
  // brows
  if (r() < 0.6) {
    grid[2][leftEyeX] = hairDark; grid[2][rightEyeX] = hairDark;
  }

  // nose
  grid[4][4] = skinDark;

  // mouth
  if (mouth === "smile") {
    grid[5][3] = shade(skin, -60); grid[5][5] = shade(skin, -60);
    grid[6][3] = shade(skin, -60); grid[6][4] = shade(skin, -60); grid[6][5] = shade(skin, -60);
    grid[5][4] = "#5b2c1e";
  } else if (mouth === "flat") {
    grid[5][3] = "#5b2c1e"; grid[5][4] = "#5b2c1e"; grid[5][5] = "#5b2c1e";
  } else if (mouth === "open") {
    grid[5][3] = "#3d1f14"; grid[5][4] = "#3d1f14"; grid[5][5] = "#3d1f14";
    grid[6][3] = "#3d1f14"; grid[6][4] = "#c0392b"; grid[6][5] = "#3d1f14";
  } else {
    // grin
    grid[5][2] = "#5b2c1e"; grid[5][6] = "#5b2c1e";
    grid[6][3] = "#fff"; grid[6][4] = "#fff"; grid[6][5] = "#fff";
  }

  if (hasBeard) {
    for (let x = 2; x <= 6; x++) {
      if (grid[7][x] === skin || grid[7][x] === skinDark) grid[7][x] = hair;
    }
    grid[6][2] = hair; grid[6][6] = hair;
  }

  if (hasFreckles) {
    grid[4][2] = shade(skin, -35); grid[4][6] = shade(skin, -35);
  }

  if (hasHat) {
    const hat = pick(["#7c2d12", "#1e3a8a", "#365314", "#701a75", "#854d0e", "#0f766e"], r);
    for (let x = 0; x <= 8; x++) grid[0][x] = hat;
    grid[0][0] = shade(hat, -30); grid[0][8] = shade(hat, -30);
    if (hairStyle !== 2) {
      grid[1][0] = hat; grid[1][8] = hat;
    }
  }

  // neck / shirt row
  for (let x = 2; x <= 6; x++) grid[9][x] = shirt;
  grid[9][2] = shade(shirt, -25); grid[9][6] = shade(shirt, -25);
  grid[8][2] = skinDark; grid[8][6] = skinDark; // shoulders hint

  return { grid, G, skin, hair, eye, shirt };
}

function shade(hex, amt) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const n = parseInt(c, 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 0xff) + amt, b = (n & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

export function minecraftFace(seed, size) {
  const S = size || 64;
  const { grid, G } = buildFace(seed);
  let rects = "";
  const px = S / G;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < G; x++) {
      const col = grid[y][x];
      if (!col) continue;
      rects += '<rect x="' + (x * px) + '" y="' + (y * px) + '" width="' + px + '" height="' + px + '" fill="' + col + '"/>';
    }
  }
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + " " + S + '" shape-rendering="crispEdges">' +
    '<rect width="' + S + '" height="' + S + '" fill="#1a1a1a"/>' +
    rects +
    "</svg>";
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// small face for nav (pixel-perfect at 28-32px)
export function navFace(seed) {
  return minecraftFace(seed, 40);
}

// render a 16×16 pixel matrix (array of arrays of hex|null) as an SVG data URI
export function pixelMatrixToSvg(matrix, size) {
  const S = size || 128;
  const G = 16;
  const px = S / G;
  let rects = "";
  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      const c = matrix && matrix[y] && matrix[y][x];
      if (!c) continue;
      rects += '<rect x="' + x * px + '" y="' + y * px + '" width="' + px + '" height="' + px + '" fill="' + c + '"/>';
    }
  }
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + " " + S + '" shape-rendering="crispEdges">' +
    '<rect width="' + S + '" height="' + S + '" fill="#1a1a1a"/>' +
    rects +
    "</svg>";
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// parse stored pixel matrix (JSON string or array) → matrix or null
export function parsePixelMatrix(raw) {
  if (!raw) return null;
  try {
    const m = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(m) || m.length !== 16) return null;
    if (!m.every((row) => Array.isArray(row) && row.length === 16)) return null;
    return m;
  } catch { return null; }
}
