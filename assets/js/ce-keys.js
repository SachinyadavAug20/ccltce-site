// Code editor keybindings — tab, auto-indent, bracket close, backspace indent.
window.CCLTCE_CE_KEYS = (function () {
  var PAIRS = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'", "`": "`" };
  function attach(ta, onChange) {
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        e.preventDefault();
        var s = ta.selectionStart, en = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(en);
        ta.selectionStart = ta.selectionEnd = s + 2; onChange(); return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        var pos = ta.selectionStart, before = ta.value.slice(0, pos);
        var cur = before.slice(before.lastIndexOf("\n") + 1);
        var indent = (cur.match(/^\s*/) || [""])[0];
        if (/[{([]\s*$/.test(cur)) indent += "  ";
        ta.value = before + "\n" + indent + ta.value.slice(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = pos + 1 + indent.length; onChange(); return;
      }
      if (PAIRS[e.key] && ta.selectionStart === ta.selectionEnd) {
        e.preventDefault();
        var p = ta.selectionStart;
        ta.value = ta.value.slice(0, p) + e.key + PAIRS[e.key] + ta.value.slice(p);
        ta.selectionStart = ta.selectionEnd = p + 1; onChange(); return;
      }
      if (e.key === "Backspace" && ta.selectionStart === ta.selectionEnd) {
        var b = ta.value.slice(0, ta.selectionStart), c = b.slice(b.lastIndexOf("\n") + 1);
        if (c === "  " || c === "    ") {
          e.preventDefault();
          ta.value = ta.value.slice(0, ta.selectionStart - 2) + ta.value.slice(ta.selectionStart);
          ta.selectionStart = ta.selectionEnd = ta.selectionStart - 2; onChange();
        }
      }
    });
  }
  return { attach: attach };
})();
