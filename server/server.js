import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, dir: "." });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsed = parse(req.url, true);
    const { pathname } = parsed;

    if (pathname === "/auth/github") {
      res.writeHead(302, { Location: `/auth/github` }); // placeholder; actual redirect handled by frontend
      res.end();
      return;
    }

    if (pathname === "/auth/callback") {
      // frontend handles the OAuth callback; backend just returns JSON status
      res.json({ ok: true });
      return;
    }

    if (pathname === "/api/me") {
      // read session cookie, return user role
      const cookie = req.headers.cookie || "";
      const token = cookie.split("; ").find((c) => c.startsWith("session="))?.split("=")[1];
      try {
        const { role } = await import("./server/api.js").then((m) => m.getMe(token));
        res.json({ ok: true, role });
      } catch (e) {
        res.json({ ok: false, error: e.message });
      }
      return;
    }

    // fallback: serve static files
    return handle(req, res);
  }).listen(parse(process.env.PORT || 3001).port, (err) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:" + (parse(process.env.PORT || 3001).port));
  });
});