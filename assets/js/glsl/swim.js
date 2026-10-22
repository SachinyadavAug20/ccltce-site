// Creature placement: five swimmers drift through the upper water.
export const SWIM_GLSL = `
// returns .x = signed distance, .y = eye mask, .z = kind
vec3 sceneCrit(vec2 p, float t) {
  float W = uSceneW;
  float hy = HY * uSceneH;
  float S = SDEPTH * uSceneH;
  float best = 1e9, eye = 0.0, id = -1.0;

  for (int i = 0; i < 5; i++) {
    float depth = 0.20, scale = 0.12, speed = 4.0, dir = 1.0, ang = 0.0, phase = 0.0;
    if (i == 0) { depth = 0.12; scale = 0.18; speed =  7.0; dir =  1.0; ang =  0.05; phase = -W * 0.25; }
    if (i == 1) { depth = 0.26; scale = 0.22; speed = -9.0; dir = -1.0; ang = -0.05; phase =  W * 0.30; }
    if (i == 2) { depth = 0.44; scale = 0.38; speed =  3.6; dir =  1.0; ang =  0.03; phase = -W * 0.45; }
    if (i == 3) { depth = 0.70; scale = 0.52; speed = -2.4; dir = -1.0; ang = -0.02; phase =  W * 0.15; }
    if (i == 4) { depth = 0.18; scale = 0.19; speed =  4.4; dir =  1.0; ang =  0.00; phase =  W * 0.62; }

    float cx = mod(phase + t * speed + W * 0.5, W) - W * 0.5;
    float cy = hy - depth * S;
    float sc = max(scale * S, 0.001);
    vec2 q = p - vec2(cx, cy);
    float ca = cos(-ang), sa = sin(-ang);
    q = vec2(ca * q.x - sa * q.y, sa * q.x + ca * q.y);
    q.x *= dir;
    vec3 sh = i == 0 ? fishShape(q / sc)
            : i == 1 ? fishShape(q / sc)
            : i == 2 ? sharkShape(q / sc)
            : i == 3 ? whaleShape(q / sc)
            : jellyShape(q / sc, t);
    float d = sh.x * sc;
    if (d < best) { best = d; eye = sh.y; id = float(i); }
  }
  return vec3(best, eye, id);
}
`;
