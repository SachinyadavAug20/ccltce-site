// Static-world batcher — merges every idle (non-animated, non-interactable) voxel box
// into ONE buffer geometry per color+emissive pair, slashing draw calls from ~3000
// to a few dozen. Merged boxes keep their world transform, so visuals are identical.
// Animated meshes / point lights / transparent materials are left untouched.
import * as THREE from "../vendor/three.module.js";

var ANIM_FIELDS = ["float", "blink", "pulse", "orbit", "cart", "cloud",
  "wing", "leg", "tail", "head", "ear", "arm", "crystal", "dragon",
  "shk", "base", "baseY", "gateway", "end", "enderman"];
var GROUP_FIELDS = ["float", "blink", "pulse", "orbit", "cart", "cloud",
  "crystal", "dragon", "shk", "gateway", "end", "spin"];

function isStatic(mesh) {
  if (!mesh.isMesh) return false;
  var u = mesh.userData;
  for (var i = 0; i < ANIM_FIELDS.length; i++) if (u[ANIM_FIELDS[i]] !== undefined) return false;
  var mat = mesh.material;
  if (!mat || mat.transparent || mat.isMeshLambertMaterial === false) return false;
  var g = mesh.geometry;
  if (!g || !g.attributes.position || g.attributes.position.count > 24 || !g.index) return false;
  // every ancestor must be idle too — nothing at or above the mesh may move
  for (var p = mesh.parent; p; p = p.parent) {
    var pu = p.userData;
    if (!pu) continue;
    for (var k = 0; k < GROUP_FIELDS.length; k++) if (pu[GROUP_FIELDS[k]] !== undefined) return false;
  }
  return true;
}

export function batchStatic(scene) {
  scene.updateMatrixWorld(true);
  var boxes = new Map();   // colorKey → { color, emissive, ei, counts: [] (list of Matrix4) }
  scene.traverse(function (n) {
    if (!isStatic(n)) return;
    var m = n.material;
    var hex = m.color && m.color.getHex();
    if (hex === undefined) return;
    var ehex = m.emissive && m.emissiveIntensity > 0 ? m.emissive.getHex() : 0;
    var key = hex + "_" + ehex + "_" + (m.emissiveIntensity || 0);
    if (!boxes.has(key)) boxes.set(key, { color: m.color.clone(), emissive: m.emissive ? m.emissive.clone() : null, ei: m.emissiveIntensity || 0, xforms: [], geoms: [] });
    boxes.get(key).xforms.push(n.matrixWorld.clone());
    boxes.get(key).geoms.push(n.geometry);
  });

  var proto = new THREE.BoxGeometry(1, 1, 1);
  var ia = proto.index.array;   // every THREE BoxGeometry shares this 36-index pattern
  var V = 24, T = 36;
  var merged = 0, skipped = 0, groupsMade = 0;
  var v3 = new THREE.Vector3(), n3 = new THREE.Vector3(), nm3 = new THREE.Matrix3();

  boxes.forEach(function (rec) {
    var count = rec.xforms.length;
    if (count < 3) { skipped += count; return; }   // tiny piles stay as meshes
    var pos = new Float32Array(count * V * 3);
    var nor = new Float32Array(count * V * 3);
    var idx = count * V > 65536 ? new Uint32Array(count * T) : new Uint16Array(count * T);
    for (var r = 0; r < count; r++) {
      var x = rec.xforms[r], e = x.elements;
      // bake the box's OWN sized vertices (builders use BoxGeometry(w,h,d), scale=1 —
      // a unit proto would collapse every block to a 1×1×1 cube at the right center).
      var pa = rec.geoms[r].attributes.position.array, na = rec.geoms[r].attributes.normal.array;
      // voxel boxes are rotated but axis-aligned-scaled; normals need the ROTATION only
      // (a full inverse-transpose via getNormalMatrix flips winding on identity-scale boxes).
      var nrm = new THREE.Matrix4().extractRotation(x);
      for (var v = 0; v < V; v++) {
        v3.set(pa[v * 3], pa[v * 3 + 1], pa[v * 3 + 2]).applyMatrix4(x);
        n3.set(na[v * 3], na[v * 3 + 1], na[v * 3 + 2]).transformDirection(nrm);
        var o = (r * V + v) * 3;
        pos[o] = v3.x; pos[o + 1] = v3.y; pos[o + 2] = v3.z;
        nor[o] = n3.x; nor[o + 1] = n3.y; nor[o + 2] = n3.z;
      }
      var vb = r * V;
      for (var t = 0; t < T; t++) idx[r * T + t] = vb + ia[t];
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    var mat = new THREE.MeshLambertMaterial({ color: rec.color });
    if (rec.ei > 0) { mat.emissive = rec.emissive; mat.emissiveIntensity = rec.ei; }
    var mm = new THREE.Mesh(geo, mat);
    mm.frustumCulled = false;
    mm.userData.batched = count;
    scene.add(mm);
    merged += count; groupsMade++;
  });
  return { count: groupsMade, saved: merged };
}

export function cullMergedStatic(scene) {
  // second pass: remove the originals that now have a merged twin.
  // Runs in the same event loop tick via batchStatic caller; kept separate for clarity.
  var removed = 0;
  var list = [];
  scene.traverse(function (n) {
    if (!isStatic(n)) return;
    var m = n.material;
    var hex = m.color && m.color.getHex();
    if (hex === undefined) return;
    var ehex = m.emissive && m.emissiveIntensity > 0 ? m.emissive.getHex() : 0;
    var key = hex + "_" + ehex + "_" + (m.emissiveIntensity || 0);
    list.push(n);
  });
  // count group sizes again
  var sizes = new Map();
  list.forEach(function (n) {
    var m = n.material;
    var ehex = m.emissive && m.emissiveIntensity > 0 ? m.emissive.getHex() : 0;
    var key = m.color.getHex() + "_" + ehex + "_" + (m.emissiveIntensity || 0);
    sizes.set(key, (sizes.get(key) || 0) + 1);
  });
  list.forEach(function (n) {
    var m = n.material;
    var ehex = m.emissive && m.emissiveIntensity > 0 ? m.emissive.getHex() : 0;
    var key = m.color.getHex() + "_" + ehex + "_" + (m.emissiveIntensity || 0);
    if ((sizes.get(key) || 0) >= 3) {
      if (n.parent) n.parent.remove(n);
      removed++;
    }
  });
  return { removed: removed };
}
