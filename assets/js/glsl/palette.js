// Minecraft creature shading palette: ore & mob tones, zero blue.
export const PALETTE_GLSL = `
// 4-stop ore light ramp for visualizer & aurora
vec3 ramp3(float t) {
  t = clamp(t, 0.0, 1.0) * 3.0;
  vec3 c0 = vec3(0.09, 0.87, 0.38); // emerald
  vec3 c1 = vec3(1.00, 0.67, 0.00); // gold
  vec3 c2 = vec3(1.00, 0.13, 0.13); // redstone
  vec3 c3 = vec3(0.67, 0.00, 0.67); // amethyst
  if (t < 1.0) return mix(c0, c1, t);
  if (t < 2.0) return mix(c1, c2, t - 1.0);
  return mix(c2, c3, t - 2.0);
}

// 3D mob color shading with countershading + specular
vec3 shade3DFish(float species, vec3 N, float diff, float spec, float fresnel, float eye, float uSpine, float fin) {
  if (eye > 0.65) {
    return (spec > 0.4) ? vec3(1.0, 1.0, 1.0) : vec3(0.04, 0.06, 0.08);
  }
  if (eye > 0.15) {
    return (species > 1.5) ? vec3(1.00, 0.67, 0.00) : vec3(0.09, 0.87, 0.38);
  }

  float dorsal = smoothstep(-0.30, 0.50, N.y);
  float lateral = exp(-abs(N.y) * 4.5);

  vec3 backCol, flankCol, bellyCol, specCol, finCol;

  if (species < 0.5) {
    // Species 0: Gold Ingot / Pufferfish
    backCol  = vec3(0.85, 0.55, 0.05);
    flankCol = vec3(1.00, 0.85, 0.20);
    bellyCol = vec3(0.96, 0.88, 0.74);
    specCol  = vec3(1.00, 0.96, 0.80);
    finCol   = vec3(0.98, 0.67, 0.00);
  } else if (species < 1.5) {
    // Species 1: Emerald Axolotl
    backCol  = vec3(0.04, 0.35, 0.14);
    flankCol = vec3(0.09, 0.87, 0.38);
    bellyCol = vec3(0.75, 0.95, 0.80);
    specCol  = vec3(0.60, 1.00, 0.70);
    finCol   = vec3(0.10, 0.70, 0.30);
  } else if (species < 2.5) {
    // Species 2: Redstone Salmon
    backCol  = vec3(0.55, 0.05, 0.05);
    flankCol = vec3(1.00, 0.13, 0.13);
    bellyCol = vec3(0.95, 0.75, 0.72);
    specCol  = vec3(1.00, 0.85, 0.80);
    finCol   = vec3(0.85, 0.10, 0.10);
  } else if (species < 3.5) {
    // Species 3: Oak Cod / Dirt Brown
    backCol  = vec3(0.28, 0.17, 0.08);
    flankCol = vec3(0.74, 0.48, 0.27);
    bellyCol = vec3(0.92, 0.82, 0.65);
    specCol  = vec3(0.90, 0.80, 0.60);
    finCol   = vec3(0.57, 0.35, 0.16);
  } else {
    // Species 4: Amethyst Guardian
    backCol  = vec3(0.30, 0.00, 0.30);
    flankCol = vec3(0.67, 0.00, 0.67);
    bellyCol = vec3(0.90, 0.75, 0.92);
    specCol  = vec3(0.95, 0.80, 1.00);
    finCol   = vec3(0.55, 0.10, 0.60);
  }

  vec3 col = mix(bellyCol, backCol, dorsal);
  col = mix(col, flankCol, lateral * 0.45);

  if (fin > 0.5) {
    col = mix(col, finCol, 0.65);
  }

  float scaleSparkle = sin(uSpine * 36.0) * sin(N.y * 24.0);
  diff += scaleSparkle * 0.05;

  vec3 shaded = col * (0.28 + diff * 0.68);
  shaded += specCol * (spec * 0.85);
  shaded += mix(col, vec3(1.0), 0.5) * (fresnel * 0.40);

  return clamp(shaded, 0.0, 1.0);
}
`;
