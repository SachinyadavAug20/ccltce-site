import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("JSON Files Lint & Structure Validation", async (t) => {
  const jsonFiles = [
    "package.json",
    "vercel.json",
    "site.webmanifest",
    "data/content.json"
  ];

  for (const file of jsonFiles) {
    await t.test(`validate JSON: ${file}`, () => {
      assert.ok(fs.existsSync(file), `Expected ${file} to exist`);
      const raw = fs.readFileSync(file, "utf8");
      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        assert.fail(`Invalid JSON syntax in ${file}: ${e.message}`);
      }
      assert.ok(data && typeof data === "object", `${file} must parse into an object`);
    });
  }

  await t.test("package.json specific requirements", () => {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    assert.equal(pkg.name, "ccltce-site");
    assert.ok(pkg.scripts, "package.json must contain scripts");
    assert.ok(pkg.scripts.dev, "scripts.dev must exist");
    assert.ok(pkg.scripts.test, "scripts.test must exist");
  });

  await t.test("site.webmanifest PWA manifest structure", () => {
    const manifest = JSON.parse(fs.readFileSync("site.webmanifest", "utf8"));
    assert.ok(manifest.name, "Manifest must have a name");
    assert.ok(manifest.short_name, "Manifest must have short_name");
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, "Manifest must contain icons");
    for (const icon of manifest.icons) {
      assert.ok(fs.existsSync(icon.src), `Manifest icon file not found: ${icon.src}`);
    }
  });

  await t.test("vercel.json deployment configuration", () => {
    const vercel = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
    assert.equal(vercel.cleanUrls, true, "vercel.json should specify cleanUrls");
    assert.ok(Array.isArray(vercel.headers), "vercel.json should configure security headers");
  });
});
