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
    new THREE.Vector3(214, -2, 46),   // rise over the pillar ring → end sky
    new THREE.Vector3(232, -6, 56),   // wide sweep outside the ring
    new THREE.Vector3(216, -4, 58),   // finale — high + wide, dragon framed below centre
  ], false, "catmullrom", 0.5);
}

export function updateCamera(camera, curve, t, look) {
  var p = curve.getPointAt(Math.min(Math.max(t, 0), 1));
  camera.position.copy(p);
  camera.lookAt(look || curve.getPointAt(Math.min(t + 0.04, 1)));
}

export var PHASES = {
  surface: [0, 0.26],
  station1: [0.26, 0.47],
  station2: [0.47, 0.68],
  station3: [0.68, 0.87],
  bedrock: [0.87, 1.0],
};

export function phaseAt(t) {
  if (t < 0.26) return "surface";
  if (t < 0.47) return "station1";
  if (t < 0.68) return "station2";
  if (t < 0.87) return "station3";
  return "bedrock";
}

// dimension for fog + bg: overworld → nether → end (finale stays lit for the fight)
export function dimAt(t) {
  if (t < 0.39) return "overworld";
  if (t < 0.79) return "nether";
  return "end";
}
