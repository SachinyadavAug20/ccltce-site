const PAL = { D: "#0d241f", T: "#2a7a68", C: "#f8edd0", E: "#04100c" };

const MAPS = {
  fish: [
    "..........DDDD",
    ".D.......DTTTTD",
    ".DD......DTTTTTTD",
    ".DDDD.DCCTTTTTTTTD",
    ".DDDDDTTTTTTTTTTCD",
    ".DDDD.DTTTTTTTTD",
    ".DD......DTTTTTD",
    ".D.......DTTTTD",
    "..........DDDD",
  ],
  shark: [
    "..........DDDD",
    "....DD...DDTTD",
    "....DDD.DTTTTTD",
    ".DDDDDDTTTTTTTTD",
    "DDDDDTTTTTTTTTTCE",
    ".DDDDDDTTTTTTTTD",
    "....DDD...DTTTTD",
    "..........DDTTDD",
    "...........DDD",
  ],
  whale: [
    "DD......................",
    ".DD........DDDDDDDD",
    "..DDDD.....DTTTTTTTTDD",
    "...DDD....DTTTTTTTTTTTT",
    "...DDDDDDTTTTTTTTTTTTTTD",
    "....DDDTTTTTTTTTTCCTTTTD",
    "...DDDDDTTTTTTTCCCCTTTTD",
    "..DDDD..DTTCCCCCCCTTTTD",
    ".DD......DTTCCCCCCCTTD",
    "DD........DDDDDDDDDD",
  ],
  boat: [
    "....DD........DD....",
    "...DCDD......DCDD...",
    "...DCCCD....DCCCD...",
    "....DCCCCCCCCDD",
    "....DCCCCCCCCCD",
    "...DCCECCCCECCD",
    "....DCCCCCCCCD",
    ".....DCCCCCCD",
    "....DCCCCCCCCCDD",
    "..DDCCCCCCCCCCCD",
    ".TTTTTTTTTTTTTTTT.",
    "TTTTTTTTTTTTTTTTTT",
    ".TTTTTTTTTTTTTTT.",
    "...TTTTTTTTTTT...",
  ],
};

function bake(rows, extra) {
  const w = Math.max(...rows.map((r) => r.length));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = rows.length;
  const x = c.getContext("2d");
  rows.forEach((r, i) =>
    [...r.padEnd(w, ".")].forEach((ch, j) => {
      if (PAL[ch]) {
        x.fillStyle = PAL[ch];
        x.fillRect(j, i, 1, 1);
      }
    })
  );
  if (extra) extra(x, c);
  return c;
}

function bakeRing() {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const x = c.getContext("2d");
  x.strokeStyle = "#58c8af";
  x.lineWidth = 2;
  x.beginPath();
  x.arc(16, 16, 14, 0, Math.PI * 2);
  x.stroke();
  return c;
}

function bakeBubble() {
  const c = document.createElement("canvas");
  c.width = c.height = 6;
  const x = c.getContext("2d");
  x.strokeStyle = "rgba(88,200,175,.9)";
  x.fillStyle = "rgba(88,200,175,.25)";
  x.beginPath();
  x.arc(3, 3, 2.2, 0, Math.PI * 2);
  x.fill();
  x.stroke();
  return c;
}

export function buildTextures(THREE) {
  const out = {};
  for (const [name, rows] of Object.entries(MAPS)) {
    const tex = new THREE.CanvasTexture(bake(rows));
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    out[name] = {
      tex,
      w: Math.max(...rows.map((r) => r.length)),
      h: rows.length,
    };
  }
  for (const [name, canvas] of [
    ["ring", bakeRing()],
    ["bubble", bakeBubble()],
  ]) {
    const tex = new THREE.CanvasTexture(canvas);
    out[name] = { tex, w: canvas.width, h: canvas.height };
  }
  return out;
}
