// 3D Minecraft blocks: spinning cubes with per-kind face textures.
export const CREATURES_GLSL = `
const vec3 LIGHT_DIR = vec3(-0.32, 0.78, 0.53);
const vec3 VIEW_DIR  = vec3(0.0, 0.0, 1.0);

float bHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// Classic creeper face on an 8x8 grid, uv in [-1,1]; eyes top, fangs bottom
float creeperMask(vec2 uv) {
  vec2 g = floor((vec2(uv.x, -uv.y) + 1.0) * 4.0);
  if (g.y <= 2.0 && ((g.x >= 1.0 && g.x <= 2.0) || (g.x >= 5.0 && g.x <= 6.0))) return 1.0;
  if (g.y == 3.0 && g.x >= 3.0 && g.x <= 4.0) return 1.0;
  if ((g.y == 4.0 || g.y == 5.0) && g.x >= 2.0 && g.x <= 5.0) return 1.0;
  if (g.y >= 6.0 && (g.x == 2.0 || g.x == 5.0)) return 1.0;
  return 0.0;
}

// kind: 0 grass, 1 stone, 2 gold ore, 3 redstone ore, 4 emerald ore, 5 creeper, 6 TNT
vec3 blockTex(float kind, float faceId, vec3 pos) {
  vec2 uv;
  if (faceId < 1.5) uv = pos.yz;
  else if (faceId < 3.5) uv = pos.xz;
  else uv = pos.xy;
  vec2 cell = floor((uv + 1.0) * 4.0);
  float n = bHash(cell + kind * 17.0);
  vec3 c;
  if (kind < 0.5) {
    if (faceId == 2.0) c = mix(vec3(0.28,0.55,0.18), vec3(0.42,0.68,0.26), n);
    else if (faceId == 3.0) c = mix(vec3(0.42,0.30,0.18), vec3(0.52,0.38,0.24), n);
    else {
      c = mix(vec3(0.48,0.36,0.22), vec3(0.58,0.44,0.28), n);
      if (uv.y > 0.62) c = mix(vec3(0.28,0.55,0.18), vec3(0.42,0.68,0.26), n);
    }
  } else if (kind < 1.5) {
    c = mix(vec3(0.42,0.42,0.42), vec3(0.56,0.56,0.56), n);
  } else if (kind < 2.5) {
    c = mix(vec3(0.42,0.42,0.42), vec3(0.56,0.56,0.56), n);
    if (n > 0.78) c = mix(vec3(0.95,0.62,0.05), vec3(1.0,0.85,0.30), n);
  } else if (kind < 3.5) {
    c = mix(vec3(0.42,0.42,0.42), vec3(0.56,0.56,0.56), n);
    if (n > 0.78) c = mix(vec3(0.75,0.05,0.05), vec3(1.0,0.25,0.20), n);
  } else if (kind < 4.5) {
    c = mix(vec3(0.42,0.42,0.42), vec3(0.56,0.56,0.56), n);
    if (n > 0.78) c = mix(vec3(0.05,0.70,0.30), vec3(0.35,1.0,0.55), n);
  } else if (kind < 5.5) {
    c = mix(vec3(0.22,0.50,0.16), vec3(0.40,0.68,0.26), n);
    if (faceId == 4.0 && creeperMask(uv) > 0.5) c = vec3(0.02,0.03,0.02);
  } else {
    if (abs(uv.y) < 0.32) {
      c = vec3(0.90,0.90,0.88);
      if (abs(uv.y) < 0.22 && step(0.5, fract(uv.x * 3.0 + 0.25)) > 0.5) c = vec3(0.12,0.10,0.10);
    } else c = mix(vec3(0.62,0.10,0.08), vec3(0.78,0.18,0.14), n);
  }
  c *= 1.0 - step(0.88, max(abs(uv.x), abs(uv.y))) * 0.35;
  return c;
}

// Orthographic ray vs unit cube, tumbling with time.
vec4 eval3DBlock(vec2 q, float t, float kind, out vec3 outColor) {
  outColor = vec3(0.0);
  float yaw = t * 0.7 + kind * 2.1;
  float pit = 0.45 + 0.35 * sin(t * 0.45 + kind * 1.3);
  float cy = cos(yaw), sy = sin(yaw);
  float cp = cos(pit), sp = sin(pit);

  vec3 ro = vec3(q, -5.0);
  vec3 rd = vec3(0.0, 0.0, 1.0);
  vec3 o1 = vec3(cy * ro.x - sy * ro.z, ro.y, sy * ro.x + cy * ro.z);
  vec3 o2 = vec3(o1.x, cp * o1.y + sp * o1.z, -sp * o1.y + cp * o1.z);
  vec3 d1 = vec3(cy * rd.x - sy * rd.z, rd.y, sy * rd.x + cy * rd.z);
  vec3 d2 = vec3(d1.x, cp * d1.y + sp * d1.z, -sp * d1.y + cp * d1.z) + vec3(1e-5);

  vec3 inv = 1.0 / d2;
  vec3 ta = (-1.0 - o2) * inv;
  vec3 tb = ( 1.0 - o2) * inv;
  vec3 tn = min(ta, tb), tf = max(ta, tb);
  float tN = max(max(tn.x, tn.y), tn.z);
  float tF = min(min(tf.x, tf.y), tf.z);
  if (tN > tF || tF < 0.0) return vec4(0.0);

  vec3 pos = o2 + d2 * max(tN, 0.0);
  vec3 nO;
  if (tN == tn.x) nO = vec3(pos.x > 0.0 ? 1.0 : -1.0, 0.0, 0.0);
  else if (tN == tn.y) nO = vec3(0.0, pos.y > 0.0 ? 1.0 : -1.0, 0.0);
  else nO = vec3(0.0, 0.0, pos.z > 0.0 ? 1.0 : -1.0);

  float faceId = nO.x != 0.0 ? (nO.x > 0.0 ? 0.0 : 1.0)
              : nO.y != 0.0 ? (nO.y > 0.0 ? 2.0 : 3.0)
              : (nO.z > 0.0 ? 4.0 : 5.0);

  float ry = cp * nO.y - sp * nO.z;
  float rz = sp * nO.y + cp * nO.z;
  vec3 wN = vec3(cy * nO.x + sy * rz, ry, -sy * nO.x + cy * rz);

  float diff = max(dot(wN, LIGHT_DIR), 0.0);
  vec3 base = blockTex(kind, faceId, pos);
  outColor = base * (0.38 + 0.62 * diff);
  outColor += base * pow(1.0 - max(dot(wN, VIEW_DIR), 0.0), 3.0) * 0.18;
  float lum = clamp(0.30 + diff * 0.65, 0.05, 1.0);
  return vec4(1.0, lum, 0.0, 0.0);
}
`;
