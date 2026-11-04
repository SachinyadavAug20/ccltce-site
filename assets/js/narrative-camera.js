// Narrative camera — Catmull-Rom spline: campus → nether → end-island dragon finale.
import * as THREE from "../vendor/three.module.js";

export function createCameraPath() {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 115, 140),   // high sky start — long vanilla-flavored descent
    new THREE.Vector3(0, 80, 112),
    new THREE.Vector3(0, 46, 84),
    new THREE.Vector3(-16, 20, 56),   // swoop west over the dorm tree line
    new THREE.Vector3(-8, 12.5, 36),  // low over the west lawn — crafting/furnace side
    new THREE.Vector3(2, 11, 19),     // cross the path tiles beside the gate sign
    new THREE.Vector3(16, 11, 25),    // lawn S — planters and golem below, canopies clear of the lens
    new THREE.Vector3(30, 11, 28),    // east lawn bend over the homestead street
    new THREE.Vector3(34, 10.5, 24),  // line up the portal punch
    new THREE.Vector3(40.5, 10, 21),  // punch — through the obsidian frame
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

// anchors from arc length ~548 (re-probed 2026-11): arch@0.2865, punch@0.3948-0.3978, x=80 @0.473,
// x=160 @0.650, x=202 @0.7482, y=-5 @0.7675, z=46 @0.8333 (x=224), dive -58 @0.8843, -80 ~0.9225
export var PHASES = {
  surface: [0, 0.2865],
  station1: [0.2865, 0.473],
  station2: [0.473, 0.6503],
  station3: [0.6503, 0.7542],
  bedrock: [0.7542, 1.0],
};

export function phaseAt(t) {
  if (t < 0.2865) return "surface";
  if (t < 0.473) return "station1";
  if (t < 0.6503) return "station2";
  if (t < 0.7542) return "station3";
  return "bedrock";
}

// dimension for fog + bg: overworld → nether (flip just inside the entry wall — punch ends ~0.3978)
// → end (flip as the camera crosses the exit ring — x=202 sits at arc ~0.7482)
export function dimAt(t) {
  if (t < 0.4015) return "overworld";
  if (t < 0.7582) return "nether";
  return "end";
}
