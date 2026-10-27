// 3D voxel inspector — Three.js box head, drag-orbit inertia, punch on click.
(function () {
  var gsap = window.gsap;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var KINDS = {
    ore: { top: "#17dd62", side: "#262626", front: "#17dd62" },
    apple: { top: "#ffaa00", side: "#bc7b44", front: "#ffaa00" },
    book: { top: "#aa00aa", side: "#4a148c", front: "#aa00aa" },
    pickaxe: { top: "#9a9a9a", side: "#5a5a5a", front: "#bc7b44" },
  };
  var ov, renderer, scene, cam, mesh, drag, vx = 0, vy = 0, spin = 0.004, alive = false, lastFocus;
  var threeP = null;

  // Three.js is loaded on demand (same cached module the narrative uses on desktop)
  async function ensure() {
    if (ov) return true;
    if (!window.THREE) {
      if (!threeP) threeP = import("../vendor/three.module.js").then(function (m) { window.THREE = m; return m; });
      try { await threeP; } catch (e) { threeP = null; return false; }
    }
    if (!window.THREE) return false;
    ov = document.createElement("div");
    ov.className = "vox-overlay";
    ov.hidden = true;
    ov.innerHTML = '<div class="vox-panel"><button class="vox-close" type="button" aria-label="Close">&#10005;</button>' +
      '<canvas class="vox-canvas" width="360" height="360"></canvas>' +
      '<p class="vox-cap"></p></div>';
    document.body.appendChild(ov);
    var canvas = ov.querySelector(".vox-canvas");
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(360, 360, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    cam.position.set(0, 1.6, 4.2);
    cam.lookAt(0, 0, 0);
    var sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(3, 6, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512);
    scene.add(sun, new THREE.AmbientLight(0xffffff, 0.55));
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.ShadowMaterial({ opacity: 0.4 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.9;
    floor.receiveShadow = true;
    scene.add(floor);
    ov.querySelector(".vox-close").addEventListener("click", close);
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !ov.hidden) close(); });
    canvas.addEventListener("pointerdown", function (e) {
      drag = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drag) return;
      vx = (e.clientX - drag.x) * 0.008;
      vy = (e.clientY - drag.y) * 0.008;
      drag.x = e.clientX; drag.y = e.clientY;
      if (mesh) { mesh.rotation.y += vx; mesh.rotation.x += vy; }
    });
    canvas.addEventListener("pointerup", function () { drag = null; });
    canvas.addEventListener("click", function () {
      if (mesh && gsap) gsap.to(mesh.scale, { x: 1.25, y: 0.85, z: 1.25, yoyo: true, repeat: 1, duration: 0.2 });
      if (window.CCLTCE_SFX) CCLTCE_SFX.click();
    });
    return true;
  }

  function buildMesh(kind) {
    if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
    var k = KINDS[kind] || KINDS.ore;
    var mats = [
      new THREE.MeshLambertMaterial({ color: k.side }),
      new THREE.MeshLambertMaterial({ color: k.side }),
      new THREE.MeshLambertMaterial({ color: k.top }),
      new THREE.MeshLambertMaterial({ color: "#1a1a1a" }),
      new THREE.MeshLambertMaterial({ color: k.front }),
      new THREE.MeshLambertMaterial({ color: k.side }),
    ];
    mesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), mats);
    mesh.castShadow = true;
    scene.add(mesh);
  }

  function loop() {
    if (!alive) return;
    if (!drag && mesh) mesh.rotation.y += spin + vx * 0.92, vx *= 0.92;
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  }

  async function open(kind) {
    if (!(await ensure())) return;
    buildMesh(kind);
    lastFocus = document.activeElement;
    ov.hidden = false;
    ov.querySelector(".vox-cap").textContent = "INSPECTOR — " + kind.toUpperCase() + "  ·  drag to spin · click to punch";
    alive = true;
    loop();
    if (gsap && !reduce) gsap.fromTo(ov.querySelector(".vox-panel"), { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.8)" });
  }

  function close() {
    alive = false;
    ov.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // achievement badges / articles open the inspector
  document.addEventListener("dblclick", function (e) {
    var ach = e.target.closest(".ach");
    if (ach) open(["ore", "apple", "book", "pickaxe"][(Math.random() * 4) | 0]);
  });

  window.CCLTCE_VOXEL = { open: open, spawn: open };
})();
