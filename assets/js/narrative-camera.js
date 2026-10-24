// Narrative camera — Catmull-Rom spline: campus → nether → end-island dragon finale.
import * as THREE from "../vendor/three.module.js";

export function createCameraPath() {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 50, 100),    // campus surface (overworld)
    new THREE.Vector3(0, 20, 40),     // gate descent
    new THREE.Vector3(0, 8, 10),      // through arch
    new THREE.Vector3(40, 8, 20),     // station 1 — overworld systems
    new THREE.Vector3(80, 6, 22),     // enter nether tunnel
    new THREE.Vector3(120, 8, 22),    // station 2 — nether algorithms
    new THREE.Vector3(160, 5, 26),    // nether fortress pass (clear of pillar beams)
    new THREE.Vector3(200, 8, 26),    // station 3 — end intelligence
    new THREE.Vector3(224, -34, 46),  // dive through the nether's open face → void below
    new THREE.Vector3(246, -84, 58),  // long fall outside the pillar ring
    new THREE.Vector3(216, -70, 58),  // finale — overview high above the sunken island (top -126)
  ], false, "catmullrom", 0.5);
}

export function updateCamera(camera, curve, t, look) {
  var p = curve.getPointAt(Math.min(Math.max(t, 0), 1));
  camera.position.copy(p);
  camera.lookAt(look || curve.getPointAt(Math.min(t + 0.04, 1)));
}

// anchors from arc length 448: x=40 @0.318, x=160 @0.587, x=200 @0.679, y=-5 @0.720, z=46 @0.797 (x=224), dive -80 @0.913
export var PHASES = {
  surface: [0, 0.25],
  station1: [0.25, 0.46],
  station2: [0.46, 0.575],
  station3: [0.575, 0.7],
  bedrock: [0.7, 1.0],
};

export function phaseAt(t) {
  if (t < 0.25) return "surface";
  if (t < 0.46) return "station1";
  if (t < 0.575) return "station2";
  if (t < 0.7) return "station3";
  return "bedrock";
}

// dimension for fog + bg: overworld → nether (flip just inside the entry wall) → end (flip just before the open face)
export function dimAt(t) {
  if (t < 0.33) return "overworld";
  if (t < 0.67) return "nether";
  return "end";
}
