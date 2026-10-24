// Narrative camera — Catmull-Rom spline through overworld → nether → end → bedrock.
import * as THREE from "../vendor/three.module.js";

export function createCameraPath() {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 50, 100),    // campus surface (overworld)
    new THREE.Vector3(0, 20, 40),     // gate descent
    new THREE.Vector3(0, 8, 10),      // through arch
    new THREE.Vector3(40, 8, 18),     // station 1 — overworld systems
    new THREE.Vector3(80, 6, 16),     // enter nether tunnel
    new THREE.Vector3(120, 8, 18),    // station 2 — nether algorithms
    new THREE.Vector3(160, 4, 16),    // nether fortress pass
    new THREE.Vector3(200, 8, 18),    // station 3 — end intelligence
    new THREE.Vector3(200, -10, 25),  // end platform drop
    new THREE.Vector3(200, -30, 28),  // end island hover
    new THREE.Vector3(200, -48, 30),  // bedrock terminal
  ], false, "catmullrom", 0.5);
}

export function updateCamera(camera, curve, t) {
  var p = curve.getPointAt(Math.min(Math.max(t, 0), 1));
  var look = curve.getPointAt(Math.min(t + 0.04, 1));
  camera.position.copy(p);
  camera.lookAt(look);
}

export var PHASES = {
  surface: [0, 0.22],
  station1: [0.25, 0.42],
  station2: [0.45, 0.62],
  station3: [0.65, 0.82],
  bedrock: [0.85, 1.0],
};

export function phaseAt(t) {
  if (t < 0.22) return "surface";
  if (t < 0.45) return "station1";
  if (t < 0.65) return "station2";
  if (t < 0.82) return "station3";
  return "bedrock";
}

// dimension for fog + bg: overworld → nether → end → bedrock
export function dimAt(t) {
  if (t < 0.35) return "overworld";
  if (t < 0.6) return "nether";
  if (t < 0.85) return "end";
  return "bedrock";
}
