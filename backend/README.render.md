Deploying the backend to Render

This file contains a concise guide to deploy only the backend API to Render.com (Managed services). It assumes the repository is already in a Git provider (GitHub/GitLab) and Render can access it.

1) Service type

- Create a new "Web Service" on Render.
- Connect your Git repo and choose the branch (e.g., `main`).

2) Build settings

- Environment: Docker
- Dockerfile Path: `backend/Dockerfile`
- Build Command: leave empty (Render will use Dockerfile)
- Start Command: leave empty (Docker CMD is used)

3) Instance

- Plan: choose according to traffic (e.g., free/Starter).
- Port: Render will use container port; ensure your app listens on the `PORT` env var (default `8888`).

4) Environment variables

Set these in the Render dashboard (use values from your `.env` or secrets):

- NODE_ENV=production
- PORT=8888
- SUPABASE_URL=<your supabase url>
- SUPABASE_ANON_KEY=<your anon key>
- SUPABASE_SERVICE_ROLE_KEY=<your service role key>
- JWT_SECRET=<your jwt secret>
- JWT_EXPIRES_IN=24h
- database_url=<your postgres url>

Notes:
- Never commit secrets to the repo. Use Render's secret management.
- If you need Redis, either use Render's managed Redis addon or connect to an external Redis and set the URL in env vars.

5) Health check

- The `backend/Dockerfile` includes a HEALTHCHECK that calls `/health` on the container. Render will surface container health.
- Ensure the app exposes the health endpoint at `/health` (the project already does this).

6) Local testing before deploy

Build locally with Docker to verify:

```powershell
cd backend
docker build -t smart-parking-backend:local .
docker run -e NODE_ENV=development -e PORT=8888 -p 8888:8888 smart-parking-backend:local
```

Then open http://localhost:8888/health to see the health response.

7) Optional: render.yaml (automatic deploys)

If you want, I can create a `render.yaml` file to define the service declaratively. Ask me and I will add a minimal spec.

---

If you'd like, I can also create the `render.yaml` now and add instructions to wire Render's Redis addon and environment secrets.