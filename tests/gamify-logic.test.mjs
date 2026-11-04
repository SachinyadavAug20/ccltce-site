import test from "node:test";
import assert from "node:assert/strict";

// Mirroring the pure XP math & ranking logic from assets/js/auth.js
const RANKS = [
  [1, "Guest Explorer"],
  [5, "Script Kiddie"],
  [10, "Bug Hunter"],
  [25, "Kernel Crafter"],
  [50, "Redstone Sage"],
  [100, "Diamond Dev"]
];

function levelOf(xp) {
  return Math.max(1, 1 + Math.floor((Number(xp) || 0) / 100));
}

function rankOf(xp) {
  const lv = levelOf(xp);
  let r = RANKS[0][1];
  RANKS.forEach((p) => {
    if (lv >= p[0]) r = p[1];
  });
  return r;
}

test("Gamification Level and Rank Calculations", async (t) => {
  await t.test("levelOf calculates correct Minecraft levels from XP", () => {
    assert.equal(levelOf(0), 1);
    assert.equal(levelOf(50), 1);
    assert.equal(levelOf(99), 1);
    assert.equal(levelOf(100), 2);
    assert.equal(levelOf(499), 5);
    assert.equal(levelOf(900), 10);
    assert.equal(levelOf(1420), 15);
    assert.equal(levelOf(9900), 100);
    assert.equal(levelOf(10500), 106);
  });

  await t.test("levelOf handles null, undefined, strings, and negative values safely", () => {
    assert.equal(levelOf(null), 1);
    assert.equal(levelOf(undefined), 1);
    assert.equal(levelOf(""), 1);
    assert.equal(levelOf("250"), 3);
    assert.equal(levelOf("invalid"), 1);
    assert.equal(levelOf(-50), 1);
  });

  await t.test("rankOf returns matching Minecraft rank titles", () => {
    assert.equal(rankOf(0), "Guest Explorer");
    assert.equal(rankOf(350), "Guest Explorer"); // Lv 4
    assert.equal(rankOf(400), "Script Kiddie");  // Lv 5
    assert.equal(rankOf(899), "Script Kiddie");  // Lv 9
    assert.equal(rankOf(900), "Bug Hunter");     // Lv 10
    assert.equal(rankOf(2399), "Bug Hunter");    // Lv 24
    assert.equal(rankOf(2400), "Kernel Crafter"); // Lv 25
    assert.equal(rankOf(4899), "Kernel Crafter"); // Lv 49
    assert.equal(rankOf(4900), "Redstone Sage");  // Lv 50
    assert.equal(rankOf(9899), "Redstone Sage");  // Lv 99
    assert.equal(rankOf(9900), "Diamond Dev");   // Lv 100
    assert.equal(rankOf(25000), "Diamond Dev");  // Lv 251
  });
});
