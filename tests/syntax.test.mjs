import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

test("JavaScript Syntax Verification across codebase", async (t) => {
  const dirsToCheck = ["assets/js", "server"];
  const jsFiles = [];

  for (const dir of dirsToCheck) {
    if (fs.existsSync(dir)) {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (entry.endsWith(".js") || entry.endsWith(".mjs")) {
          jsFiles.push(path.join(dir, entry));
        }
      }
    }
  }

  assert.ok(jsFiles.length > 0, "Expected at least one JavaScript file to check");

  for (const file of jsFiles) {
    await t.test(`syntax: ${file}`, () => {
      try {
        execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
      } catch (err) {
        assert.fail(`Syntax error in ${file}:\n${err.stderr?.toString() || err.message}`);
      }
    });
  }
});
