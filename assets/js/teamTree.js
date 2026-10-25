// CCLTCE — Team Hierarchy Skill Tree (NeetCode Reference Style)
// Dynamic Bezier connector renderer, glowing flows, responsive panning, and view toggle.
(function () {
  "use strict";

  var TIERS = [
    {
      tier: 0,
      badge: "LEVEL 0 // EXECUTIVE BOARD",
      members: ["Aakash Gupta", "Nitesh Yadav"]
    },
    {
      tier: 1,
      badge: "LEVEL 1 // OPERATIONS & COORDINATION",
      members: ["Vivek Tiwari"]
    },
    {
      tier: 2,
      badge: "LEVEL 2 // CORE PILLARS",
      members: ["Sachin Yadav", "Ayush Vishwakarma", "Shashank Suryawanshi"]
    },
    {
      tier: 3,
      badge: "LEVEL 3 // DOMAINS & CREATIVE",
      members: ["Rashi Kasotiya", "Samiksha Patil", "Sanjana Jagtap", "Adarsh Mishra"]
    },
    {
      tier: 4,
      badge: "LEVEL 4 // STUDENT OUTREACH",
      members: ["Rushi Jadhav"]
    }
  ];

  var CONNECTIONS = [
    // Tier 0 -> Tier 1 (Presidents -> Vice President)
    { from: "Aakash Gupta", to: "Vivek Tiwari" },
    { from: "Nitesh Yadav", to: "Vivek Tiwari" },

    // Tier 1 -> Tier 2 (Vice President -> Core Officers)
    { from: "Vivek Tiwari", to: "Sachin Yadav" },
    { from: "Vivek Tiwari", to: "Ayush Vishwakarma" },
    { from: "Vivek Tiwari", to: "Shashank Suryawanshi" },

    // Tier 2 -> Tier 3 (Core Officers -> Domains)
    { from: "Sachin Yadav", to: "Rashi Kasotiya" },
    { from: "Sachin Yadav", to: "Samiksha Patil" },
    { from: "Ayush Vishwakarma", to: "Samiksha Patil" },
    { from: "Ayush Vishwakarma", to: "Sanjana Jagtap" },
    { from: "Ayush Vishwakarma", to: "Adarsh Mishra" },
    { from: "Shashank Suryawanshi", to: "Adarsh Mishra" },

    // Tier 3 -> Tier 4 (Domains -> Outreach)
    { from: "Sanjana Jagtap", to: "Rushi Jadhav" },
    { from: "Adarsh Mishra", to: "Rushi Jadhav" }
  ];

  var PROGRESS_MAP = {
    "Aakash Gupta": 100,
    "Nitesh Yadav": 100,
    "Vivek Tiwari": 100,
    "Sachin Yadav": 100,
    "Ayush Vishwakarma": 100,
    "Shashank Suryawanshi": 100,
    "Rashi Kasotiya": 92,
    "Samiksha Patil": 90,
    "Sanjana Jagtap": 90,
    "Adarsh Mishra": 88,
    "Rushi Jadhav": 85
  };

  var container, canvas, svg, teamData = [];

  function init() {
    container = document.getElementById("team-tree");
    if (!container) return;

    // View toggle listeners
    var switcher = document.querySelector(".team-view-switcher");
    if (switcher) {
      switcher.addEventListener("click", function (e) {
        var btn = e.target.closest(".tvs-btn");
        if (btn && btn.dataset.view) {
          setMode(btn.dataset.view);
        }
      });
    }

    var savedMode = "tree";
    try { savedMode = sessionStorage.getItem("ccltce_team_mode") || "tree"; } catch (e) {}
    setMode(savedMode);

    // Get team data
    if (window.CCLTCE_DATA && window.CCLTCE_DATA.team) {
      buildTree(window.CCLTCE_DATA.team);
    } else {
      window.addEventListener("ccltce:data", function (e) {
        if (e.detail && e.detail.team) buildTree(e.detail.team);
      });
      // Fallback fetch
      fetch("data/content.json")
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.team && (!teamData || !teamData.length)) {
            buildTree(data.team);
          }
        })
        .catch(function () {});
    }
  }

  function setMode(mode) {
    var body = document.body;
    var btns = document.querySelectorAll(".tvs-btn");
    if (mode === "grid") {
      body.classList.remove("team-mode-tree");
      body.classList.add("team-mode-grid");
      btns.forEach(function (b) {
        var isGrid = b.dataset.view === "grid";
        b.classList.toggle("active", isGrid);
        b.setAttribute("aria-selected", isGrid ? "true" : "false");
      });
    } else {
      body.classList.remove("team-mode-grid");
      body.classList.add("team-mode-tree");
      btns.forEach(function (b) {
        var isTree = b.dataset.view === "tree";
        b.classList.toggle("active", isTree);
        b.setAttribute("aria-selected", isTree ? "true" : "false");
      });
      requestAnimationFrame(function () {
        centerTree();
        updateLines();
      });
    }
    try { sessionStorage.setItem("ccltce_team_mode", mode); } catch (e) {}
  }

  function buildTree(list) {
    if (!container || !list || !list.length) return;
    teamData = list;
    var memberMap = {};
    list.forEach(function (m) { memberMap[m.name] = m; });

    var html = '<div class="tree-mobile-hint">↔ Drag or swipe horizontally to navigate tree &bull; Click node for lore</div>';
    html += '<div class="tree-canvas">';
    html += '<svg class="tree-svg" aria-hidden="true">';
    CONNECTIONS.forEach(function (c, idx) {
      html += '<path class="tree-edge" data-from="' + escapeAttr(c.from) + '" data-to="' + escapeAttr(c.to) + '" data-index="' + idx + '"></path>';
    });
    html += '</svg>';

    TIERS.forEach(function (t) {
      html += '<section class="tree-tier" data-tier="' + t.tier + '">';
      html += '<div class="tree-tier-badge"><span class="ttb-gem">◈</span> ' + escapeHtml(t.badge) + ' <span class="ttb-gem">◈</span></div>';
      html += '<div class="tree-tier-nodes">';

      t.members.forEach(function (name) {
        var m = memberMap[name];
        if (!m) return;
        var progress = PROGRESS_MAP[name] || 90;
        var accent = m.accent || "#17dd62";
        var yearClass = (m.area || "").split("•")[0].trim() || "MEMBER";

        html += '<article class="tree-node" tabindex="0" role="button" aria-haspopup="dialog"';
        html += ' style="--accent: ' + accent + '; --accent-glow: ' + hexToRgba(accent, 0.4) + ';"';
        html += ' data-name="' + escapeAttr(m.name) + '"';
        html += ' data-role="' + escapeAttr(m.role) + '"';
        html += ' data-area="' + escapeAttr(m.area) + '"';
        html += ' data-bio="' + escapeAttr(m.bio || "") + '"';
        html += ' data-item="' + escapeAttr(m.item || "") + '"';
        html += ' data-accent="' + escapeAttr(accent) + '"';
        html += ' data-portfolio="' + escapeAttr(m.portfolio || "") + '"';
        html += ' data-github="' + escapeAttr(m.github || "") + '"';
        html += ' data-twitter="' + escapeAttr(m.twitter || "") + '"';
        html += ' data-linkedin="' + escapeAttr(m.linkedin || "") + '">';

        html += '<div class="tn-body">';
        html += '<div class="tn-avatar"><img src="assets/img/' + escapeAttr(m.image) + '" alt="" width="40" height="40" loading="lazy" /></div>';
        html += '<div class="tn-content">';
        html += '<span class="tn-role">' + escapeHtml(m.role) + '</span>';
        html += '<h3 class="tn-name">' + escapeHtml(m.name) + '</h3>';
        html += '<span class="tn-class">' + escapeHtml(yearClass) + '</span>';
        html += '</div></div>';

        html += '<div class="tn-bar-wrap"><div class="tn-bar-fill" style="width: ' + progress + '%;"></div></div>';
        html += '</article>';
      });

      html += '</div></section>';
    });

    html += '</div>';
    container.innerHTML = html;

    canvas = container.querySelector(".tree-canvas");
    svg = container.querySelector(".tree-svg");

    setupInteractions();
    setupPan();

    requestAnimationFrame(function () {
      centerTree();
      updateLines();
    });

    // Resize observer
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        requestAnimationFrame(updateLines);
      });
      ro.observe(canvas);
      ro.observe(container);
    } else {
      window.addEventListener("resize", function () {
        requestAnimationFrame(updateLines);
      });
    }
  }

  function centerTree() {
    if (!container || !canvas) return;
    if (canvas.scrollWidth > container.clientWidth) {
      container.scrollLeft = (canvas.scrollWidth - container.clientWidth) / 2;
    }
  }

  function updateLines() {
    if (!svg || !canvas) return;
    var canvasRect = canvas.getBoundingClientRect();
    var cW = canvas.scrollWidth;
    var cH = canvas.scrollHeight;

    svg.setAttribute("viewBox", "0 0 " + cW + " " + cH);
    svg.style.width = cW + "px";
    svg.style.height = cH + "px";

    CONNECTIONS.forEach(function (c, idx) {
      var pEl = canvas.querySelector('.tree-node[data-name="' + c.from + '"]');
      var chEl = canvas.querySelector('.tree-node[data-name="' + c.to + '"]');
      var path = svg.querySelector('.tree-edge[data-index="' + idx + '"]');
      if (!pEl || !chEl || !path) return;

      var pr = pEl.getBoundingClientRect();
      var chr = chEl.getBoundingClientRect();

      var x1 = pr.left + pr.width / 2 - canvasRect.left;
      var y1 = pr.bottom - canvasRect.top;
      var x2 = chr.left + chr.width / 2 - canvasRect.left;
      var y2 = chr.top - canvasRect.top;
      var dy = Math.max(20, y2 - y1);

      // Smooth S-curve (Cubic Bezier)
      var d = "M " + x1.toFixed(1) + " " + y1.toFixed(1) +
              " C " + x1.toFixed(1) + " " + (y1 + dy * 0.5).toFixed(1) +
              ", " + x2.toFixed(1) + " " + (y2 - dy * 0.5).toFixed(1) +
              ", " + x2.toFixed(1) + " " + y2.toFixed(1);
      path.setAttribute("d", d);
    });
  }

  function setupInteractions() {
    var nodes = canvas.querySelectorAll(".tree-node");
    nodes.forEach(function (node) {
      var name = node.dataset.name;
      var accent = node.dataset.accent || "#17dd62";

      node.addEventListener("pointerenter", function () {
        highlightGraph(name, accent);
      });

      node.addEventListener("pointerleave", function () {
        clearGraphHighlight();
      });

      node.addEventListener("focus", function () {
        highlightGraph(name, accent);
      });

      node.addEventListener("blur", function () {
        clearGraphHighlight();
      });
    });
  }

  function highlightGraph(name, accent) {
    var edges = svg.querySelectorAll(".tree-edge");
    var nodes = canvas.querySelectorAll(".tree-node");

    edges.forEach(function (e) {
      if (e.dataset.from === name || e.dataset.to === name) {
        e.classList.add("edge-highlight");
        e.classList.remove("edge-dim");
        e.style.setProperty("--edge-color", accent);
        e.style.setProperty("--edge-glow", hexToRgba(accent, 0.7));
      } else {
        e.classList.remove("edge-highlight");
        e.classList.add("edge-dim");
      }
    });

    nodes.forEach(function (n) {
      if (n.dataset.name === name) {
        n.classList.add("node-active");
        n.classList.remove("node-dim");
      } else {
        var isLinked = CONNECTIONS.some(function (c) {
          return (c.from === name && c.to === n.dataset.name) ||
                 (c.to === name && c.from === n.dataset.name);
        });
        if (isLinked) {
          n.classList.remove("node-dim");
        } else {
          n.classList.add("node-dim");
        }
      }
    });
  }

  function clearGraphHighlight() {
    svg.querySelectorAll(".tree-edge").forEach(function (e) {
      e.classList.remove("edge-highlight", "edge-dim");
    });
    canvas.querySelectorAll(".tree-node").forEach(function (n) {
      n.classList.remove("node-active", "node-dim");
    });
  }

  function setupPan() {
    var isDown = false, startX, scrollLeft;
    container.addEventListener("mousedown", function (e) {
      if (e.target.closest(".tree-node") || e.target.closest("button")) return;
      isDown = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    });
    window.addEventListener("mouseup", function () { isDown = false; });
    container.addEventListener("mousemove", function (e) {
      if (!isDown) return;
      e.preventDefault();
      var x = e.pageX - container.offsetLeft;
      var walk = (x - startX) * 1.4;
      container.scrollLeft = scrollLeft - walk;
    });
  }

  function hexToRgba(hex, alpha) {
    hex = (hex || "#17dd62").replace("#", "");
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var num = parseInt(hex, 16);
    return "rgba(" + ((num >> 16) & 255) + "," + ((num >> 8) & 255) + "," + (num & 255) + "," + alpha + ")";
  }

  function escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function escapeAttr(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
