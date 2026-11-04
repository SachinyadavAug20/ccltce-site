// Narrative camera — Catmull-Rom spline: campus → nether → end-island dragon finale.
import * as THREE from "../vendor/three.module.js";

export function createCameraPath() {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 115, 140),   // higher sky start — long vanilla-flavored descent
    new THREE.Vector3(0, 78, 108),
    new THREE.Vector3(0, 40, 74),
    new THREE.Vector3(-8, 17, 34),    // swoop west over the lawn — gate sign / crafting side
    new THREE.Vector3(6, 9, 15),      // through arch, low over the tiles
    new THREE.Vector3(22, 7, 26),     // lawn S-weave — creepers and golem in frame
    new THREE.Vector3(36, 7.5, 19.5), // line up the portal punch
    new THREE.Vector3(40.5, 8, 21),   // punch — through the obsidian frame
    new THREE.Vector3(58, 6.5, 25),
    new THREE.Vector3(78, 6, 30),     // nether S: first north bump
    new THREE.Vector3(98, 7, 17),     // swing south across the wastes
    new THREE.Vector3(118, 6.5, 31),
    new THREE.Vector3(140, 5, 16),
    new THREE.Vector3(160, 5, 26),    // fortress pass (clear of pillar beams)
    new THREE.Vector3(182, 6, 14),    // south bump — basalt break / bastion line
    new THREE.Vector3(198, 7.5, 25),  // line up the End exit
    new THREE.Vector3(224, -34, 46),  // dive through the nether's exit doorway → void below
    new THREE.Vector3(246, -84, 58),  // long fall outside the pillar ring
    new THREE.Vector3(214, -80, 50),  // finale — close enough to the dragon to click its head
  ], false, "catmullrom", 0.5);
}

export function updateCamera(camera, curve, t, look) {
  var p = curve.getPointAt(Math.min(Math.max(t, 0), 1));
  camera.position.copy(p);
  camera.lookAt(look || curve.getPointAt(Math.min(t + 0.012, 1)));
}

// anchors from arc length ~544 (re-probed 2026-11): arch@0.296, punch@0.391-0.394, x=80 @0.469,
// x=160 @0.648, x=202 @0.7465, y=-5 @0.766, z=46 @0.832 (x=224), dive -58 @0.8835, -80 ~0.9215
export var PHASES = {
  surface: [0, 0.296],
  station1: [0.296, 0.469],
  station2: [0.469, 0.648],
  station3: [0.648, 0.7525],
  bedrock: [0.7525, 1.0],
};

export function phaseAt(t) {
  if (t < 0.296) return "surface";
  if (t < 0.469) return "station1";
  if (t < 0.648) return "station2";
  if (t < 0.7525) return "station3";
  return "bedrock";
}

// dimension for fog + bg: overworld → nether (flip just inside the entry wall — punch ends ~0.394)
// → end (flip as the camera crosses the exit ring — x=202 sits at arc ~0.7465)
export function dimAt(t) {
  if (t < 0.398) return "overworld";
  if (t < 0.7565) return "nether";
  return "end";
}
