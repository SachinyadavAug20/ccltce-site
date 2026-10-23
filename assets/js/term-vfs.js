// Terminal virtual file system — built at runtime from data/content.json.
(function () {
  function fromContent(data) {
    var team = (data.team || []).map(function (m) {
      return {
        name: m.name, role: m.role, track: m.area, item: m.item,
        github: m.github, bio: m.bio,
        stack: m.area.split(/[&,]/).map(function (s) { return s.trim(); }).filter(Boolean),
      };
    });
    return {
      "/home/ccltce": { type: "dir", kids: ["team.json", "events.md", "notices.txt", "secrets/"] },
      "/home/ccltce/team.json": { type: "file", body: JSON.stringify(team, null, 1) },
      "/home/ccltce/events.md": {
        type: "file",
        body: (data.events || []).map(function (e) {
          return "## " + e.title + "\n" + e.date + "\n" + e.desc;
        }).join("\n\n") || "No upcoming events.",
      },
      "/home/ccltce/notices.txt": {
        type: "file",
        body: (data.notices || []).map(function (n) {
          return "[" + n.tag + "] " + n.title + " — " + n.body;
        }).join("\n") || "No notices.",
      },
      "/home/ccltce/secrets": { type: "dir", kids: ["coordinates.dat"] },
      "/home/ccltce/secrets/coordinates.dat": {
        type: "file",
        body: "455a474154592f242c3b252223253922273b2d2222222f5941565038565458454046",
      },
    };
  }

  function decodeHex(s) {
    var out = "";
    for (var i = 0; i + 1 < s.length; i += 2) out += String.fromCharCode(parseInt(s.substr(i, 2), 16) ^ 0x15);
    return out;
  }

  window.CCLTCE_VFS = {
    root: "/home/ccltce",
    files: {},
    load: function (data) { this.files = fromContent(data); },
    get: function (path) {
      var p = path.replace(/\/+$/, "") || "/";
      if (this.files[p]) return this.files[p];
      if (this.files[this.root + "/" + p.replace(/^\//, "")]) return this.files[this.root + "/" + p.replace(/^\//, "")];
      return null;
    },
    members: function () {
      try { return JSON.parse(this.files["/home/ccltce/team.json"].body); }
      catch (e) { return []; }
    },
    decode: decodeHex,
  };
})();
