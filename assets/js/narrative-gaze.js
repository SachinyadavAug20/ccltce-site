// Narrative gaze — ONE responsibility: the point the journey camera looks at each frame.
//
// Golden rule: the camera only ever looks ahead of its travel direction.
//   - base gaze = fixed-length extrapolation of the flight direction, smoothed in
//     DIRECTION space (a position-space lerp can cut through the camera and spin
//     lookAt a full 180° when the target passes behind the lens)
//   - end-of-path guard: sampling "a bit ahead" collapses onto the camera position
//     as u → 1, which makes lookAt spin wildly — hold a minimum gaze distance instead
//   - gaze beats (e.g. the dragon) are layered on top but fade out as their subject
//     slips behind the forward hemisphere, so nothing can drag the view backwards
import * as THREE from "../vendor/three.module.js";

var LOOK_ARC = 0.012;  // fraction of the path sampled ahead for the flight direction
var MIN_AHEAD = 26;    // gaze never collapses closer than this (end-of-path guard)
var GAZE_DIST = 32;    // the gaze point sits this far from the lens
var GAZE_SPEED = 2.0;  // heading smoothing rate — higher is steadier, lower is floatier

export function createGazeDirector(curve) {
  var heading = new THREE.Vector3(0, 0, -1);  // smoothed travel direction (unit)
  var dir = new THREE.Vector3();              // instantaneous flight direction (unit)
  var beatDir = new THREE.Vector3();          // direction to the current gaze subject
  var seeded = false;

  function update(u, cameraPos, dt, subjectPos, subjectWeight, out) {
    // flight direction: the bit of path just ahead of the lens
    curve.getPointAt(Math.min(u + LOOK_ARC, 1), dir);
    dir.sub(cameraPos);
    if (dir.lengthSq() < MIN_AHEAD * MIN_AHEAD) {
      curve.getTangentAt(Math.max(u - 0.001, 0), dir);  // near the end: hold the flight-line
    }
    dir.normalize();

    if (!seeded) { heading.copy(dir); seeded = true; }
    heading.lerp(dir, 1 - Math.exp(-GAZE_SPEED * dt)).normalize();

    // gaze beat — eases toward the subject only while it stays ahead of the lens
    if (subjectPos && subjectWeight > 0) {
      beatDir.copy(subjectPos).sub(cameraPos);
      if (beatDir.lengthSq() > 1e-6) {
        beatDir.normalize();
        var forwardness = Math.max(0, Math.min(1, beatDir.dot(heading)));
        var w = subjectWeight * forwardness * forwardness * (1 - Math.exp(-GAZE_SPEED * dt));
        heading.lerp(beatDir, w).normalize();
      }
    }

    return out.copy(cameraPos).addScaledVector(heading, GAZE_DIST);
  }

  return { update: update };
}
