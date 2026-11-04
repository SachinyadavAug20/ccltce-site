import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("HTML & Resource Link Integrity", async (t) => {
  const expectedPages = [
    "index.html",
    "community.html",
    "events.html",
    "team.html",
    "challenges.html",
    "achievements.html",
    "dashboard.html",
    "login.html",
    "register.html",
    "notices.html",
    "resources.html"
  ];

  for (const page of expectedPages) {
    await t.test(`page exists: ${page}`, () => {
      assert.ok(fs.existsSync(page), `Expected core page ${page} to exist`);
    });
  }

  const allHtmlFiles = fs.readdirSync(".").filter((f) => f.endsWith(".html"));

  for (const file of allHtmlFiles) {
    await t.test(`structure & asset references in ${file}`, () => {
      const content = fs.readFileSync(file, "utf8");

      // Critical HTML tags
      assert.match(content, /<!DOCTYPE\s+html>/i, `${file} missing <!DOCTYPE html>`);
      assert.match(content, /<html\b/i, `${file} missing <html>`);
      assert.match(content, /<head\b/i, `${file} missing <head>`);
      assert.match(content, /<body\b/i, `${file} missing <body>`);
      assert.match(content, /<meta\s+charset=["']?UTF-8/i, `${file} missing UTF-8 meta charset`);
      assert.match(content, /<meta\s+name=["']viewport/i, `${file} missing viewport meta tag`);
      assert.match(content, /<title>[^<]+<\/title>/i, `${file} missing non-empty <title> tag`);
      assert.match(content, /<main\b/i, `${file} missing <main> content landmark`);

      // Extract and check local asset references
      const regex = /(?:href|src)=["']([^"'#?]+)["']/gi;
      let match;
      const checkedAssets = new Set();

      while ((match = regex.exec(content)) !== null) {
        let ref = match[1].trim();

        // Skip non-local protocols and analytics
        if (
          !ref ||
          ref.startsWith("http://") ||
          ref.startsWith("https://") ||
          ref.startsWith("//") ||
          ref.startsWith("data:") ||
          ref.startsWith("mailto:") ||
          ref.startsWith("javascript:") ||
          ref.startsWith("/_vercel/")
        ) {
          continue;
        }

        // Normalize local reference
        const normalized = ref.startsWith("/") ? ref.slice(1) : ref;
        if (checkedAssets.has(normalized)) continue;
        checkedAssets.add(normalized);

        const assetPath = path.resolve(normalized);
        assert.ok(
          fs.existsSync(assetPath),
          `Broken asset link in ${file}: "${ref}" (resolved: ${normalized})`
        );
      }
    });
  }

  await t.test("SEO & discovery files integrity", () => {
    // robots.txt
    assert.ok(fs.existsSync("robots.txt"), "robots.txt must exist");
    const robots = fs.readFileSync("robots.txt", "utf8");
    assert.match(robots, /User-agent:/i, "robots.txt must contain User-agent");

    // sitemap.xml
    assert.ok(fs.existsSync("sitemap.xml"), "sitemap.xml must exist");
    const sitemap = fs.readFileSync("sitemap.xml", "utf8");
    assert.match(sitemap, /<urlset\b/i, "sitemap.xml must have <urlset>");
    assert.match(sitemap, /<loc>/i, "sitemap.xml must have <loc> entries");

    // ensure key pages are in sitemap
    for (const page of ["events", "community", "team"]) {
      assert.ok(
        sitemap.includes(page),
        `sitemap.xml should reference ${page}`
      );
    }
  });
});
