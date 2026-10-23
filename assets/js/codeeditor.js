// Code editor highlight — overlay render + bracket/indent helpers.
window.CCLTCE_CE = (function () {
  var KW = {
    js: /^(function|return|var|let|const|if|else|for|while|do|break|continue|new|typeof|null|undefined|true|false|this|class|import|export|async|await|try|catch|throw|switch|case|default|in|of|void|yield|static|get|set)$/,
    py: /^(def|return|if|elif|else|for|while|break|continue|import|from|as|class|try|except|finally|raise|with|lambda|None|True|False|and|or|not|in|is|pass|global|yield|assert|del|async|await)$/,
  };
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function hlLine(line, lang) {
    var out = "", i = 0;
    while (i < line.length) {
      if (line[i] === "/" && line[i + 1] === "/") return out + '<span class="ce-c">' + esc(line.slice(i)) + "</span>";
      if (line[i] === "#") return out + '<span class="ce-c">' + esc(line.slice(i)) + "</span>";
      if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
        var q = line[i], j = i + 1;
        while (j < line.length && line[j] !== q) { if (line[j] === "\\") j++; j++; }
        out += '<span class="ce-s">' + esc(line.slice(i, j + 1)) + "</span>"; i = j + 1; continue;
      }
      var m = /^[A-Za-z_$][\w$]*/.exec(line.slice(i));
      if (m) {
        var w = m[0];
        if (KW[lang] && KW[lang].test(w)) out += '<span class="ce-k">' + esc(w) + "</span>";
        else if (line[i + w.length] === "(") out += '<span class="ce-f">' + esc(w) + "</span>";
        else out += esc(w);
        i += w.length; continue;
      }
      var n = /^\d+\.?\d*/.exec(line.slice(i));
      if (n) { out += '<span class="ce-n">' + esc(n[0]) + "</span>"; i += n[0].length; continue; }
      out += esc(line[i]); i++;
    }
    return out;
  }
  function render(hl, gut, ta, lang) {
    var lines = ta.value.split("\n"), html = "";
    for (var i = 0; i < lines.length; i++) html += hlLine(lines[i], lang) + "\n";
    hl.innerHTML = html + "\n";
    gut.textContent = lines.map(function (_, i) { return i + 1; }).join("\n");
  }
  return { hlLine: hlLine, render: render, esc: esc };
})();
