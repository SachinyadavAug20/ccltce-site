// 3D Procedural Marine Life: 3D normal estimation, dynamic undulation, fins, eyes, and lighting.
export const CREATURES_GLSL = `
// Light vector (sunlight filtering from surface) & view direction
const vec3 LIGHT_DIR = vec3(-0.32, 0.78, 0.53);
const vec3 VIEW_DIR  = vec3(0.0, 0.0, 1.0);

// Evaluates 3D swimming fish
// Returns vec4(inside, lum, dorsalY, eye) and populates outColor
vec4 eval3DFish(vec2 q, float t, float species, out vec3 outColor) {
  // 3D serpentine swimming undulation along spine
  float wagFreq = 4.6;
  float wagAmp  = 0.14 * smoothstep(0.35, -0.90, q.x);
  float wagPhase = t * wagFreq - q.x * 2.8;
  float wagY = sin(wagPhase) * wagAmp;
  float wagZ = cos(wagPhase) * wagAmp * 0.65;

  vec2 p = q;
  p.y -= wagY;

  // Streamlined teardrop body profile
  float xHead = 0.70;
  float xTail = -0.78;
  float u = (p.x - xTail) / (xHead - xTail); // 0 at peduncle, 1 at snout

  bool inside = false;
  float isFin = 0.0;
  float isEye = 0.0;
  vec3 N = vec3(0.0, 0.0, 1.0);
  float uSpine = clamp(u, 0.0, 1.0);

  // 1. Main 3D Body
  if (u >= 0.0 && u <= 1.0) {
    float bodyH = 0.35 * sin(u * 3.14159) * (0.82 + 0.36 * u);
    float bodyT = 0.22 * sin(u * 3.14159) * (0.82 + 0.36 * u);
    if (abs(p.y) <= bodyH) {
      inside = true;
      float yn = p.y / max(0.001, bodyH);
      float zn = sqrt(max(0.0, 1.0 - yn * yn));
      float z = zn * bodyT;
      // Normal vector derived from body curvature
      float dHdx = 0.35 * cos(u * 3.14159) * 3.14159 * (0.82 + 0.36 * u) / 1.48;
      N = normalize(vec3(-dHdx * yn * 0.35 - wagZ * 0.2, yn, zn));
    }
  }

  // 2. Caudal (Tail) Fin: flared with clean notched fork
  if (p.x < -0.74 && p.x > -1.24) {
    float tv = (-0.74 - p.x) / 0.50; // 0 at base, 1 at tip
    float forkNotch = 1.0 - 0.45 * smoothstep(0.55, 1.0, tv) * (1.0 - smoothstep(0.95, 1.0, tv));
    float finH = (0.07 + 0.38 * tv) * forkNotch;
    if (abs(p.y) <= finH) {
      inside = true;
      isFin = 1.0;
      float fn = p.y / max(0.001, finH);
      float rayPattern = sin(atan(p.y, p.x + 0.74) * 26.0);
      N = normalize(vec3(-0.35 + rayPattern * 0.08, fn * 0.45, 0.82));
    }
  }

  // 3. Dorsal Fin (Top Back)
  if (p.x >= -0.36 && p.x <= 0.12 && p.y > 0.0) {
    float dv = (p.x - (-0.36)) / 0.48;
    float bodyTop = 0.35 * sin(clamp((p.x - xTail) / 1.48, 0.0, 1.0) * 3.14159) * 0.95;
    float finTop  = bodyTop + 0.24 * sin(dv * 3.14159) * (1.0 - 0.35 * dv);
    if (p.y <= finTop && p.y >= bodyTop - 0.04) {
      inside = true;
      isFin = 1.0;
      N = normalize(vec3(0.20, 0.88, 0.42));
    }
  }

  // 4. Pectoral Fin (Side Flap)
  if (!inside && u >= 0.50 && u <= 0.72 && p.y < -0.05 && p.y > -0.30) {
    float pu = (u - 0.50) / 0.22;
    float pecH = 0.18 * sin(pu * 3.14159);
    float flapAngle = sin(t * 5.5 + p.x * 2.0) * 0.12;
    if (p.y < -0.05 && p.y > -0.05 - pecH) {
      inside = true;
      isFin = 1.0;
      N = normalize(vec3(0.25, -0.65, 0.70 + flapAngle));
    }
  }

  // 5. Eye: socket, iris, pupil
  if (inside && u > 0.80) {
    vec2 eyePos = vec2(0.48, 0.07);
    float ed = length(vec2(p.x - eyePos.x, (p.y - eyePos.y) * 1.25));
    if (ed < 0.062) {
      isEye = (ed < 0.028) ? 0.9 : 0.4;
      N = vec3(0.0, 0.0, 1.0);
    }
  }

  if (!inside) {
    outColor = vec3(0.0);
    return vec4(0.0);
  }

  // 3D Lighting & Shading
  vec3 L = normalize(LIGHT_DIR);
  vec3 V = VIEW_DIR;
  float diff = max(0.0, dot(N, L));
  vec3 H = normalize(L + V);
  float spec = pow(max(0.0, dot(N, H)), 14.0);
  float fresnel = pow(1.0 - max(0.0, dot(N, V)), 2.4);
  // Micro scale 3D texture & curvature shimmer
  float scalePat = (inside && isFin < 0.5) ? sin(uSpine * 52.0 + p.y * 38.0) * 0.08 : 0.0;

  // Compute rich shaded color from 3D palette
  outColor = shade3DFish(species, N, diff, spec, fresnel, isEye, uSpine, isFin);

  // Luminance mapped to ASCII density (0..1)
  float lum = clamp(0.24 + diff * 0.62 + spec * 0.85 + fresnel * 0.40 + scalePat, 0.05, 1.0);
  if (isEye > 0.65) lum = (spec > 0.4) ? 0.95 : 0.12; // dark pupil, glistening catchlight

  return vec4(1.0, lum, N.y, isEye);
}

// Evaluates 3D Pelagic Shark
vec4 eval3DShark(vec2 q, float t, float species, out vec3 outColor) {
  // Shark swims slower with powerful lateral sweep
  float wag = sin(t * 3.4 - q.x * 2.0) * smoothstep(0.4, -1.2, q.x);
  vec2 p = q;
  p.y -= wag * 0.12;

  float xHead = 0.92;
  float xTail = -0.95;
  float u = (p.x - xTail) / (xHead - xTail);

  bool inside = false;
  float isFin = 0.0;
  float isEye = 0.0;
  vec3 N = vec3(0.0, 0.0, 1.0);

  // Body
  if (u >= 0.0 && u <= 1.0) {
    float bodyH = 0.28 * sin(u * 3.14159) * (0.75 + 0.45 * u);
    float bodyT = 0.20 * sin(u * 3.14159) * (0.75 + 0.45 * u);
    if (abs(p.y) <= bodyH) {
      inside = true;
      float yn = p.y / max(0.001, bodyH);
      float zn = sqrt(max(0.0, 1.0 - yn * yn));
      N = normalize(vec3(-0.25 * (0.5 - u) * yn, yn, zn));
    }
  }

  // Iconic Tall Shark Dorsal Fin
  if (p.x >= -0.25 && p.x <= 0.20 && p.y > 0.0) {
    float du = (p.x - (-0.25)) / 0.45;
    float finH = 0.22 + 0.38 * sin(du * 2.4);
    if (p.y <= finH && p.y >= 0.10) {
      inside = true; isFin = 1.0;
      N = normalize(vec3(0.2, 0.92, 0.35));
    }
  }

  // Crescent Heterocercal Tail
  if (p.x < -0.90 && p.x > -1.55) {
    float tv = (-0.90 - p.x) / 0.65;
    float upper = 0.52 * tv;
    float lower = -0.28 * tv;
    if (p.y <= upper && p.y >= lower && abs(p.y - 0.05 * tv) > 0.02) {
      inside = true; isFin = 1.0;
      N = normalize(vec3(-0.4, p.y * 0.6, 0.75));
    }
  }

  // Shark Eye
  if (inside && u > 0.82) {
    vec2 ep = vec2(0.68, 0.05);
    float ed = length(vec2(p.x - ep.x, (p.y - ep.y) * 1.4));
    if (ed < 0.055) {
      isEye = (ed < 0.024) ? 0.9 : 0.4;
      N = vec3(0.0, 0.0, 1.0);
    }
  }

  if (!inside) { outColor = vec3(0.0); return vec4(0.0); }

  vec3 L = normalize(LIGHT_DIR);
  vec3 V = VIEW_DIR;
  float diff = max(0.0, dot(N, L));
  float spec = pow(max(0.0, dot(N, normalize(L + V))), 12.0);
  float fresnel = pow(1.0 - max(0.0, dot(N, V)), 2.2);

  outColor = shade3DFish(species, N, diff, spec, fresnel, isEye, u, isFin);
  float lum = clamp(0.22 + diff * 0.65 + spec * 0.85 + fresnel * 0.45, 0.05, 1.0);
  return vec4(1.0, lum, N.y, isEye);
}

// Evaluates 3D Translucent Pulsing Moon Jellyfish
vec4 eval3DJelly(vec2 q, float t, float species, out vec3 outColor) {
  float pulse = sin(t * 2.2);
  float scaleY = 1.0 + 0.15 * pulse;
  float scaleX = 1.0 - 0.08 * pulse;
  vec2 p = vec2(q.x / scaleX, q.y / scaleY);

  bool inside = false;
  vec3 N = vec3(0.0, 0.0, 1.0);
  float depth = 0.0;

  // Bell Dome: upper hemisphere
  if (p.y >= -0.15 && p.y <= 0.52) {
    float r = length(vec2(p.x * 1.5, (p.y - 0.05) * 1.8));
    if (r <= 0.68) {
      inside = true;
      float zn = sqrt(max(0.0, 1.0 - r * r));
      N = normalize(vec3(p.x * 1.2, p.y * 1.5, zn));
    }
  }

  // Trailing oral arms & tentacles
  if (!inside && p.y < -0.12 && p.y > -0.90) {
    for (int k = -3; k <= 3; k++) {
      float kx = float(k) * 0.10;
      float wave = sin(p.y * 7.0 - t * 3.5 + float(k) * 0.8) * 0.06;
      if (abs(p.x - (kx + wave)) < 0.035) {
        inside = true;
        N = normalize(vec3(0.2 * float(k), 0.3, 0.9));
        break;
      }
    }
  }

  if (!inside) { outColor = vec3(0.0); return vec4(0.0); }

  vec3 L = normalize(LIGHT_DIR);
  float diff = max(0.0, dot(N, L));
  float rim = pow(1.0 - max(0.0, dot(N, VIEW_DIR)), 1.8);

  // Bioluminescent opalescent jelly colors
  vec3 bellCol = vec3(0.25, 0.92, 0.85); // cyan glow
  vec3 coreCol = vec3(0.98, 0.55, 0.65); // coral pink core
  outColor = mix(bellCol, coreCol, smoothstep(0.0, 0.45, length(p) * 0.8));
  outColor = outColor * (0.45 + diff * 0.55) + vec3(1.0) * (rim * 0.60);

  float lum = clamp(0.30 + diff * 0.50 + rim * 0.60, 0.08, 0.98);
  return vec4(1.0, lum, N.y, 0.0);
}

// Evaluates 3D Gliding Manta Ray with undulating wings & whip tail
vec4 eval3DMantaRay(vec2 q, float t, float species, out vec3 outColor) {
  float flapSpeed = 2.8;
  float flapAmp = 0.22 * smoothstep(0.1, 0.95, abs(q.y));
  float flapZ = sin(t * flapSpeed - q.x * 2.2) * flapAmp;
  
  vec2 p = q;
  p.y *= 1.15;
  
  float xHead = 0.62;
  float xTail = -0.72;
  float u = (p.x - xTail) / (xHead - xTail);
  
  bool inside = false;
  float isEye = 0.0;
  vec3 N = vec3(0.0, 0.0, 1.0);
  
  if (u >= 0.0 && u <= 1.0) {
    float spanW = 0.95 * sin(u * 3.14159) * (0.65 + 0.55 * u);
    float thick = 0.16 * sin(u * 3.14159) * (1.0 - abs(p.y) / max(0.001, spanW));
    
    if (abs(p.y) <= spanW) {
      inside = true;
      float yn = p.y / max(0.001, spanW);
      float zn = sqrt(max(0.0, 1.0 - yn * yn));
      float dFlap = cos(t * flapSpeed - q.x * 2.2) * flapAmp * 2.0;
      N = normalize(vec3(-0.3 * (0.5 - u) - dFlap * 0.25, yn * 0.6, zn + flapZ * 0.4));
    }
  }
  
  // Slender whip tail trailing behind
  if (p.x < -0.70 && p.x > -1.45) {
    float tv = (-0.70 - p.x) / 0.75;
    float whipW = 0.035 * (1.0 - tv * 0.7);
    float whipY = sin(t * 3.2 + p.x * 3.0) * 0.06 * tv;
    if (abs(p.y - whipY) <= whipW) {
      inside = true;
      N = normalize(vec3(-0.4, (p.y - whipY) * 15.0, 0.8));
    }
  }
  
  // Cephalic horns (front flaps)
  if (p.x >= 0.58 && p.x <= 0.82 && abs(abs(p.y) - 0.20) <= 0.055) {
    inside = true;
    N = normalize(vec3(0.5, sign(p.y) * 0.5, 0.7));
  }
  
  // Eyes
  if (inside && u > 0.75 && abs(abs(p.y) - 0.26) < 0.045) {
    isEye = 0.85;
    N = vec3(0.0, 0.0, 1.0);
  }
  
  if (!inside) { outColor = vec3(0.0); return vec4(0.0); }
  
  vec3 L = normalize(LIGHT_DIR);
  vec3 V = VIEW_DIR;
  float diff = max(0.0, dot(N, L));
  float spec = pow(max(0.0, dot(N, normalize(L + V))), 16.0);
  float rim = pow(1.0 - max(0.0, dot(N, V)), 2.0);
  
  // Midnight velvet navy & electric cyan spots
  vec3 dorsalBase = vec3(0.02, 0.08, 0.16);
  vec3 ventralBase = vec3(0.85, 0.92, 0.96);
  vec3 mantaCol = (N.y < -0.2) ? ventralBase : dorsalBase;
  
  // Bioluminescent spots along wing margins
  float spotPat = sin(p.x * 28.0) * sin(p.y * 24.0);
  if (spotPat > 0.55 && abs(p.y) > 0.25) {
    mantaCol += vec3(0.25, 0.95, 0.85) * 0.55;
  }
  
  outColor = mantaCol * (0.45 + diff * 0.55) + vec3(0.4, 0.9, 0.95) * (spec * 0.8 + rim * 0.45);
  float lum = clamp(0.20 + diff * 0.60 + spec * 0.80 + rim * 0.40, 0.06, 1.0);
  if (isEye > 0.5) lum = 0.12;
  return vec4(1.0, lum, N.y, isEye);
}
`;
