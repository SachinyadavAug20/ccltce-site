// 3D Minecraft mobs — union of boxes, sway + bob, orthographic ray.
// Requires CREATURES_GLSL (LIGHT_DIR, VIEW_DIR, bHash, creeperMask) first.
export const MOBS_GLSL = `
float mBox(vec3 ro, vec3 rd, vec3 c, vec3 h, out vec3 n) {
  vec3 i2 = 1.0 / rd;
  vec3 a = (c - h - ro) * i2, b = (c + h - ro) * i2;
  vec3 tn = min(a, b), tf = max(a, b);
  float tN = max(max(tn.x, tn.y), tn.z);
  float tF = min(min(tf.x, tf.y), tf.z);
  if (tN > tF || tF < 0.0) return -1.0;
  n = tn.x >= tn.y && tn.x >= tn.z ? vec3(rd.x > 0.0 ? -1.0 : 1.0, 0.0, 0.0)
    : tn.y >= tn.z ? vec3(0.0, rd.y > 0.0 ? -1.0 : 1.0, 0.0)
    : vec3(0.0, 0.0, rd.z > 0.0 ? -1.0 : 1.0);
  return tN;
}

#define TRY(C, H, P) r = mBox(o2, rdO, C, H, nn); if (r > 0.0 && r < best) { best = r; bn = nn; part = P; }

// kind: 0 creeper, 1 zombie, 2 skeleton, 3 enderman, 4 pig, 5 cow,
// 6 sheep, 7 slime, 8 chicken, 9 wolf, 10 villager, 11 spider
vec4 eval3DMob(vec2 q, float t, float kind, out vec3 outColor) {
  outColor = vec3(0.0);
  float sway = 0.5 * sin(t * 0.5 + kind * 1.9);
  float pit = 0.28 * sin(t * 0.4 + kind * 2.6);
  float cy = cos(sway), sy = sin(sway);
  float cp = cos(pit), sp = sin(pit);
  vec3 ro = vec3(q, -4.0);
  vec3 rd = vec3(0.0, 0.0, 1.0);
  vec3 o1 = vec3(cy * ro.x - sy * ro.z, ro.y, sy * ro.x + cy * ro.z);
  vec3 o2 = vec3(o1.x, cp * o1.y + sp * o1.z, -sp * o1.y + cp * o1.z);
  vec3 d1 = vec3(cy * rd.x - sy * rd.z, rd.y, sy * rd.x + cy * rd.z);
  vec3 rdO = vec3(d1.x, cp * d1.y + sp * d1.z, -sp * d1.y + cp * d1.z) + vec3(1e-6);

  float best = 1e9, part = -1.0, r;
  vec3 bn = vec3(0.0, 0.0, 1.0), nn;

  if (kind < 0.5) { // creeper
    TRY(vec3(0.0, 1.0, 0.0), vec3(0.38), 0.0)
    TRY(vec3(0.0, 0.35, 0.0), vec3(0.30, 0.35, 0.22), 1.0)
    TRY(vec3(-0.16, -0.15, 0.14), vec3(0.12, 0.18, 0.10), 2.0)
    TRY(vec3(0.16, -0.15, 0.14), vec3(0.12, 0.18, 0.10), 2.0)
    TRY(vec3(-0.16, -0.15, -0.14), vec3(0.12, 0.18, 0.10), 2.0)
    TRY(vec3(0.16, -0.15, -0.14), vec3(0.12, 0.18, 0.10), 2.0)
  } else if ((kind > 0.5 && kind < 3.5) || (kind > 9.5 && kind < 10.5)) { // humanoids
    float hh = kind > 2.5 && kind < 3.5 ? 1.7 : kind > 9.5 ? 1.1 : 1.15;
    float hs = kind > 2.5 && kind < 3.5 ? 1.5 : 1.0;
    TRY(vec3(0.0, hh, 0.0), vec3(0.26 * hs), 0.0)
    TRY(vec3(0.0, hh - 0.6 * hs, 0.0), vec3(0.30 * hs, 0.32 * hs, 0.17 * hs), 1.0)
    TRY(vec3(-0.40 * hs, hh - 0.58 * hs, 0.0), vec3(0.11 * hs, 0.30 * hs, 0.11 * hs), 3.0)
    TRY(vec3(0.40 * hs, hh - 0.58 * hs, 0.0), vec3(0.11 * hs, 0.30 * hs, 0.11 * hs), 3.0)
    TRY(vec3(-0.15 * hs, hh - 1.2 * hs, 0.0), vec3(0.13 * hs, 0.30 * hs, 0.13 * hs), 2.0)
    TRY(vec3(0.15 * hs, hh - 1.2 * hs, 0.0), vec3(0.13 * hs, 0.30 * hs, 0.13 * hs), 2.0)
    if (kind > 9.5) TRY(vec3(0.0, hh - 0.06, 0.30), vec3(0.07, 0.11, 0.09), 4.0) // villager nose
  } else if ((kind > 3.5 && kind < 7.0) || (kind > 8.5 && kind < 9.5)) { // quadrupeds
    float big = kind > 4.5 && kind < 6.5 ? 1.25 : 1.0;
    float len = kind > 8.5 ? 0.40 : 0.52 * big;
    TRY(vec3(0.0, 0.55 * big, 0.0), vec3(0.30 * big, 0.27 * big, len), 1.0)
    TRY(vec3(0.0, 0.70 * big, len + 0.16), vec3(0.23 * big, 0.21 * big, 0.19 * big), 0.0)
    if (kind < 4.5) TRY(vec3(0.0, 0.66, len + 0.36), vec3(0.10, 0.08, 0.07), 4.0) // pig snout
    float lx = 0.18 * big, lz = len - 0.14;
    TRY(vec3(-lx, 0.13, lz), vec3(0.08, 0.14, 0.08), 2.0)
    TRY(vec3(lx, 0.13, lz), vec3(0.08, 0.14, 0.08), 2.0)
    TRY(vec3(-lx, 0.13, -lz), vec3(0.08, 0.14, 0.08), 2.0)
    TRY(vec3(lx, 0.13, -lz), vec3(0.08, 0.14, 0.08), 2.0)
  } else if (kind > 6.5 && kind < 7.5) { // slime
    TRY(vec3(0.0, 0.5, 0.0), vec3(0.45), 0.0)
  } else if (kind > 7.5 && kind < 8.5) { // chicken
    TRY(vec3(0.0, 0.50, 0.0), vec3(0.18, 0.20, 0.24), 1.0)
    TRY(vec3(0.0, 0.80, 0.14), vec3(0.12), 0.0)
    TRY(vec3(0.0, 0.76, 0.30), vec3(0.05, 0.04, 0.08), 4.0)
    TRY(vec3(-0.08, 0.13, 0.06), vec3(0.04, 0.14, 0.04), 2.0)
    TRY(vec3(0.08, 0.13, 0.06), vec3(0.04, 0.14, 0.04), 2.0)
  } else { // spider
    TRY(vec3(0.0, 0.42, -0.28), vec3(0.34, 0.24, 0.34), 1.0)
    TRY(vec3(0.0, 0.42, 0.30), vec3(0.22, 0.18, 0.18), 0.0)
    for (int s = 0; s < 2; s++) {
      float sx = s == 0 ? -1.0 : 1.0;
      for (int lz = 0; lz < 4; lz++) {
        float zz = -0.45 + float(lz) * 0.30;
        TRY(vec3(sx * 0.62, 0.50 - mod(float(lz), 2.0) * 0.14, zz), vec3(0.34, 0.03, 0.05), 2.0)
      }
    }
  }

  if (best > 1e8) return vec4(0.0);
  vec3 pos = o2 + rdO * best;
  float ry = cp * bn.y - sp * bn.z;
  float rz = sp * bn.y + cp * bn.z;
  vec3 wN = normalize(vec3(cy * bn.x + sy * rz, ry, -sy * bn.x + cy * rz));
  vec3 base;

  if (kind < 0.5) { // creeper
    if (part < 0.5) {
      base = mix(vec3(0.30,0.62,0.24), vec3(0.46,0.76,0.33), bHash(floor(pos.xy * 6.0)));
      if (bn.z < -0.5 && creeperMask(vec2(pos.x, pos.y - 1.0) / 0.38) > 0.5) base = vec3(0.02,0.03,0.02);
    } else base = part < 1.5 ? vec3(0.34,0.66,0.27) : vec3(0.27,0.54,0.21);
  } else if (kind < 1.5) { // zombie
    if (part < 0.5) { base = vec3(0.36,0.65,0.32); if (bn.z < -0.5 && abs(abs(pos.x) - 0.12) < 0.06 && abs(pos.y - 1.22) < 0.055) base = vec3(0.06,0.08,0.10); }
    else base = part < 1.5 ? vec3(0.30,0.35,0.22) : part < 2.5 ? vec3(0.22,0.22,0.26) : vec3(0.36,0.65,0.32);
  } else if (kind < 2.5) { // skeleton
    if (part < 0.5) { base = vec3(0.86,0.86,0.82); if (bn.z < -0.5 && abs(abs(pos.x) - 0.11) < 0.07 && abs(pos.y - 1.22) < 0.06) base = vec3(0.10,0.10,0.12); }
    else base = part < 1.5 ? vec3(0.72,0.72,0.70) : part < 2.5 ? vec3(0.80,0.80,0.78) : vec3(0.84,0.84,0.80);
  } else if (kind < 3.5) { // enderman
    if (part < 0.5) { base = vec3(0.05,0.05,0.06); if (bn.z < -0.5 && abs(abs(pos.x) - 0.17) < 0.07 && abs(pos.y - 1.82) < 0.055) base = vec3(0.85,0.25,0.78); }
    else base = part < 1.5 ? vec3(0.08,0.08,0.09) : part < 2.5 ? vec3(0.05,0.05,0.06) : vec3(0.06,0.06,0.07);
  } else if (kind < 4.5) { // pig
    base = part < 0.5 ? vec3(0.94,0.64,0.62) : part < 1.5 ? vec3(0.92,0.60,0.58) : part < 2.5 ? vec3(0.80,0.48,0.46) : vec3(0.85,0.50,0.55);
  } else if (kind < 5.5) { // cow
    if (part < 0.5) base = bHash(floor(pos.xy * 7.0)) > 0.6 ? vec3(0.90,0.88,0.84) : vec3(0.35,0.24,0.16);
    else if (part < 1.5) base = bHash(floor(pos.xz * 5.0)) > 0.55 ? vec3(0.92,0.90,0.86) : vec3(0.36,0.25,0.17);
    else base = part < 2.5 ? vec3(0.30,0.22,0.15) : vec3(0.38,0.27,0.18);
  } else if (kind < 6.5) { // sheep
    base = part < 0.5 ? vec3(0.92,0.72,0.65) : part < 1.5 ? vec3(0.93,0.93,0.90) : part < 2.5 ? vec3(0.75,0.75,0.72) : vec3(0.88,0.88,0.85);
  } else if (kind < 7.5) { // slime
    base = vec3(0.35,0.80,0.35);
    if (bn.z < -0.5) {
      if (abs(abs(pos.x) - 0.16) < 0.07 && abs(pos.y - 0.62) < 0.07) base = vec3(0.05,0.20,0.05);
      if (abs(pos.y - 0.38) < 0.06 && abs(pos.x) < 0.24) base = vec3(0.05,0.20,0.05);
    }
  } else if (kind < 8.5) { // chicken
    base = part < 0.5 ? vec3(0.92,0.92,0.90) : part < 1.5 ? vec3(0.94,0.94,0.92) : part < 2.5 ? vec3(0.85,0.85,0.82) : vec3(0.95,0.70,0.20);
  } else if (kind < 9.5) { // wolf
    base = part < 0.5 ? vec3(0.65,0.63,0.60) : part < 1.5 ? vec3(0.58,0.56,0.53) : part < 2.5 ? vec3(0.50,0.48,0.45) : vec3(0.62,0.60,0.57);
  } else if (kind < 10.5) { // villager
    if (part < 0.5) { base = vec3(0.72,0.55,0.40); if (bn.z < -0.5 && abs(abs(pos.x) - 0.12) < 0.06 && abs(pos.y - 1.22) < 0.055) base = vec3(0.35,0.22,0.12); }
    else base = part < 1.5 ? vec3(0.45,0.30,0.20) : part < 2.5 ? vec3(0.35,0.22,0.14) : part < 3.5 ? vec3(0.72,0.55,0.40) : vec3(0.78,0.62,0.46);
  } else { // spider
    if (part < 0.5) { base = vec3(0.22,0.18,0.18); if (bn.z < -0.5 && abs(abs(pos.x) - 0.10) < 0.06 && abs(pos.y - 0.48) < 0.05) base = vec3(0.85,0.10,0.10); }
    else base = part < 1.5 ? vec3(0.28,0.23,0.23) : vec3(0.18,0.15,0.15);
  }

  float diff = max(dot(wN, LIGHT_DIR), 0.0);
  float fill = max(dot(wN, vec3(0.18, 0.30, -0.94)), 0.0); // camera-side fill so front faces read
  float li = diff * 0.50 + fill * 0.72;
  outColor = base * (0.66 + 0.50 * li);
  outColor += base * pow(1.0 - max(dot(wN, VIEW_DIR), 0.0), 3.0) * 0.18;
  return vec4(1.0, clamp(0.62 + li * 0.45, 0.14, 1.0), 0.0, 0.0);
}
`;
