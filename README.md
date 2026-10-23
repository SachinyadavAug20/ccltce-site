# CCLTCE — Coding Club, LTCOE

Minecraft-themed club website. Zero build step, vanilla HTML/CSS/JS.

## Deploy on Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) → Import Git Repository → select `ccltce-site`.
3. Vercel auto-detects the static site (no build command needed). Click **Deploy**.
4. Optional: set a custom domain under Project → Settings → Domains.

`vercel.json` is already configured for clean URLs and asset caching.

## Local dev

```bash
npm run dev
# → http://localhost:3000
```

## Structure

- `*.html` — pages (index, team, events, notices, resources, achievements, challenges)
- `assets/css/` — stylesheets (≤150 lines each)
- `assets/js/` — scripts (≤150 lines each)
- `data/content.json` — team/events/notices content
- `server/` — optional Express backend (not needed for Vercel static)
