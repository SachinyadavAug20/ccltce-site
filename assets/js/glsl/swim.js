// 3D Marine Life Scene: Coordinates multiple 3D swimmers with depth layering and realistic motion.
export const SWIM_GLSL = `
// Evaluates all 3D swimmers at point p
// Populates outColor and returns vec4(isHit, lum, halo, depthZ)
vec4 evalMarineLife(vec2 p, float t, out vec3 outColor) {
  float W = uSceneW;
  float surf = 0.5 * uSceneH;
  float S = (1.0 - VIZH) * uSceneH;

  vec4 bestHit = vec4(0.0);
  vec3 bestCol = vec3(0.0);
  float closestDist = 1e9;
  float haloAccum = 0.0;

  // 9 Unique 3D Swimmers distributed across all water column depths
  for (int i = 0; i < 9; i++) {
    float depth = 0.30;
    float scale = 0.15;
    float speed = 4.2;
    float dir   = 1.0;
    float ang   = 0.0;
    float phase = 0.0;
    float species = 0.0;
    int type = 0; // 0: 3D Fish, 1: 3D Shark, 2: 3D Jelly, 3: 3D Manta Ray

    if (i == 0) {
      // 0: Amber-Gold Sun Koi (Upper sunlit waters, swimming right)
      depth = 0.22; scale = 0.14; speed = 4.8; dir = 1.0; ang = 0.03; phase = -W * 0.20; species = 0.0; type = 0;
    } else if (i == 1) {
      // 1: 3D Gliding Manta Ray (Upper-mid ocean, gliding gracefully)
      depth = 0.36; scale = 0.19; speed = 3.4; dir = 1.0; ang = 0.02; phase = -W * 0.45; species = 1.0; type = 3;
    } else if (i == 2) {
      // 2: Cyber Turquoise Neon Tetra (Mid pelagic waters, swimming left)
      depth = 0.48; scale = 0.13; speed = -6.0; dir = -1.0; ang = -0.03; phase = W * 0.30; species = 1.0; type = 0;
    } else if (i == 3) {
      // 3: NASA Ultraviolet Deep Angelfish (Mid-lower ocean, swimming right)
      depth = 0.58; scale = 0.15; speed = 3.8; dir = 1.0; ang = 0.04; phase = -W * 0.65; species = 2.0; type = 0;
    } else if (i == 4) {
      // 4: Luminous Coral Jellyfish (Mid ocean, pulsing upward and drifting)
      depth = 0.65; scale = 0.15; speed = -1.5; dir = 1.0; ang = 0.0; phase = W * 0.60; species = 4.0; type = 2;
    } else if (i == 5) {
      // 5: Pelagic Blue Hunter Shark (Deep pelagic trench, patrolling left)
      depth = 0.76; scale = 0.20; speed = -3.0; dir = -1.0; ang = -0.02; phase = W * 0.08; species = 3.0; type = 1;
    } else if (i == 6) {
      // 6: Schooling Minnow A (Surface waters, swimming right)
      depth = 0.12; scale = 0.075; speed = 8.5; dir = 1.0; ang = 0.05; phase = -W * 0.75; species = 1.0; type = 0;
    } else if (i == 7) {
      // 7: Schooling Minnow B (Following Minnow A in formation)
      depth = 0.14; scale = 0.070; speed = 8.5; dir = 1.0; ang = 0.04; phase = -W * 0.75 - 1.8; species = 0.0; type = 0;
    } else {
      // 8: Electric Emerald Deep Swimmer (Lower water column above visualizer)
      depth = 0.84; scale = 0.15; speed = 4.2; dir = 1.0; ang = -0.02; phase = -W * 0.15; species = 1.0; type = 0;
    }

    // World placement
    float cx = mod(phase + t * speed + W * 0.5, W) - W * 0.5;
    float cy = surf - depth * S + sin(t * 1.2 + float(i) * 1.5) * (0.025 * S);
    float sc = max(scale * S, 0.001);

    vec2 q = p - vec2(cx, cy);

    // Rotation & swimming direction flip
    float ca = cos(-ang), sa = sin(-ang);
    q = vec2(ca * q.x - sa * q.y, sa * q.x + ca * q.y);
    q.x *= dir;

    // Approximate distance for ambient halo
    float dApprox = length(q / sc);
    if (dApprox < 1.6) {
      haloAccum += exp(-dApprox * 2.5) * 0.20;
    }

    vec3 hitCol = vec3(0.0);
    vec4 hit = vec4(0.0);

    if (type == 0) {
      hit = eval3DFish(q / sc, t, species, hitCol);
    } else if (type == 1) {
      hit = eval3DShark(q / sc, t, species, hitCol);
    } else if (type == 2) {
      hit = eval3DJelly(q / sc, t, species, hitCol);
    } else {
      hit = eval3DMantaRay(q / sc, t, species, hitCol);
    }

    if (hit.x > 0.5) {
      // Atmospheric depth fog & Rayleigh scattering
      vec3 waterFog = vec3(0.004, 0.022, 0.035);
      hitCol = mix(hitCol, waterFog, depth * 0.32);
      bestHit = hit;
      bestCol = hitCol;
      break; // foreground priority
    }
  }

  outColor = bestCol;
  // returns vec4(hit.x, hit.y (lum), haloAccum, hit.w (eye))
  return vec4(bestHit.x, bestHit.y, clamp(haloAccum, 0.0, 1.0), bestHit.w);
}

// Evaluates buoyant 3D rising bubble columns
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
    if (dist < 1.2) {
      bubbleHit = max(bubbleHit, 1.0 - dist / 1.2);
    }
  }
  return bubbleHit;
}
`;