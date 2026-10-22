// GitHub OAuth constants (set via .env)
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || "http://localhost:3001/auth/callback";

export function githubAuthUrl() {
  const scope = "read:user";
  return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}`;
}

export async function exchangeCode(code) {
  const resp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  const data = await resp.json();
  const accessToken = data.access_token;
  if (!accessToken) throw new Error("Failed to exchange code: " + JSON.stringify(data));

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const user = await userRes.json();
  return { accessToken, user };
}

export function logoutUrl() {
  return `https://github.com/logout?continue_url=${encodeURIComponent(window.location.origin)}/&logoout_from=github`;
}