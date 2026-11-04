import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

function createStaticServer() {
  return http.createServer((req, res) => {
    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      let pathname = decodeURIComponent(parsedUrl.pathname);

      if (pathname.endsWith("/")) {
        pathname += "index.html";
      }

      let filePath = path.join(process.cwd(), pathname.slice(1));

      // Clean URLs support (matching vercel.json cleanUrls: true)
      if (!fs.existsSync(filePath) && fs.existsSync(filePath + ".html")) {
        filePath += ".html";
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 Not Found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("500 Internal Error: " + err.message);
    }
  });
}

test("HTTP Smoke & Static Routing Tests", async (t) => {
  const server = createStaticServer();

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  t.after(() => {
    return new Promise((resolve) => server.close(resolve));
  });

  const endpointsToTest = [
    { path: "/", status: 200, contentType: "text/html", match: "CCLTCE" },
    { path: "/index.html", status: 200, contentType: "text/html", match: "Coding Club" },
    { path: "/community", status: 200, contentType: "text/html", match: "Community" },
    { path: "/events", status: 200, contentType: "text/html", match: "Events" },
    { path: "/team", status: 200, contentType: "text/html", match: "Team" },
    { path: "/challenges", status: 200, contentType: "text/html", match: "Challenges" },
    { path: "/achievements", status: 200, contentType: "text/html", match: "Achievements" },
    { path: "/dashboard", status: 200, contentType: "text/html", match: "Dashboard" },
    { path: "/login", status: 200, contentType: "text/html", match: "Log in" },
    { path: "/register", status: 200, contentType: "text/html", match: "Create account" },
    { path: "/notices", status: 200, contentType: "text/html", match: "Notices" },
    { path: "/resources", status: 200, contentType: "text/html", match: "Resources" },
    { path: "/site.webmanifest", status: 200, contentType: "application/manifest+json" },
    { path: "/sitemap.xml", status: 200, contentType: "application/xml" },
    { path: "/robots.txt", status: 200, contentType: "text/plain" },
    { path: "/assets/css/global.css", status: 200, contentType: "text/css" },
    { path: "/assets/js/main.js", status: 200, contentType: "application/javascript" },
    { path: "/nonexistent-page-test-404", status: 404 }
  ];

  for (const ep of endpointsToTest) {
    await t.test(`GET ${ep.path} -> ${ep.status}`, async () => {
      const res = await fetch(`${baseUrl}${ep.path}`);
      assert.equal(res.status, ep.status, `Expected status ${ep.status} for ${ep.path}`);

      if (ep.contentType) {
        const ct = res.headers.get("content-type") || "";
        assert.ok(
          ct.includes(ep.contentType),
          `Expected content-type to contain ${ep.contentType}, got ${ct}`
        );
      }

      if (ep.match) {
        const text = await res.text();
        assert.ok(
          text.includes(ep.match),
          `Expected response body of ${ep.path} to contain "${ep.match}"`
        );
      }
    });
  }
});
