// ASCII music visualiser helpers.
// The shader walks 32 spectrum bands and turns them into a bar row that
// rises from the bottom edge of the scene, plus a musical aurora curtain.
export const VIZ_GLSL = `
// spectrum value of the column (0..1)
float vizBandValue(vec2 p, float sceneW) {
  float bx = clamp((p.x + 0.5 * sceneW) / sceneW, 0.0, 0.999);
  int bi = int(bx * 31.0);
  float bar = 0.0;
  for (int i = 0; i < 32; i++) {
    if (i == bi) bar = uSpec[i];
  }
  return bar;
}

// x position of the cell inside its spectrum band (0..1)
float vizBandPos(vec2 p, float sceneW) {
  float bx = clamp((p.x + 0.5 * sceneW) / sceneW, 0.0, 0.999);
  return fract(bx * 32.0);
}

// height of the bar for this column, in scene units
float vizTop(vec2 p, float sceneW, float sceneH) {
  return -0.5 * sceneH + 0.35 + vizBandValue(p, sceneW) * sceneH * VIZH;
}

// shimmering aurora above the bars, driven by the same spectrum
float vizAurora(vec2 p, float sceneW, float sceneH, float t, float vBase, float bval) {
  float top = vBase + bval * sceneH * VIZH;
  float above = p.y - top;
  float h = sceneH * 0.09;
  if (above < 0.0 || above > h) return 0.0;
  float fall = 1.0 - smoothstep(0.0, h, above);
  float curt = fbm(vec2(p.x * 0.30, above * 0.9 - t * 0.7), 3) * 0.5 + 0.5;
  float ripple = 0.5 + 0.5 * sin(p.x * 0.55 - t * 1.6 + above * 1.2);
  return fall * (0.30 + 0.70 * curt) * (0.35 + 0.65 * bval) * (0.55 + 0.45 * ripple);
}
`;
