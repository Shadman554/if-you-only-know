# Deployment Guide: "If Only You Knew..."

This project is fully prepared for one-click or automated deployment to any major hosting service. All game assets are pre-rendered and optimized—no database, secrets, Python runtime, or image processing libraries are required on your hosting platform.

---

## Quick Platform Selection

| Platform | Best For | Deploy Command / Method |
| :--- | :--- | :--- |
| **Railway** | Full-stack / Container | Connect GitHub repo or `railway up` |
| **Vercel** | Fast static edge CDN | Connect GitHub repo or `npx vercel` |
| **Netlify** | Fast static edge CDN | Connect GitHub repo or `npx netlify deploy` |
| **GitHub Pages** | Free GitHub hosting | Push to `main` (automated GitHub Action) |
| **Render** | Static Site or Web Service | Connect GitHub repo (reads `render.yaml`) |
| **Docker / VPS** | Any container host | `docker build -t if-only-you-knew .` |

---

## 1. Deploy on Railway

Railway configuration is pre-configured in [railway.json](railway.json) and [Dockerfile](Dockerfile).

1. Push this project to a GitHub repository (or use the Railway CLI).
2. In Railway, click **New Project** → **Deploy from GitHub repo** and select your repository.
3. Railway automatically detects the [Dockerfile](Dockerfile) and [railway.json](railway.json) healthcheck (`/healthz`).
4. Once deployed, navigate to **Settings → Networking → Generate Domain** to get your public HTTPS URL.

*Alternatively with Railway CLI:*
```bash
railway login
railway init
railway up
```

---

## 2. Deploy on Vercel

Vercel configuration is pre-configured in [vercel.json](vercel.json).

1. Push this project to GitHub.
2. In Vercel, click **Add New...** → **Project** and import your repository.
3. Vercel automatically detects the build configuration:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**. Vercel will deploy your site on global edge nodes with immutable asset caching.

*Alternatively with Vercel CLI:*
```bash
npx vercel
```

---

## 3. Deploy on Netlify

Netlify configuration is pre-configured in [netlify.toml](netlify.toml).

1. Push this project to GitHub.
2. In Netlify, click **Add new site** → **Import an existing project**.
3. Select your repository. Netlify reads [netlify.toml](netlify.toml) automatically:
   - **Build Command**: `npm run build`
   - **Publish directory**: `dist`
4. Click **Deploy site**.

*Alternatively with Netlify CLI:*
```bash
npx netlify deploy --prod
```

---

## 4. Deploy on GitHub Pages

Automated CI/CD is configured in [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

1. Create a repository on GitHub and push this code:
   ```bash
   git add .
   git commit -m "Prepare game for deployment"
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. In your GitHub repository, go to **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. Every push to `main` or `master` will automatically build the game, run tests, and publish to GitHub Pages.

---

## 5. Deploy on Render

Render configuration is pre-configured in [render.yaml](render.yaml).

1. Push your code to GitHub.
2. In Render, select **Blueprints** → **New Blueprint Instance** and select your repository.
3. Render creates the web service using Node.js:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/healthz`

---

## 6. Deploy with Docker (Any Container Host)

Build and run the self-contained production container locally or on Fly.io, Google Cloud Run, AWS ECS, or DigitalOcean:

```bash
# Build the production image
docker build -t if-only-you-knew .

# Run the container
docker run -d -p 3000:3000 -e PORT=3000 --name game if-only-you-knew
```
Visit `http://localhost:3000` to play.

---

## Local Verification Commands

Before deploying, verify everything locally with Node.js:

```bash
# 1. Build the production bundle
npm run build

# 2. Run the server tests and asset integrity checks
npm test

# 3. Start the production server
npm start
```
Visit `http://localhost:3000` (healthcheck at `http://localhost:3000/healthz`).
