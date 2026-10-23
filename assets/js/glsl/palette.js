// Nuanced 3D marine shading palette: countershading, specular sheen, and bioluminescent glow.
export const PALETTE_GLSL = `
// 4-stop oceanic light ramp for visualizer & aurora
vec3 ramp3(float t) {
  t = clamp(t, 0.0, 1.0) * 3.0;
  vec3 c0 = vec3(0.18, 0.85, 0.78); // cyan
  vec3 c1 = vec3(0.25, 0.72, 0.98); // sky
  vec3 c2 = vec3(0.55, 0.38, 0.95); // ultraviolet / NASA purple
  vec3 c3 = vec3(0.98, 0.68, 0.28); // amber
  if (t < 1.0) return mix(c0, c1, t);
  if (t < 2.0) return mix(c1, c2, t - 1.0);
  return mix(c2, c3, t - 2.0);
}

// 3D Fish color shading with countershading (dark dorsal, light ventral) + iridescent scales
vec3 shade3DFish(float species, vec3 N, float diff, float spec, float fresnel, float eye, float uSpine, float fin) {
  // Eye styling
  if (eye > 0.65) {
    // Dark pupil with specular twinkle
    return (spec > 0.4) ? vec3(1.0, 1.0, 1.0) : vec3(0.04, 0.06, 0.08);
  }
  if (eye > 0.15) {
    // Glowing golden or cyan iris ring
    return (species > 1.5) ? vec3(0.98, 0.82, 0.25) : vec3(0.40, 0.95, 0.90);
  }

  // Countershading factor: dorsal (top) vs ventral (belly)
  float dorsal = smoothstep(-0.30, 0.50, N.y);
  float lateral = exp(-abs(N.y) * 4.5); // stripe along horizontal mid-flank

  vec3 backCol, flankCol, bellyCol, specCol, finCol;

  if (species < 0.5) {
    // Species 0: Amber-Gold Sun Koi
    backCol  = vec3(0.92, 0.45, 0.10);
    flankCol = vec3(1.00, 0.75, 0.20);
    bellyCol = vec3(0.96, 0.88, 0.74);
    specCol  = vec3(1.00, 0.96, 0.80);
    finCol   = vec3(0.98, 0.52, 0.16);
  } else if (species < 1.5) {
    // Species 1: Cyber Bioluminescent Neon Tetra
    backCol  = vec3(0.04, 0.42, 0.52);
    flankCol = vec3(0.18, 0.95, 0.85); // vivid cyan lateral line
    bellyCol = vec3(0.82, 0.94, 0.98);
    specCol  = vec3(0.60, 1.00, 0.95);
    finCol   = vec3(0.24, 0.88, 0.80);
  } else if (species < 2.5) {
    // Species 2: NASA Ultraviolet Deep Angelfish
    backCol  = vec3(0.42, 0.18, 0.82); // rich NASA worm purple
    flankCol = vec3(0.72, 0.35, 0.95);
    bellyCol = vec3(0.88, 0.78, 0.98);
    specCol  = vec3(0.92, 0.82, 1.00);
    finCol   = vec3(0.60, 0.30, 0.90);
  } else if (species < 3.5) {
    // Species 3: Oceanic Pelagic Blue Hunter
    backCol  = vec3(0.10, 0.25, 0.48);
    flankCol = vec3(0.22, 0.50, 0.75);
    bellyCol = vec3(0.90, 0.95, 0.99);
    specCol  = vec3(0.75, 0.88, 1.00);
    finCol   = vec3(0.18, 0.38, 0.62);
  } else {
    // Species 4: Luminous Coral Jellyfish / Reef Drifter
    backCol  = vec3(0.20, 0.85, 0.75);
    flankCol = vec3(0.95, 0.55, 0.50);
    bellyCol = vec3(0.92, 0.75, 0.85);
    specCol  = vec3(0.90, 1.00, 0.95);
    finCol   = vec3(0.95, 0.48, 0.58);
  }

  // Base 3D blend across volume
  vec3 col = mix(bellyCol, backCol, dorsal);
  col = mix(col, flankCol, lateral * 0.45);

  if (fin > 0.5) {
    col = mix(col, finCol, 0.65);
  }

  // Subtle 3D scale iridescence sheen
  float scaleSparkle = sin(uSpine * 36.0) * sin(N.y * 24.0);
  diff += scaleSparkle * 0.05;

  // Diffuse + Specular highlights + Fresnel rim light
  vec3 shaded = col * (0.28 + diff * 0.68);
  shaded += specCol * (spec * 0.85);
  shaded += mix(col, vec3(1.0), 0.5) * (fresnel * 0.40);

  return clamp(shaded, 0.0, 1.0);
}
`;