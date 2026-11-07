// Code golf — multi-language (JS, Python, C++), daily puzzles, workers + Pyodide.
// 10,000 procedurally generated CF-style puzzles (35 families × ~286 seeded variants),
// deterministic per UTC day so every miner gets the same quest.
(function () {
  var mount = document.querySelector("[data-golf]");
  if (!mount) return;

  // ---------- deterministic RNG ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function ri(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

  // ---------- reference helpers ----------
  function digitSum(n) { n = Math.abs(n); var s = 0; while (n > 0) { s += n % 10; n = Math.floor(n / 10); } return s; }
  function isPow2(n) { return n > 0 && (n & (n - 1)) === 0; }
  function popcount(n) { var c = 0; while (n > 0) { n &= n - 1; c++; } return c; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function revDigits(n) { var r = 0; n = Math.abs(n); while (n > 0) { r = r * 10 + n % 10; n = Math.floor(n / 10); } return r; }
  function collatz(n) { var s = 0; while (n !== 1) { n = n % 2 === 0 ? n / 2 : 3 * n + 1; s++; } return s; }
  function digitalRoot(n) { while (n > 9) n = digitSum(n); return n; }
  function isPal(s) { for (var i = 0, j = s.length - 1; i < j; i++, j--) if (s[i] !== s[j]) return false; return true; }
  function binStr(n) { return n.toString(2); }
  function shuffle(rng, arr) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function letters(rng, n) {
    var ALPHA = "abcdefghijklmnopqrstuvwxyz";
    var s = ""; for (var i = 0; i < n; i++) s += ALPHA[Math.floor(rng() * 26)];
    return s;
  }

  // ---------- 35 puzzle families (CF 800 / 900 / 1000 style) ----------
  // Each make(rng) returns { prompt, tests, params, cppRet, cppArgs }.
  // tests: 2 random cases + 1 crafted edge case. Expected values come from a
  // reference solver, so they are always correct.
  var FAMILIES = [
    // ================= 800 =================
    { rate: 800, params: ["n"], cppRet: "int", cppArgs: "int n", make: function (r) {
      var a = ri(r, -500, -1), b = ri(r, 1, 500), n = r() < 0.15 ? 0 : ri(r, -500, 500);
      return { prompt: "You are given an integer n (−500 ≤ n ≤ 500). Return −n.", tests: [[a, -a], [b, -b], [n, -n]] };
    } },
    { rate: 800, params: ["a", "b"], cppRet: "int", cppArgs: "int a, int b", make: function (r) {
      var a = ri(r, 1, 999), b = ri(r, 1, 999), a1 = ri(r, 1, 999), b1 = ri(r, 1, 999);
      return { prompt: "Given integers a and b (1 ≤ a,b ≤ 999), return a XOR b.", tests: [[a1, b1, a1 ^ b1], [a, b, a ^ b], [a, a, 0]] };
    } },
    { rate: 800, params: ["n"], cppRet: "int", cppArgs: "int n", make: function (r) {
      var n1 = ri(r, 10, 9999), n = ri(r, 1, 99999);
      return { prompt: "You are given an integer n (1 ≤ n ≤ 99999). Return the sum of its digits.", tests: [[n1, digitSum(n1)], [n, digitSum(n)], [99999, 45]] };
    } },
    { rate: 800, params: ["s"], cppRet: "int", cppArgs: "string s", make: function (r) {
      var s1 = pick(r, ["cat", "mine", "code"]), s = letters(r, ri(r, 3, 12));
      return { prompt: "Given a lowercase string s (3 ≤ |s| ≤ 12), count its vowels (a, e, i, o, u).",
        tests: [[s1, (s1.match(/[aeiou]/g) || []).length], [s, (s.match(/[aeiou]/g) || []).length], ["xyz", 0]] };
    } },
    { rate: 800, params: ["arr"], cppRet: "int", cppArgs: "vector<int> arr", make: function (r) {
      var arr = []; for (var i = 0, L = ri(r, 2, 8); i < L; i++) arr.push(ri(r, -50, 50));
      var one = [ri(r, -50, 50)];
      return { prompt: "Given an array of integers, return the sum of all elements.",
        tests: [[arr, arr.reduce(function (a, b) { return a + b; }, 0)], [one, one[0]], [[0, 0, 0], 0]] };
    } },
    { rate: 800, params: ["arr"], cppRet: "int", cppArgs: "vector<int> arr", make: function (r) {
      return { prompt: "Given an array, return the number of elements in it.", tests: [[ri(r, 1, 9), 0], [[1, 2, 3], 3], [[], 0]] };
    } },
    { rate: 800, params: ["arr"], cppRet: "int", cppArgs: "vector<int> arr", make: function (r) {
      var a1 = ri(r, 0, 9), a2 = ri(r, 0, 9), a3 = ri(r, 0, 9), a4 = ri(r, 0, 9);
      return { prompt: "Given an array, return the number of elements in it.",
        tests: [[[a1, a2, a3], 3], [[a1, a2, a3, a4], 4], [[], 0]] };
    } },
    { rate: 800, params: ["a", "b"], cppRet: "vector<int>", cppArgs: "int a, int b", make: function (r) {
      var a = ri(r, -99, 99), b = ri(r, -99, 99), a1 = ri(r, -99, 99), b1 = ri(r, -99, 99);
      return { prompt: "Swap trick: given a and b, return them swapped — i.e. [b, a].",
        tests: [[a1, b1, [b1, a1]], [a, b, [b, a]], [7, 7, [7, 7]]] };
    } },
    { rate: 800, params: ["n"], cppRet: "int", cppArgs: "int n", make: function (r) {
      var n1 = ri(r, 0, 500), n = r() < 0.4 ? -ri(r, 1, 100) : ri(r, 0, 500);
      var mod = function (x) { return ((x % 7) + 7) % 7; };
      return { prompt: "Return the non-negative remainder of n divided by 7. Watch out: n can be negative!",
        tests: [[n1, mod(n1)], [n, mod(n)], [-1, 6]] };
    } },
    { rate: 800, params: ["n"], cppRet: "bool", cppArgs: "int n", make: function (r) {
      var n1 = ri(r, 1, 999), n = ri(r, 1, 9999);
      return { prompt: "Return true if n is divisible by 9, else false. (Digit-sum hint.)",
        tests: [[n1, n1 % 9 === 0], [n, n % 9 === 0], [9999, true]] };
    } },
    { rate: 800, params: ["arr"], cppRet: "auto", cppArgs: "vector<int> arr", make: function (r) {
      var arr = []; for (var i = 0, L = ri(r, 1, 6); i < L; i++) arr.push(ri(r, -20, 20));
      var one = [ri(r, -20, 20)];
      return { prompt: "Given a non-empty array, return its last element.",
        tests: [[arr, arr[arr.length - 1]], [one, one[0]], [[5, 9], 9]] };
    } },
    { rate: 800, params: ["arr"], cppRet: "int", cppArgs: "vector<int> arr", make: function (r) {
      var arr = []; for (var i = 0, L = ri(r, 2, 8); i < L; i++) arr.push(ri(r, -30, 30));
      var want = 0; for (var i = 0; i < arr.length; i += 2) want += arr[i];
      return { prompt: "Return the sum of elements at even indices (0, 2, 4, …).",
        tests: [[arr, want], [[10, -5], 10], [[1, 1, 1, 1], 2]] };
    } },
    { rate: 800, params: ["a", "b"], cppRet: "int", cppArgs: "int a, int b", make: function (r) {
      var a = ri(r, -30, 30), b = ri(r, -30, 30), a1 = ri(r, -30, 30), b1 = ri(r, -30, 30);
      var want = function (x, y) { return (x + y) * (x + y) - (x - y) * (x - y); };
      return { prompt: "Given a and b, return (a+b)² − (a−b)². One-line math hint exists.",
        tests: [[a1, b1, want(a1, b1)], [a, b, want(a, b)], [0, 9, 0]] };
    } },
    // ================= 900 =================
    { rate: 900, params: ["a", "b"], cppRet: "int", cppArgs: "int a, int b", make: function (r) {
      var a = ri(r, -1000, 1000), b = ri(r, -1000, 1000), a1 = ri(r, -1000, 1000), b1 = ri(r, -1000, 1000);
      return { prompt: "Return the larger of two integers a and b.",
        tests: [[a1, b1, a1 > b1 ? a1 : b1], [a, b, a > b ? a : b], [5, 5, 5]] };
    } },
    { rate: 900, params: ["n"], cppRet: "bool", cppArgs: "int n", make: function (r) {
      var n1 = ri(r, 10, 999), n = ri(r, 1, 99999);
      return { prompt: "Return true if the digit-sum of n is odd, else false.",
        tests: [[n1, digitSum(n1) % 2 === 1], [n, digitSum(n) % 2 === 1], [100, false]] };
    } },
    { rate: 900, params: ["arr"], cppRet: "int", cppArgs: "vector<int> arr", make: function (r) {
      var set = []; while (set.length < 7) { var v = ri(r, -100, 100); if (set.indexOf(v) === -1) set.push(v); }
      var arr = shuffle(r, set.slice(0, ri(r, 3, 7)));
      var mx = Math.max.apply(null, arr);
      var second = Math.max.apply(null, arr.filter(function (x) { return x !== mx; }));
      return { prompt: "Given an array of distinct integers (length ≥ 2), return the second largest element.",
        tests: [[arr, second], [[3, 1, 2], 2], [[-5, -1, -3], -3]] };
    } },
    { rate: 900, params: ["n"], cppRet: "bool", cppArgs: "int n", make: function (r) {
      var n1 = ri(r, 1, 1000), n = r() < 0.5 ? Math.pow(2, ri(r, 0, 12)) : ri(r, 3, 4095);
      return { prompt: "Return true if n is a power of two (1, 2, 4, 8, …), else false. Bit-trick encouraged.",
        tests: [[n1, isPow2(n1)], [n, isPow2(n)], [1, true]] };
    } },
    { rate: 900, params: ["s"], cppRet: "bool", cppArgs: "string s", make: function (r) {
      var s = letters(r, ri(r, 2, 10));
      if (r() < 0.4) { var h = s.slice(0, Math.ceil(s.length / 2)); s = h + h.split("").reverse().join(""); }
      return { prompt: "Return true if the lowercase string s is a palindrome, else false.",
        tests: [[pick(r, ["abba", "level", "noon"]), true], [s, isPal(s)], ["ab", false]] };
    } },
    { rate: 900, params: ["n"], cppRet: "string", cppArgs: "int n", make: function (r) {
      function fb(x) { return x % 15 === 0 ? "FizzBuzz" : x % 3 === 0 ? "Fizz" : x % 5 === 0 ? "Buzz" : String(x); }
      var n1 = ri(r, 1, 100), n = ri(r, 1, 100);
      return { prompt: "Classic trial: if n is divisible by 3 return \"Fizz\", by 5 \"Buzz\", by both \"FizzBuzz\", otherwise return n as a string.",
        tests: [[n1, fb(n1)], [n, fb(n)], [15, "FizzBuzz"]] };
    } },
    { rate: 900, params: ["s"], cppRet: "int", cppArgs: "string s", make: function (r) {
      var L = ri(r, 1, 10), b = "1"; for (var i = 1; i < L; i++) b += Math.floor(r() * 2);
      return { prompt: "Given a binary string s (no leading zeros, |s| ≤ 10), return its decimal value.",
        tests: [[b, parseInt(b, 2)], ["1010", 10], ["1", 1]] };
    } },
    { rate: 900, params: ["n"], cppRet: "string", cppArgs: "int n", make: function (r) {
      var n1 = ri(r, 1, 500), n = ri(r, 1, 500);
      return { prompt: "Given an integer n (1 ≤ n ≤ 500), return its binary representation as a string.",
        tests: [[n1, binStr(n1)], [n, binStr(n)], [1, "1"]] };
    } },
    { rate: 900, params: ["arr"], cppRet: "int", cppArgs: "vector<int> arr", make: function (r) {
      var n = ri(r, 3, 9), miss = ri(r, 1, n), arr = [];
      for (var i = 1; i <= n; i++) if (i !== miss) arr.push(i);
      shuffle(r, arr);
      return { prompt: "An array holds every integer from 1..n except one (n ≤ 9). Return the missing number.",
        tests: [[arr, miss], [[1, 2, 4], 3], [[2], 1]] };
    } },
    { rate: 900, params: ["n"], cppRet: "int", cppArgs: "int n", make: function (r) {
      var n1 = ri(r, 2, 27), n = ri(r, 1, 27);
      return { prompt: "Collatz walk: repeatedly halve n if even, else do 3n+1, until you hit 1. Return the number of steps.",
        tests: [[n1, collatz(n1)], [n, collatz(n)], [1, 0]] };
    } },
    { rate: 900, params: ["a", "b", "c"], cppRet: "int", cppArgs: "int a, int b, int c", make: function (r) {
      var a = ri(r, 0, 50), b = ri(r, 0, 50), c = ri(r, 0, 50);
      var a1 = ri(r, 0, 50), b1 = ri(r, 0, 50), c1 = ri(r, 0, 50);
      var w = function (x, y, z) { return x === y && y === z ? -1 : Math.max(x, y, z); };
      return { prompt: "Return the largest of a, b, c — but if all three are equal, return −1 instead.",
        tests: [[a1, b1, c1, w(a1, b1, c1)], [a, b, c, w(a, b, c)], [7, 7, 7, -1]] };
    } },
    { rate: 900, params: ["s"], cppRet: "int", cppArgs: "string s", make: function (r) {
      var s = ""; for (var i = 0, L = ri(r, 3, 12); i < L; i++) s += pick(r, "aAbBcCdDeE".split(""));
      var s1 = pick(r, ["aBcD", "Hello", "XyZ"]);
      return { prompt: "Given a mixed-case string s, return the number of uppercase letters.",
        tests: [[s, (s.match(/[A-Z]/g) || []).length], [s1, (s1.match(/[A-Z]/g) || []).length], ["xyz", 0]] };
    } },
    { rate: 900, params: ["arr"], cppRet: "vector<int>", cppArgs: "vector<int> arr", make: function (r) {
      var arr = []; for (var i = 0, L = ri(r, 2, 7); i < L; i++) arr.push(ri(r, -50, 50));
      return { prompt: "Return the array reversed — without mutating the input if you can.",
        tests: [[arr, arr.slice().reverse()], [[1, 2], [2, 1]], [[42], [42]]] };
    } },
    // ================= 1000 =================
    { rate: 1000, params: ["n"], cppRet: "int", cppArgs: "int n", make: function (r) {
      var n1 = ri(r, 1, 1023), n = ri(r, 1, 1023);
      return { prompt: "Return the number of set bits (1s) in the binary representation of n (1 ≤ n ≤ 1023).",
        tests: [[n1, popcount(n1)], [n, popcount(n)], [1023, 10]] };
    } },
    { rate: 1000, params: ["n"], cppRet: "int", cppArgs: "int n", make: function (r) {
      var tz = function (x) { var c = 0; while (x > 0 && x % 2 === 0) { x /= 2; c++; } return c; };
      var n1 = ri(r, 1, 1023), n = r() < 0.3 ? Math.pow(2, ri(r, 0, 10)) : ri(r, 1, 1023);
      return { prompt: "Return the number of trailing zeros in the binary form of n (n ≥ 1).",
        tests: [[n1, tz(n1)], [n, tz(n)], [8, 3]] };
    } },
    { rate: 1000, params: ["arr"], cppRet: "int", cppArgs: "vector<int> arr", make: function (r) {
      var arr = []; for (var i = 0, L = ri(r, 3, 7); i < L; i++) arr.push(ri(r, 0, 9));
      var want = 0; for (var i = 0; i < arr.length; i++) for (var j = i + 1; j < arr.length; j++) if ((arr[i] + arr[j]) % 2 === 0) want++;
      return { prompt: "Count pairs (i, j) with i < j where a[i] + a[j] is even. Parity insight = O(n).",
        tests: [[arr, want], [[1, 2, 3], 1], [[2, 4, 6], 3]] };
    } },
    { rate: 1000, params: ["arr"], cppRet: "int", cppArgs: "vector<int> arr", make: function (r) {
      var arr = [], L = ri(r, 2, 8);
      for (var i = 0; i < L; i++) arr.push(ri(r, 0, 5));
      var want = 1, cur = 1;
      for (var i = 1; i < L; i++) { cur = arr[i] === arr[i - 1] ? cur + 1 : 1; if (cur > want) want = cur; }
      return { prompt: "Return the length of the longest run of equal consecutive elements in the array.",
        tests: [[arr, want], [[1, 1, 2, 2, 2, 3], 3], [[9], 1]] };
    } },
    { rate: 1000, params: ["s"], cppRet: "string", cppArgs: "string s", make: function (r) {
      var L = ri(r, 3, 10), chars = letters(r, L).split("");
      var dups = Math.floor(r() * (L - 1));
      for (var d = 0; d < dups; d++) { var i1 = Math.floor(r() * L), i2 = Math.floor(r() * L); chars[i1] = chars[i2]; }
      var s = chars.join("");
      var want = "";
      for (var i = 0; i < s.length; i++) if (s.indexOf(s[i]) === s.lastIndexOf(s[i])) { want = s[i]; break; }
      return { prompt: "Return the first character in s that does not repeat. If none exists, return the empty string.",
        tests: [[s, want], ["aabbcd", "c"], ["aabb", ""]] };
    } },
    { rate: 1000, params: ["s", "t"], cppRet: "bool", cppArgs: "string s, string t", make: function (r) {
      var L = ri(r, 3, 8), base = letters(r, L);
      var t = shuffle(r, base.split("")).join("");
      var s = base;
      if (r() < 0.4) s = letters(r, ri(r, 3, 8));
      var want = s.split("").sort().join("") === t.split("").sort().join("");
      return { prompt: "Anagram check: return true if the strings s and t contain exactly the same letters, else false.",
        tests: [[s, t, want], ["listen", "silent", true], ["abc", "abd", false]] };
    } },
    { rate: 1000, params: ["a", "b"], cppRet: "int", cppArgs: "int a, int b", make: function (r) {
      var a1 = ri(r, 1, 200), b1 = ri(r, 1, 200), a = ri(r, 1, 200), b = ri(r, 1, 200);
      return { prompt: "Return gcd(a, b) — Euclid knew the way. (1 ≤ a,b ≤ 200)",
        tests: [[a1, b1, gcd(a1, b1)], [a, b, gcd(a, b)], [12, 18, 6]] };
    } },
    { rate: 1000, params: ["n"], cppRet: "int", cppArgs: "int n", make: function (r) {
      var n1 = ri(r, 10, 9999), n = ri(r, 1, 9999);
      return { prompt: "Digital root: keep summing the digits of n until a single digit remains. Return it.",
        tests: [[n1, digitalRoot(n1)], [n, digitalRoot(n)], [9, 9]] };
    } },
    { rate: 1000, params: ["n"], cppRet: "int", cppArgs: "int n", make: function (r) {
      var n1 = ri(r, 100, 99999), n = ri(r, 100, 99999);
      return { prompt: "Reverse the digits of n mathematically (no string tricks allowed — prove you can loop).",
        tests: [[n1, revDigits(n1)], [n, revDigits(n)], [1200, 21]] };
    } },
    { rate: 1000, params: ["arr"], cppRet: "int", cppArgs: "vector<int> arr", make: function (r) {
      function maj(r) {
        var L = ri(r, 5, 9), hero = ri(r, 0, 9), arr = [];
        var hc = Math.floor(L / 2) + 1;
        for (var i = 0; i < hc; i++) arr.push(hero);
        for (var i = hc; i < L; i++) { var v = ri(r, 0, 9); if (v === hero) v = (hero + 1) % 10; arr.push(v); }
        shuffle(r, arr);
        return [arr, hero];
      }
      var p1 = maj(r), p2 = maj(r);
      return { prompt: "A majority element appears more than ⌊n/2⌋ times. Find it — in O(n) if you can.",
        tests: [p1, p2, [[2, 2, 1], 2]] };
    } },
    { rate: 1000, params: ["s"], cppRet: "int", cppArgs: "string s", make: function (r) {
      var L = ri(r, 1, 10), s = ""; for (var i = 0; i < L; i++) s += pick(r, "01".split(""));
      return { prompt: "Given a binary string s (|s| ≤ 10), return its decimal value modulo 3.",
        tests: [[s, parseInt(s, 2) % 3], ["110", 0], ["111", 1]] };
    } },
  ];

  // ---------- daily deterministic selection: 10,000 unique puzzles ----------
  var TOTAL = 10000;
  var day = Math.floor(Date.now() / 86400000); // UTC day number
  var idx = day % TOTAL;
  var fam = FAMILIES[idx % FAMILIES.length];
  var rng = mulberry32((idx * 2654435761) ^ 0x9E3779B9);
  var P = fam.make(rng);
  P.rate = fam.rate;
  P.params = fam.params; P.cppRet = fam.cppRet; P.cppArgs = fam.cppArgs;

  var LANG = "js", pyReady = null;
  var dayKey = "ccltce-miners-day" + day;

  function getTemplate(lang, pz) {
    var pStr = (pz.params || ["a", "b"]).join(", ");
    if (lang === "js") return "function solve(" + pStr + ") {\n  // your code\n}";
    if (lang === "py") return "def solve(" + pStr + "):\n    # your code\n    pass";
    if (lang === "cpp") {
      var ret = pz.cppRet || "int", args = pz.cppArgs || "int a, int b";
      var defRet = ret === "bool" ? "false" : ret === "string" ? '""' : ret === "char" ? "'\\0'" : "0";
      return ret + " solve(" + args + ") {\n    // your code\n    return " + defRet + ";\n}";
    }
    return "";
  }

  var RATE_CLASS = { 800: "golf-rate-800", 900: "golf-rate-900", 1000: "golf-rate-1000" };

  mount.innerHTML =
    '<div class="golf-card"><h3 class="golf-title">TODAY\'S 1-MINUTE MINING EXPEDITION' +
    '<span class="golf-meta"><span class="golf-rate ' + (RATE_CLASS[P.rate] || "") + '">rated ~' + P.rate + "</span>" +
    '<span class="golf-pid">quest #' + (idx + 1) + " / " + TOTAL + "</span></span></h3>" +
    '<p class="golf-prompt">' + P.prompt + "</p>" +
    '<pre class="golf-tests">' + P.tests.map(function (t, i) {
      return "T" + (i + 1) + "  " + JSON.stringify(t.slice(0, -1)) + " -> " + JSON.stringify(t[t.length - 1]);
    }).join("\n") + "</pre>" +
    '<div class="golf-lang-row"><label class="golf-lang-lbl">LANGUAGE</label><div class="golf-lang">' +
    '<button type="button" class="golf-lang-btn active" data-lang="js">JS</button>' +
    '<button type="button" class="golf-lang-btn" data-lang="py">PY</button>' +
    '<button type="button" class="golf-lang-btn" data-lang="cpp">CPP</button></div></div>' +
    '<textarea class="golf-code" spellcheck="false" rows="6"></textarea>' +
    '<div class="golf-row"><span class="golf-bytes">0 bytes</span><button class="btn golf-run" type="button">RUN</button></div>' +
    '<pre class="golf-log"></pre>' +
    '<div class="golf-board"><h4>Today\'s Miners</h4><ol class="golf-list"></ol></div></div>';

  var ta = mount.querySelector(".golf-code"), bytes = mount.querySelector(".golf-bytes"),
    log = mount.querySelector(".golf-log"), list = mount.querySelector(".golf-list"),
    runBtn = mount.querySelector(".golf-run");

  // mount code editor overlay
  var wrap = document.createElement("div");
  wrap.className = "ce-wrap";
  ta.parentNode.insertBefore(wrap, ta);
  ta.classList.add("ce-input");
  wrap.appendChild(ta);
  var gut = document.createElement("div"); gut.className = "ce-gut"; wrap.appendChild(gut);
  var hl = document.createElement("pre"); hl.className = "ce-hl"; hl.setAttribute("aria-hidden", "true"); wrap.appendChild(hl);
  function re() { if (window.CCLTCE_CE) CCLTCE_CE.render(hl, gut, ta, LANG); }
  function onChange() { re(); refresh(); }

  function setLang(l) {
    LANG = l;
    mount.querySelectorAll(".golf-lang-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.lang === l); });
    ta.value = getTemplate(l, P); re(); refresh();
  }
  mount.querySelectorAll(".golf-lang-btn").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.lang); if (window.CCLTCE_SFX) CCLTCE_SFX.click(); });
  });

  function countBytes(s) { return s.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/#[^\n]*/g, "").replace(/\s+/g, "").length; }
  function refresh() { bytes.textContent = countBytes(ta.value) + " bytes"; }
  ta.addEventListener("input", onChange);
  ta.addEventListener("scroll", function () { hl.scrollTop = ta.scrollTop; gut.scrollTop = ta.scrollTop; });
  if (window.CCLTCE_CE_KEYS) CCLTCE_CE_KEYS.attach(ta, onChange);
  setLang("js");

  function board() {
    var b = []; try { b = JSON.parse(localStorage.getItem(dayKey) || "[]"); } catch (e) {}
    b.sort(function (a, c) { return a.bytes - c.bytes; });
    list.innerHTML = b.slice(0, 5).map(function (m) { return "<li>" + m.handle + " — " + m.bytes + "B</li>"; }).join("") || "<li>no miners yet — be first</li>";
  }
  board();

  function burst() {
    var c = document.createElement("canvas"); c.className = "golf-fx"; document.body.appendChild(c);
    var g = c.getContext("2d"); c.width = innerWidth; c.height = innerHeight;
    var parts = [], COL = ["#ffaa00", "#17dd62", "#ff2222", "#ffff55"];
    for (var i = 0; i < 40; i++) parts.push({ x: innerWidth / 2, y: innerHeight / 2, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 4, s: 4 + (Math.random() * 7) | 0, c: COL[i % 4] });
    var t0 = performance.now();
    (function frame(now) {
      if ((now - t0) / 1000 > 2.2) { c.remove(); return; }
      g.clearRect(0, 0, c.width, c.height);
      parts.forEach(function (p) { p.vy += 0.5; p.x += p.vx; p.y += p.vy; if (p.y > innerHeight - p.s) { p.y = innerHeight - p.s; p.vy *= -0.55; } g.fillStyle = p.c; g.fillRect(p.x | 0, p.y | 0, p.s, p.s); });
      requestAnimationFrame(frame);
    })(t0);
  }

  function finishPass(n) {
    log.textContent += "ALL TESTS PASS — " + n + " bytes\n"; log.classList.add("golf-ok"); burst();
    if (window.CCLTCE_SFX) CCLTCE_SFX.win();
    var handle = localStorage.getItem("ccltce-handle") || ("miner-" + ((Math.random() * 900 + 100) | 0));
    localStorage.setItem("ccltce-handle", handle);
    var b = []; try { b = JSON.parse(localStorage.getItem(dayKey) || "[]"); } catch (e) {}
    b.push({ handle: handle, bytes: n }); localStorage.setItem(dayKey, JSON.stringify(b)); board();
    if (window.CCLTCE_HUD) CCLTCE_HUD.addXP(100);
  }
  function report(got, i) {
    var exp = P.tests[i][P.tests[i].length - 1];
    var ok = got === exp ||
      (typeof got === "object" && got !== null && typeof exp === "object" && exp !== null &&
        JSON.stringify(got) === JSON.stringify(exp));
    log.textContent += (ok ? "PASS" : "FAIL") + " T" + (i + 1) + " got " + JSON.stringify(got) + " want " + JSON.stringify(exp) + "\n";
    if (!ok) { log.classList.add("golf-err"); if (window.CCLTCE_SFX) CCLTCE_SFX.error(); throw new Error("fail"); }
  }
  function runJS() {
    try {
      var fn = new Function(ta.value + "\nreturn solve;")();
      P.tests.forEach(function (t, i) { report(fn.apply(null, t.slice(0, -1)), i); });
      finishPass(countBytes(ta.value));
    } catch (err) {
      if (log.textContent.indexOf("PASS") === -1) { log.textContent += "ERROR: " + (err.message || "runtime") + "\n"; log.classList.add("golf-err"); if (window.CCLTCE_SFX) CCLTCE_SFX.error(); }
    }
  }
  function transpileCPP(src) {
    var s = src;
    s = s.replace(/#include\s*<[^>]+>/g, "").replace(/#include\s*"[^"]+"/g, "");
    s = s.replace(/using\s+namespace\s+std\s*;/g, "");
    s = s.replace(/\bstd::/g, "");
    s = s.replace(/\breverse\s*\(\s*(\w+)\.begin\(\)\s*,\s*\1\.end\(\)\s*\)\s*;/g, "$1 = (Array.isArray($1) ? $1.slice().reverse() : $1.split('').reverse().join(''));");
    s = s.replace(/\.size\(\)/g, ".length").replace(/\.length\(\)/g, ".length");
    s = s.replace(/\.push_back\(([^)]+)\)/g, ".push($1)").replace(/\.pop_back\(\)/g, ".pop()");
    s = s.replace(/for\s*\(\s*(?:[\w:<>*&]+)\s+(\w+)\s*:\s*([^)]+)\)/g, "for (let $1 of $2)");
    s = s.replace(/(?:[\w:<>*&]+)\s+solve\s*\(([^)]*)\)/, function (_, args) {
      var cleanArgs = args.split(",").map(function (a) {
        return a.trim().replace(/^[\w:<>*&]+\s+/, "");
      }).filter(Boolean).join(", ");
      return "function solve(" + cleanArgs + ")";
    });
    s = s.replace(/\b(?:int|float|double|char|bool|auto|long|short|string|vector<[^>]+>)\s+([a-zA-Z_$][\w$]*)\s*(=|[;,])/g, "let $1 $2");
    return s;
  }
  function runCPP() {
    try {
      var js = transpileCPP(ta.value);
      var prelude = "var max = Math.max, min = Math.min, abs = Math.abs;\n" +
        "function tolower(c) { return String(c).toLowerCase(); }\n" +
        "function toupper(c) { return String(c).toUpperCase(); }\n";
      var fn = new Function(prelude + js + "\nreturn solve;")();
      P.tests.forEach(function (t, i) { report(fn.apply(null, t.slice(0, -1)), i); });
      finishPass(countBytes(ta.value));
    } catch (err) {
      if (log.textContent.indexOf("PASS") === -1) {
        log.textContent += "ERROR: " + (err.message || "runtime") + "\n";
        log.classList.add("golf-err");
        if (window.CCLTCE_SFX) CCLTCE_SFX.error();
      }
    }
  }
  function loadPy() {
    if (pyReady) return pyReady;
    pyReady = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
      s.onload = function () { window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/" }).then(resolve).catch(reject); };
      s.onerror = reject; document.head.appendChild(s);
    });
    return pyReady;
  }
  async function runPY() {
    log.textContent = "loading python runtime...\n";
    try {
      var py = await loadPy();
      var calls = P.tests.map(function (t) {
        var args = t.slice(0, -1).map(function (a) { return JSON.stringify(a); }).join(", ");
        return "__results.append(solve(" + args + "))";
      }).join("\n");
      var out = py.runPython(ta.value + "\nimport json\n__results = []\n" + calls + "\njson.dumps(__results)");
      var got = JSON.parse(out);
      log.textContent = "";
      got.forEach(function (v, i) { report(v, i); });
      finishPass(countBytes(ta.value));
    } catch (err) {
      log.textContent += "ERROR: " + (err.message || err.toString()) + "\n"; log.classList.add("golf-err");
      if (window.CCLTCE_SFX) CCLTCE_SFX.error();
    }
  }
  runBtn.addEventListener("click", function () {
    log.textContent = "mining...\n"; log.className = "golf-log";
    if (LANG === "py") runPY(); else if (LANG === "cpp") runCPP(); else runJS();
  });
})();
