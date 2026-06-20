# Running the backend locally with Docker + Cloudflare Tunnel

Two containers, nothing exposed to your host machine:

- **`server`** — the Node/Express/SQLite backend, DB stored in a Docker volume
- **`tunnel`** — `cloudflared`, connects the server container directly to Cloudflare's edge

---

## Prerequisites

| Tool | Install |
|------|---------|
| Docker Desktop | https://www.docker.com/products/docker-desktop |
| Cloudflare account (free) | https://dash.cloudflare.com/sign-up |
| A domain in Cloudflare DNS | for a stable public URL |

No `cloudflared` install needed locally — it runs inside Docker.

---

## 1. Create the Cloudflare Tunnel

Do this once in the Cloudflare dashboard.

1. Go to **[Zero Trust](https://one.dash.cloudflare.com)** → **Networks** → **Tunnels**
2. Click **Create a tunnel** → choose **Cloudflared** → give it a name (e.g. `gc-games-api`)
3. On the next screen, ignore the install instructions — just **copy the token** shown
   in the Docker run command. It looks like `eyJ...`. Save it for step 3.
4. Under **Public Hostnames**, add a route:
   - **Subdomain**: `api` (or whatever you want)
   - **Domain**: your domain
   - **Service**: `http://server:3001`
   
   `server` is the Docker Compose service name — Cloudflare's container will reach
   the backend container via Docker's internal DNS, no host ports needed.

5. Save the tunnel.

---

## 2. Create a `.env` file

At the repo root, create `.env` (it's gitignored):

```env
JWT_SECRET=replace-with-a-long-random-string
FRONTEND_URL=https://your-app.pages.dev
TUNNEL_TOKEN=eyJ...your-token-from-step-1...
```

Generate a good `JWT_SECRET` with:

```bash
openssl rand -hex 32
```

`FRONTEND_URL` is your Cloudflare Pages URL — used for the CORS allowlist. Use your
custom domain if you have one, otherwise the `*.pages.dev` URL. No trailing slash.

---

## 3. Start everything

```bash
docker compose up -d
```

This builds the server image, starts both containers, and creates the `db_data`
volume for the SQLite database.

Check the server is up (from inside Docker — no host port is exposed):

```bash
docker compose exec server wget -qO- http://localhost:3001/health
# → {"ok":true}
```

Check the tunnel is connected:

```bash
docker compose logs tunnel
# should show: "Registered tunnel connection"
```

---

## 4. Point Cloudflare Pages at the tunnel

`VITE_API_URL` is baked in at build time, so set it in Cloudflare Pages and redeploy.

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → your project
2. **Settings** → **Environment variables** → **Production**
3. Add `VITE_API_URL` = `https://api.yourdomain.com`
4. **Deployments** → **Retry deployment** on the latest build (or push a commit)

---

## Day-to-day commands

```bash
# Start
docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f

# Rebuild after server code changes
docker compose up -d --build server
```

The SQLite database lives in the `db_data` Docker volume and survives `down`/`up`
cycles. To inspect or back it up:

```bash
# Copy the DB out of the volume to your local machine
docker compose cp server:/app/data/gc-games.db ./gc-games-backup.db
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `JWT_SECRET environment variable is required` | Check your `.env` file is at the repo root and has `JWT_SECRET` set |
| CORS errors in the browser | Check `FRONTEND_URL` in `.env` matches your Pages URL exactly (no trailing slash) |
| Tunnel shows "failed to connect" | Verify `TUNNEL_TOKEN` in `.env` matches what the Cloudflare dashboard shows |
| Public hostname returns 502 | Check the service URL is `http://server:3001` (not `localhost`) in the tunnel config |
| `VITE_API_URL` not picked up | It's baked in at build time — a Pages redeploy is required after changing it |
| Lost the DB | It's in Docker volume `gc-games_db_data` — only `docker volume rm` deletes it |
