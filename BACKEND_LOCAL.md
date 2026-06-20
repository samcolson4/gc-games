# Running the backend locally in Docker with a Cloudflare Tunnel

This lets you run the Node/Express/SQLite backend on your local machine and expose
it to the Cloudflare Pages-hosted frontend via a public Cloudflare URL.

---

## Prerequisites

| Tool | Install |
|------|---------|
| Docker Desktop | https://www.docker.com/products/docker-desktop |
| `cloudflared` | `brew install cloudflared` |
| Cloudflare account (free) | https://dash.cloudflare.com/sign-up |
| A domain in Cloudflare DNS | needed for a **named** tunnel (persistent URL) |

---

## 1. Build the Docker image

From the repo root:

```bash
docker build -t gc-games-server ./server
```

The image compiles the TypeScript, then strips dev dependencies. It uses
**Node 22** because the backend uses `node:sqlite` (added in Node 22.5).

---

## 2. Run the container

```bash
docker run -d \
  --name gc-games \
  -p 3001:3001 \
  -v "$(pwd)/server/data:/app/data" \
  -e JWT_SECRET="replace-with-a-long-random-string" \
  -e FRONTEND_URL="https://your-app.pages.dev" \
  gc-games-server
```

**What each flag does:**

- `-p 3001:3001` — maps the container's port to `localhost:3001`
- `-v "$(pwd)/server/data:/app/data"` — mounts the local `server/data/` directory
  into the container so the SQLite DB survives restarts
- `JWT_SECRET` — required; any long random string (e.g. `openssl rand -hex 32`)
- `FRONTEND_URL` — your Cloudflare Pages URL; added to the CORS allowlist. Use
  your custom domain if you have one, or the `*.pages.dev` URL.

Check it's up:

```bash
curl http://localhost:3001/health
# → {"ok":true}
```

Stop / restart later:

```bash
docker stop gc-games
docker start gc-games
```

---

## 3. Open a Cloudflare Tunnel

You have two options. **Named tunnel** (recommended) gives you a stable URL so you
only configure `VITE_API_URL` in Cloudflare Pages once. Quick tunnel gives a random
URL every time.

### Option A — Named tunnel (stable URL)

#### 3a. Log in to Cloudflare

```bash
cloudflared tunnel login
```

A browser window opens. Authorise `cloudflared` and select the domain you want to
use (e.g. `yourdomain.com`). A credentials file is saved to
`~/.cloudflare/cert.pem`.

#### 3b. Create the tunnel

```bash
cloudflared tunnel create gc-games-api
```

This prints a tunnel ID (e.g. `abc123...`). Note it — you'll need it in the config.

#### 3c. Create a config file

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: gc-games-api
credentials-file: /Users/YOUR_USERNAME/.cloudflare/gc-games-api.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
```

Replace `YOUR_USERNAME` and `api.yourdomain.com` with your values. The credentials
JSON was created by `cloudflared tunnel create` — it lives in
`~/.cloudflare/<tunnel-id>.json`.

#### 3d. Add a DNS record

```bash
cloudflared tunnel route dns gc-games-api api.yourdomain.com
```

#### 3e. Run the tunnel

```bash
cloudflared tunnel run gc-games-api
```

Your backend is now reachable at `https://api.yourdomain.com`.

---

### Option B — Quick tunnel (no config, random URL)

```bash
cloudflared tunnel --url http://localhost:3001
```

The terminal prints a URL like `https://random-words.trycloudflare.com`. Use that
as `VITE_API_URL`. It changes every time you restart, so you'd have to update
Cloudflare Pages each time — fine for a quick test, annoying for regular use.

---

## 4. Point the Cloudflare Pages frontend at the tunnel

`VITE_API_URL` is baked in at build time, so set it as an environment variable in
Cloudflare Pages and trigger a redeploy.

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → your project
2. **Settings** → **Environment variables** → **Production**
3. Add `VITE_API_URL` = `https://api.yourdomain.com`
4. Go to **Deployments** and click **Retry deployment** on the latest build (or
   push a new commit to trigger one)

Also make sure the `FRONTEND_URL` you passed to Docker (step 2) matches your Pages
URL exactly — no trailing slash. If you have a custom domain on your Pages project,
use that; otherwise use the `*.pages.dev` URL.

---

## 5. Keeping it running (optional)

To have the tunnel start automatically on login, register `cloudflared` as a
system service:

```bash
sudo cloudflared service install
sudo launchctl start com.cloudflare.cloudflared
```

Add a restart policy to the Docker container so it comes back up after a reboot:

```bash
docker run -d --restart unless-stopped ...
```

Or update an existing container's restart policy without recreating it:

```bash
docker update --restart unless-stopped gc-games
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `JWT_SECRET environment variable is required` | Pass `-e JWT_SECRET=...` to `docker run` |
| CORS errors in the browser | Check `FRONTEND_URL` matches your Pages URL exactly (no trailing slash) |
| SQLite errors on startup | Ensure `server/data/` exists locally before mounting |
| Tunnel URL not reachable | Check `cloudflared tunnel run` is still running; verify DNS with `dig api.yourdomain.com` |
| Container exits immediately | Run without `-d` to see the logs: `docker run --rm -it ...` |
| `VITE_API_URL` not picked up | Remember it's baked in at build time — a redeploy is required after changing it |
