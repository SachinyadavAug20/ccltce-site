// Minecraft scene: 3D mobs roaming the hero band (top of viewport) over ASCII water.
export const SWIM_GLSL = `
// Returns vec4(isHit, lum, halo, unused); mobs drift across the hero section.
vec4 evalMarineLife(vec2 p, float t, out vec3 outColor) {
  float W = uSceneW;
  float surf = 0.5 * uSceneH;
  float S = (1.0 - VIZH) * uSceneH;

  vec4 bestHit = vec4(0.0);
  vec3 bestCol = vec3(0.0);
  float haloAccum = 0.0;
  const float MY = 0.85; // mob local centre (feet near -0.4, head up to ~2.1)

  // 24 Minecraft mobs across the water column (12 extra fill the page depths)
  for (int i = 0; i < 24; i++) {
    float fi = float(i);
    float kind = mod(fi, 12.0);
    float depth = 0.10;
    float scale = 0.11;
    float speed = 3.0;
    float phase = 0.0;
    float bob = 0.03;

    if (i == 0) { // creeper
      depth = 0.18; scale = 0.115; speed = 3.2; phase = -W * 0.20;
    } else if (i == 1) { // zombie
      depth = 0.34; scale = 0.105; speed = -2.6; phase = W * 0.45; bob = 0.05;
    } else if (i == 2) { // skeleton
      depth = 0.12; scale = 0.105; speed = 2.8; phase = -W * 0.55;
    } else if (i == 3) { // enderman — tall
      depth = 0.46; scale = 0.095; speed = -2.2; phase = W * 0.10; bob = 0.02;
    } else if (i == 4) { // pig
      depth = 0.56; scale = 0.10; speed = 3.6; phase = -W * 0.35;
    } else if (i == 5) { // cow
      depth = 0.66; scale = 0.10; speed = -3.0; phase = W * 0.70;
    } else if (i == 6) { // sheep
      depth = 0.74; scale = 0.10; speed = 3.4; phase = -W * 0.75; bob = 0.04;
    } else if (i == 7) { // slime — bouncy
      depth = 0.26; scale = 0.10; speed = -3.4; phase = W * 0.25; bob = 0.09;
    } else if (i == 8) { // chicken — fast, near surface
      depth = 0.07; scale = 0.085; speed = 5.2; phase = -W * 0.65;
    } else if (i == 9) { // wolf
      depth = 0.60; scale = 0.09; speed = 4.4; phase = W * 0.40;
    } else if (i == 10) { // villager
      depth = 0.42; scale = 0.105; speed = -2.4; phase = -W * 0.05;
    } else if (i == 11) { // spider — wide
      depth = 0.52; scale = 0.10; speed = 3.8; phase = W * 0.85; bob = 0.02;
    } else if (i == 12) { // second wave: far herd lower on the page
      depth = 0.86; scale = 0.080; speed = 2.5; phase = W * 0.30;
    } else if (i == 13) {
      depth = 0.96; scale = 0.075; speed = -3.2; phase = -W * 0.48; bob = 0.05;
    } else if (i == 14) {
      depth = 0.82; scale = 0.082; speed = -2.7; phase = W * 0.60;
    } else if (i == 15) {
      depth = 0.30; scale = 0.078; speed = 4.0; phase = -W * 0.88; bob = 0.06;
    } else if (i == 16) {
      depth = 0.58; scale = 0.078; speed = -3.6; phase = W * 0.18; bob = 0.07;
    } else if (i == 17) {
      depth = 0.70; scale = 0.076; speed = 4.6; phase = -W * 0.28;
    } else if (i == 18) { // third wave: mid-column fillers, new kinds 6..11
      depth = 0.48; scale = 0.074; speed = -4.2; phase = W * 0.52; bob = 0.06;
    } else if (i == 19) {
      depth = 0.88; scale = 0.072; speed = 3.1; phase = -W * 0.12;
    } else if (i == 20) {
      depth = 0.22; scale = 0.075; speed = -4.8; phase = W * 0.78; bob = 0.08;
    } else if (i == 21) {
      depth = 0.64; scale = 0.070; speed = 3.9; phase = -W * 0.62; bob = 0.03;
    } else if (i == 22) {
      depth = 0.94; scale = 0.068; speed = -2.9; phase = W * 0.05;
    } else {
      depth = 0.36; scale = 0.073; speed = 4.9; phase = -W * 0.90; bob = 0.05;
    }

    float sc = max(scale * S, 0.001);
    float margin = 3.0 * sc; // wide mobs (spider/enderman) fully off-screen before wrap
    float span = W + 2.0 * margin;
    float cx = mod(phase + t * speed + W * 0.5 + margin, span) - W * 0.5 - margin;
    float cy = surf - depth * S + sin(t * 1.1 + float(i) * 1.7) * (bob * S);

    // Cursor interactivity: mobs shy away from the pointer torch
    vec2 mp2 = (uMouse - 0.5) * uRes / uCellH;
    vec2 away = vec2(cx, cy) - mp2;
    float aDist = length(away);
    if (uMouseOn > 0.01 && aDist < 34.0) {
      float push = exp(-aDist * 0.09) * 16.0 * uMouseOn;
      vec2 dirn = away / max(aDist, 0.001);
      cx += dirn.x * push;
      cy += dirn.y * push;
    }

    vec2 dq = (p - vec2(cx, cy)) / sc - vec2(0.0, MY);

    float dApprox = length(dq);
    if (dApprox < 3.0) {
      haloAccum += exp(-dApprox * 2.2) * 0.15;
      vec3 hitCol = vec3(0.0);
      vec4 hit = eval3DMob(dq, t + float(i) * 3.7, kind, hitCol);
      if (hit.x > 0.5) {
        vec3 depthFog = vec3(0.045, 0.045, 0.045);
        hitCol = mix(hitCol, depthFog, depth * 0.30);
        bestHit = hit;
        bestCol = hitCol;
        break;
      }
    }
  }

  outColor = bestCol;
  return vec4(bestHit.x, bestHit.y, clamp(haloAccum, 0.0, 1.0), bestHit.w);
}

// Buoyant rising XP-orb bubbles (experience orbs vibe)
float eval3DBubbles(vec2 p, float t) {
  float W = uSceneW;
  float H = uSceneH;
  float bubbleHit = 0.0;

  for (int b = 0; b < 7; b++) {
    float bx = (float(b) * 0.14 - 0.42) * W;
    float seed = float(b) * 8.31;
    float riseSpeed = 3.2 + mod(seed, 2.2);
    float by = mod(-0.5 * H + t * riseSpeed + seed * 6.0, H) - 0.5 * H;
    float bSway = sin(by * 0.30 + t * 2.2 + seed) * 1.5;
    vec2 bp = p - vec2(bx + bSway, by);
    float dist = length(bp);
    if (dist < 1.2) bubbleHit = max(bubbleHit, 1.0 - dist / 1.2);
  }
  return bubbleHit;
}
`;
