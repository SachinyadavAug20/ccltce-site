// ASCII sea creatures, drawn as signed distance fields and rasterised into the glyph grid.
// Every shape lives in a local space where the animal faces +x and is roughly 1 unit tall.
export const CREATURES_GLSL = `
float sdEllipse(vec2 p, vec2 r) {
  float k1 = length(p / r);
  float k2 = length(p / (r * r));
  return k1 * (k1 - 1.0) / max(k2, 1e-6);
}

float sdTriangle(vec2 p, vec2 p0, vec2 p1, vec2 p2) {
  vec2 e0 = p1 - p0, e1 = p2 - p1, e2 = p0 - p2;
  vec2 v0 = p - p0, v1 = p - p1, v2 = p - p2;
  vec2 q0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0);
  vec2 q1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0);
  vec2 q2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);
  float s = sign(e0.x * e2.y - e0.y * e2.x);
  vec2 d = min(min(vec2(dot(q0, q0), s * (v0.x * e0.y - v0.y * e0.x)),
                    vec2(dot(q1, q1), s * (v1.x * e1.y - v1.y * e1.x))),
                    vec2(dot(q2, q2), s * (v2.x * e2.y - v2.y * e2.x)));
  return -sqrt(d.x) * sign(d.y);
}

// .x = signed distance (negative inside), .y = eye mask, .z = unused
vec3 fishShape(vec2 q) {
  float d = sdEllipse(q - vec2(0.10, 0.0), vec2(0.55, 0.26));
  d = min(d, sdTriangle(q, vec2(-0.42, -0.20), vec2(-0.42, 0.20), vec2(-0.86, 0.0)));
  d = min(d, sdTriangle(q, vec2(-0.06, 0.13), vec2(0.20, 0.13), vec2(0.06, 0.40)));
  d = min(d, sdTriangle(q, vec2(0.02, -0.13), vec2(0.22, -0.13), vec2(0.10, -0.34)));
  float eye = smoothstep(0.075, 0.035, length(q - vec2(0.40, 0.06)));
  return vec3(d, eye, 0.0);
}

vec3 sharkShape(vec2 q) {
  float d = sdEllipse(q - vec2(0.12, 0.0), vec2(0.92, 0.30));
  d = min(d, sdEllipse(q - vec2(0.78, -0.02), vec2(0.48, 0.20)));
  d = min(d, sdTriangle(q, vec2(-0.72, -0.26), vec2(-0.72, 0.26), vec2(-1.26, 0.0)));
  d = min(d, sdTriangle(q, vec2(-0.14, 0.20), vec2(0.16, 0.20), vec2(-0.02, 0.62)));
  d = min(d, sdTriangle(q, vec2(0.22, -0.12), vec2(0.52, -0.14), vec2(0.36, -0.50)));
  d = min(d, sdTriangle(q, vec2(-0.26, -0.14), vec2(-0.06, -0.14), vec2(-0.14, -0.42)));
  float eye = smoothstep(0.070, 0.030, length(q - vec2(0.72, 0.08)));
  return vec3(d, eye, 0.0);
}

vec3 whaleShape(vec2 q) {
  float d = sdEllipse(q - vec2(0.16, 0.0), vec2(0.98, 0.46));
  d = min(d, sdEllipse(q - vec2(0.76, -0.04), vec2(0.52, 0.38)));
  d = min(d, sdTriangle(q, vec2(-0.78, -0.10), vec2(-0.78, 0.10), vec2(-1.34, -0.46)));
  d = min(d, sdTriangle(q, vec2(-0.78, -0.10), vec2(-0.78, 0.10), vec2(-1.34, 0.46)));
  d = min(d, sdTriangle(q, vec2(0.30, -0.30), vec2(0.62, -0.28), vec2(0.46, -0.62)));
  float eye = smoothstep(0.080, 0.035, length(q - vec2(0.78, 0.16)));
  return vec3(d, eye, 0.0);
}

vec3 jellyShape(vec2 q, float t) {
  float d = sdEllipse(q - vec2(0.0, 0.12), vec2(0.46, 0.40));
  for (int i = -2; i <= 2; i++) {
    float bx = float(i) * 0.16;
    if (abs(q.x - bx) < 0.6) {
      float yy = -0.22 - 0.30 * sin((q.x - bx) * 3.0 + t * 2.0);
      d = min(d, length(q - vec2(bx, yy)) - 0.045);
    }
  }
  return vec3(d, 0.0, 0.0);
}
`;
