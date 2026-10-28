// CCLTCE — Team Hierarchy Interactive Graph
// Dynamic Bezier connector renderer, glowing flows, responsive panning, and view toggle.
(function () {
  "use strict";

  var TIERS = [
    {
      tier: 0,
      members: ["Aakash Gupta", "Nitesh Yadav"]
    },
    {
      tier: 1,
      members: ["Vivek Tiwari"]
    },
    {
      tier: 2,
      members: ["Sachin Yadav", "Ayush Vishwakarma", "Shashank Suryawanshi"]
    },
    {
      tier: 3,
      members: ["Rashi Kasotiya", "Samiksha Patil", "Sanjana Jagtap", "Adarsh Mishra", "Rushi Jadhav"]
    }
  ];

  var CONNECTIONS = [
    // Tier 0 -> Tier 1 (Presidents -> Vice President)
    { from: "Aakash Gupta", to: "Vivek Tiwari", grad: "grad-pres" },
    { from: "Nitesh Yadav", to: "Vivek Tiwari", grad: "grad-pres" },

    // Tier 1 -> Tier 2 (Vice President -> Core Officers)
    { from: "Vivek Tiwari", to: "Sachin Yadav", grad: "grad-vp" },
    { from: "Vivek Tiwari", to: "Ayush Vishwakarma", grad: "grad-vp" },
    { from: "Vivek Tiwari", to: "Shashank Suryawanshi", grad: "grad-vp" },

    // Tier 2 -> Tier 3 (Core Officers -> Domain Leads)
    { from: "Sachin Yadav", to: "Rashi Kasotiya", grad: "grad-core" },
    { from: "Sachin Yadav", to: "Samiksha Patil", grad: "grad-core" },
    { from: "Ayush Vishwakarma", to: "Samiksha Patil", grad: "grad-core" },
    { from: "Ayush Vishwakarma", to: "Sanjana Jagtap", grad: "grad-core" },
    { from: "Ayush Vishwakarma", to: "Adarsh Mishra", grad: "grad-core" },
    { from: "Ayush Vishwakarma", to: "Rushi Jadhav", grad: "grad-core" },
    { from: "Shashank Suryawanshi", to: "Adarsh Mishra", grad: "grad-core" },
    { from: "Shashank Suryawanshi", to: "Rushi Jadhav", grad: "grad-core" }
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
  var currentScale = 1.0;
  var isAutoFitted = false;

  function init() {
    container = document.getElementById("team-tree");
    if (!container) return;

    wireViewSwitchers();
    wireCanvasTools();

    document.body.classList.remove("team-mode-grid");
    document.body.classList.add("team-mode-tree");

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

  function wireViewSwitchers() {
    var btnTree = document.getElementById("btn-mode-tree");
    var btnGrid = document.getElementById("btn-mode-grid");
    var canvasTools = document.getElementById("team-canvas-tools");
    var hint = document.getElementById("team-ctrl-hint");

    if (btnTree) {
      btnTree.addEventListener("click", function () {
        btnTree.classList.add("active");
        btnTree.setAttribute("aria-selected", "true");
        if (btnGrid) {
          btnGrid.classList.remove("active");
          btnGrid.setAttribute("aria-selected", "false");
        }
        document.body.classList.remove("team-mode-grid");
        document.body.classList.add("team-mode-tree");
        if (canvasTools) canvasTools.style.display = "";
        if (hint) hint.innerHTML = 'Tap any member to inspect bio &amp; stats • Drag canvas to pan';
        requestAnimationFrame(function () {
          if (window.innerWidth < 900) applyFit(false);
          else { centerTree(); updateLines(); }
        });
      });
    }

    if (btnGrid) {
      btnGrid.addEventListener("click", function () {
        btnGrid.classList.add("active");
        btnGrid.setAttribute("aria-selected", "true");
        if (btnTree) {
          btnTree.classList.remove("active");
          btnTree.setAttribute("aria-selected", "false");
        }
        document.body.classList.add("team-mode-grid");
        document.body.classList.remove("team-mode-tree");
        if (canvasTools) canvasTools.style.display = "none";
        if (hint) hint.innerHTML = 'Showing all 11 core team members &amp; domain leads';
      });
    }
  }

  function wireCanvasTools() {
    var btnFit = document.getElementById("btn-tree-fit");
    var btnZoomIn = document.getElementById("btn-tree-zoom-in");
    var btnZoomOut = document.getElementById("btn-tree-zoom-out");
    var btnReset = document.getElementById("btn-tree-reset");

    if (btnFit) {
      btnFit.addEventListener("click", function () {
        applyFit(true);
      });
    }
    if (btnZoomIn) {
      btnZoomIn.addEventListener("click", function () {
        zoomBy(0.15);
      });
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener("click", function () {
        zoomBy(-0.15);
      });
    }
    if (btnReset) {
      btnReset.addEventListener("click", function () {
        resetZoom(true);
      });
    }
  }

  function applyFit(smooth) {
    if (!container || !canvas) return;
    var availW = container.clientWidth - 16;
    var naturalW = canvas.scrollWidth || 1200;
    if (availW <= 0 || naturalW <= 0) return;

    var targetScale = Math.min(1.0, Math.max(0.2, availW / naturalW));
    setScale(targetScale, smooth);
    isAutoFitted = true;
    container.scrollLeft = 0;
  }

  function zoomBy(delta) {
    var target = Math.min(1.5, Math.max(0.2, currentScale + delta));
    isAutoFitted = false;
    setScale(target, true);
  }

  function resetZoom(smooth) {
    isAutoFitted = false;
    setScale(1.0, smooth);
    centerTree();
  }

  function setScale(scale, smooth) {
    if (!canvas || !container) return;
    currentScale = scale;
    if (smooth) {
      canvas.style.transition = "transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.2)";
    } else {
      canvas.style.transition = "none";
    }

    var naturalW = canvas.scrollWidth || 1200;
    var naturalH = canvas.scrollHeight || 800;

    canvas.style.transformOrigin = "0 0";
    var scaledW = naturalW * currentScale;
    var offsetX = 0;
    if (scaledW < container.clientWidth) {
      offsetX = Math.max(0, Math.round((container.clientWidth - scaledW) / 2));
    }
    canvas.style.transform = "translate(" + offsetX + "px, 0px) scale(" + currentScale.toFixed(4) + ")";

    // Adjust container height to avoid awkward empty space beneath scaled canvas
    if (currentScale < 1.0) {
      container.style.height = Math.round(naturalH * currentScale + 28) + "px";
      container.style.overflowX = (scaledW > container.clientWidth) ? "auto" : "hidden";
    } else {
      container.style.height = "";
      container.style.overflowX = "auto";
    }

    requestAnimationFrame(updateLines);
  }

  function buildTree(list) {
    if (!container || !list || !list.length) return;
    teamData = list;
    var memberMap = {};
    list.forEach(function (m) { memberMap[m.name] = m; });

    var html = '<div class="tree-canvas">';
    html += '<svg class="tree-svg" aria-hidden="true">';
    
    // SVG Gradients & Filters
    html += '<defs>';
    html += '<linearGradient id="grad-pres" x1="0%" y1="0%" x2="0%" y2="100%">';
    html += '<stop offset="0%" stop-color="#facc15" /><stop offset="100%" stop-color="#17dd62" />';
    html += '</linearGradient>';
    html += '<linearGradient id="grad-vp" x1="0%" y1="0%" x2="0%" y2="100%">';
    html += '<stop offset="0%" stop-color="#17dd62" /><stop offset="100%" stop-color="#06b6d4" />';
    html += '</linearGradient>';
    html += '<linearGradient id="grad-core" x1="0%" y1="0%" x2="0%" y2="100%">';
    html += '<stop offset="0%" stop-color="#06b6d4" /><stop offset="100%" stop-color="#c084fc" />';
    html += '</linearGradient>';
    html += '<filter id="tree-glow" x="-20%" y="-20%" width="140%" height="140%">';
    html += '<feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#17dd62" flood-opacity="0.8"/>';
    html += '</filter>';
    html += '</defs>';

    CONNECTIONS.forEach(function (c, idx) {
      html += '<path class="tree-edge ' + c.grad + '" data-from="' + escapeAttr(c.from) + '" data-to="' + escapeAttr(c.to) + '" data-index="' + idx + '" stroke="url(#' + c.grad + ')"></path>';
    });
    html += '</svg>';

    TIERS.forEach(function (t) {
      html += '<section class="tree-tier" data-tier="' + t.tier + '">';
      html += '<div class="tree-tier-nodes">';

      t.members.forEach(function (name) {
        var m = memberMap[name];
        if (!m) return;
        var progress = PROGRESS_MAP[name] || 90;
        var accent = m.accent || "#17dd62";
        var yearClass = (m.area || "").split("•")[0].trim() || "MEMBER";
        var roleLabel = cleanRole(m.role);

        html += '<article class="tree-node" tabindex="0" role="button" aria-haspopup="dialog"';
        html += ' style="--accent: ' + accent + '; --accent-glow: ' + hexToRgba(accent, 0.45) + ';"';
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
        html += '<div class="tn-avatar"><img src="assets/img/' + escapeAttr(m.image) + '" alt="" width="38" height="38" loading="lazy" /></div>';
        html += '<div class="tn-content">';
        html += '<span class="tn-role">' + escapeHtml(roleLabel) + '</span>';
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
      if (window.innerWidth < 900) {
        applyFit(false);
      } else {
        centerTree();
        updateLines();
      }
    });

    // Resize handling
    window.addEventListener("resize", function () {
      if (window.innerWidth < 900 || isAutoFitted) {
        applyFit(false);
      } else {
        updateLines();
      }
    });
  }

  function centerTree() {
    if (!container || !canvas) return;
    if (canvas.scrollWidth > container.clientWidth) {
      container.scrollLeft = (canvas.scrollWidth - container.clientWidth) / 2;
    }
  }

  function updateLines() {
    if (!svg || !canvas) return;
    var cW = canvas.offsetWidth || 1200;
    var cH = canvas.offsetHeight || 800;

    svg.setAttribute("viewBox", "0 0 " + cW + " " + cH);
    svg.style.width = cW + "px";
    svg.style.height = cH + "px";

    var canvasRect = canvas.getBoundingClientRect();
    var s = canvasRect.width / cW || 1;

    CONNECTIONS.forEach(function (c, idx) {
      var pEl = canvas.querySelector('.tree-node[data-name="' + c.from + '"]');
      var chEl = canvas.querySelector('.tree-node[data-name="' + c.to + '"]');
      var path = svg.querySelector('.tree-edge[data-index="' + idx + '"]');
      if (!pEl || !chEl || !path) return;

      var pr = pEl.getBoundingClientRect();
      var chr = chEl.getBoundingClientRect();

      // Transform viewport boundingClientRect back to unscaled canvas coordinate space
      var x1 = (pr.left + pr.width / 2 - canvasRect.left) / s;
      var y1 = (pr.bottom - canvasRect.top) / s;
      var x2 = (chr.left + chr.width / 2 - canvasRect.left) / s;
      var y2 = (chr.top - canvasRect.top) / s;
      var dy = Math.max(20, y2 - y1);

      // Smooth S-curve (Cubic Bezier)
      var d = "M " + x1.toFixed(1) + " " + y1.toFixed(1) +
              " C " + x1.toFixed(1) + " " + (y1 + dy * 0.52).toFixed(1) +
              ", " + x2.toFixed(1) + " " + (y2 - dy * 0.52).toFixed(1) +
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

      // Mobile touch tap highlight
      node.addEventListener("click", function () {
        highlightGraph(name, accent);
      });
    });

    // Tap background canvas to clear highlight
    canvas.addEventListener("click", function (e) {
      if (!e.target.closest(".tree-node")) {
        clearGraphHighlight();
      }
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
        e.style.setProperty("--edge-glow", hexToRgba(accent, 0.8));
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

    container.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".tree-node") || e.target.closest("button") || e.target.closest("a")) return;
      isDown = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    });

    window.addEventListener("pointerup", function () { isDown = false; });
    window.addEventListener("pointercancel", function () { isDown = false; });

    container.addEventListener("pointermove", function (e) {
      if (!isDown) return;
      var x = e.pageX - container.offsetLeft;
      var walkX = (x - startX) * 1.3;
      container.scrollLeft = scrollLeft - walkX;
    });
  }

  function cleanRole(role) {
    if (!role) return "";
    if (/documentation/i.test(role)) return "Docs & Content";
    if (/social media/i.test(role)) return "Socials & Publicity";
    return role;
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
