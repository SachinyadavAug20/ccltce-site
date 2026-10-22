// Creature placement: eight swimmers drift through the water above the bars.
export const SWIM_GLSL = `
// returns .x = signed distance, .y = eye mask, .z = kind
vec3 sceneCrit(vec2 p, float t) {
  float W = uSceneW;
  float surf = 0.5 * uSceneH;
  float S = (1.0 - VIZH) * uSceneH;
  float best = 1e9, eye = 0.0, id = -1.0;

  for (int i = 0; i < 8; i++) {
    float depth = 0.30, scale = 0.12, speed = 4.0, dir = 1.0, ang = 0.0, phase = 0.0;
    if (i == 0) { depth = 0.08; scale = 0.14; speed =  7.0; dir =  1.0; ang =  0.05; phase = -W * 0.25; }
    if (i == 1) { depth = 0.24; scale = 0.16; speed = -9.0; dir = -1.0; ang = -0.05; phase =  W * 0.30; }
    if (i == 2) { depth = 0.40; scale = 0.19; speed =  3.6; dir =  1.0; ang =  0.03; phase = -W * 0.45; }
    if (i == 3) { depth = 0.60; scale = 0.22; speed = -2.4; dir = -1.0; ang = -0.02; phase =  W * 0.15; }
    if (i == 4) { depth = 0.16; scale = 0.15; speed =  4.4; dir =  1.0; ang =  0.00; phase =  W * 0.62; }
    if (i == 5) { depth = 0.76; scale = 0.17; speed =  5.2; dir =  1.0; ang =  0.04; phase = -W * 0.70; }
    if (i == 6) { depth = 0.88; scale = 0.20; speed = -5.6; dir = -1.0; ang = -0.04; phase =  W * 0.80; }
    if (i == 7) { depth = 0.48; scale = 0.13; speed = -6.4; dir = -1.0; ang =  0.02; phase = -W * 0.05; }

    float cx = mod(phase + t * speed + W * 0.5, W) - W * 0.5;
    float cy = surf - depth * S;
    float sc = max(scale * S, 0.001);
    vec2 q = p - vec2(cx, cy);
    float ca = cos(-ang), sa = sin(-ang);
    q = vec2(ca * q.x - sa * q.y, sa * q.x + ca * q.y);
    q.x *= dir;
    vec3 sh = (i == 0 || i == 1 || i == 5 || i == 7) ? fishShape(q / sc)
            : (i == 2) ? sharkShape(q / sc)
            : (i == 3) ? whaleShape(q / sc)
            : jellyShape(q / sc, t);
    float d = sh.x * sc;
    if (d < best) { best = d; eye = sh.y; id = float(i); }
  }
  return vec3(best, eye, id);
}
`;