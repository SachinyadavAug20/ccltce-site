// Narrative camera — Catmull-Rom spline: campus → nether → end-island dragon finale.
import * as THREE from "../vendor/three.module.js";

export function createCameraPath() {
  var curve = new THREE.CatmullRomCurve3([
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
    new THREE.Vector3(78, 6, 26),     // nether S: gentle drift, keeps the heading pointed east
    new THREE.Vector3(98, 7, 22),     // soft weave — no more sideways yaw whips past the wastes
    new THREE.Vector3(118, 6.5, 24),
    new THREE.Vector3(140, 5, 19),
    new THREE.Vector3(160, 5.5, 22),  // fortress pass (clear of pillar beams)
    new THREE.Vector3(182, 6, 18),    // mild south shoulder — basalt break / bastion line
    new THREE.Vector3(198, 7.5, 22),  // line up the exit — last nether glow on the walls
    // — overworld stronghold: the surface falls away, the stair descends torch-lit —
    new THREE.Vector3(204, 2.5, 24),  // threshold sink — stone bricks light up ahead
    new THREE.Vector3(216, -9, 28),   // mid-corridor duck under the arch ribs
    new THREE.Vector3(227, -16.5, 33),// portal chamber glide-in, lava pool drifting past below
    new THREE.Vector3(237, -19.5, 36),// PUNCH through the end-portal ring centre — overworld falls away
    // — the End: fall outside the pillar ring, wheel SE of the island, settle wide on the dragon orbit —
    new THREE.Vector3(246, -40, 46),  // early fall past the mainland SE corner
    new THREE.Vector3(252, -66, 50),  // deep void — shaft rocks slide past the right strut
    new THREE.Vector3(258, -88, 52),  // apex east of the ring — the fall arcs, arena rising
    new THREE.Vector3(256, -94, 58),  // outer bank, god-lizard pouring into frame
    new THREE.Vector3(250, -104, 52), // settle — the dragon orbit fills distance, pillar ring wide on both shoulders
  ], false, "catmullrom", 0.5);
  curve.arcLengthDivisions = 3000;   // high-res arc map: getPointAt(u) stays frame-rate accurate, no scroll dead zones
  return curve;
}

// anchors from arc length (re-probed 2026-11-08, End tail reroute + stub pillar):
// arch@0.2897, punch@0.3948-0.4132, x=160 @0.6447, stronghold threshold y=0 @0.7417,
// portal-ring punch x=237 @0.8155, freefall past y=-88 @0.9571
export var PHASES = {
  surface: [0, 0.2877],
  station1: [0.2877, 0.4133],
  station2: [0.4133, 0.6447],
  station3: [0.6447, 0.7417],
  stronghold: [0.7417, 0.8155],
  bedrock: [0.8155, 1.0],
};

export function phaseAt(t) {
  if (t < 0.2877) return "surface";
  if (t < 0.4133) return "station1";
  if (t < 0.6447) return "station2";
  if (t < 0.7417) return "station3";
  if (t < 0.8155) return "stronghold";
  return "bedrock";
}

// dimension for fog + bg: overworld → nether (flip just inside the entry wall — punch ends ~0.41)
// → overworld stronghold (the surface leg underground) → end (flip as the camera crosses the
// end-portal ring at x=237)
export function dimAt(t) {
  if (t < 0.403) return "overworld";
  if (t < 0.7417) return "nether";
  if (t < 0.8155) return "stronghold";
  return "end";
}
