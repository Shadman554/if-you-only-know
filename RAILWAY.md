# Deploy the game on Railway

The deployment package contains the current game, assets, background music, and a Node server. No database or secrets are required. Telegram monitoring is not included.

## Deploy from GitHub

1. Extract **If Only You Knew - Railway.zip** into a folder and put its contents in a GitHub repository. Keep `Dockerfile`, `railway.json`, and `package.json` at the repository root, with `assets/` alongside them.
2. In Railway, create a project and select **Deploy from GitHub repo**, then choose that repository.
3. Leave the build and start commands at their defaults. The Dockerfile builds the game and runs the server; `railway.json` configures the `/healthz` startup check.
4. After deployment succeeds, open the service's **Settings → Networking → Public Networking → Generate Domain**. Open that HTTPS address to play.

Railway supplies `PORT`; the server listens on `0.0.0.0` using that value. No Telegram variables are needed or read. Music starts after the player's Start gesture, just as in the local game.

## Deploy directly from this folder instead

With the Railway CLI installed, run `railway login`, then `railway init` for a new project (or `railway link` for an existing one), then `railway up`. Select the intended service if prompted. Generate its public domain as described above.

## Check locally

With Node.js 24 installed:

```text
npm run build
npm test
npm start
```

Open `http://localhost:3000`. The health endpoint is `http://localhost:3000/healthz`. There are no npm dependencies to install. `node build.cjs` makes the hosted files from the editable source, so there is no need to run Python or install image-processing tools on Railway.

The server serves only an explicit list of game assets, supports audio range requests, and does not expose source sheets, environment files, server code, or archives. It sets no visitor cookies and has no activity endpoint, visitor database, or Telegram integration. The hosting platform may maintain its own infrastructure logs.

After editing the game, commit and push changes for the linked GitHub deployment, or run `railway up` again for a CLI deployment. The local HTML launchers continue to work independently.

Official references: [Railway configuration](https://docs.railway.com/config-as-code/reference), [health checks](https://docs.railway.com/deployments/healthchecks), [public networking](https://docs.railway.com/networking/public-networking), and [CLI](https://docs.railway.com/cli).
