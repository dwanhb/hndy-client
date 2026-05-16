# HNDY Railway Deployment Guide

## Architecture

```
Railway Project: hndy
├── Service 1: hndy-api        (Express backend — this repo, root dir)
├── Service 2: hndy-client     (React SPA — this repo, client/ dir)
└── Database:  MySQL plugin    (Railway-managed)
```

---

## Step 1 — Create Railway Project

1. Go to https://railway.app → New Project
2. Choose **Empty Project**
3. Name it `hndy`

---

## Step 2 — Add MySQL Database

1. In the Railway project → **+ New** → **Database** → **MySQL**
2. Once provisioned, click the MySQL service → **Variables** tab
3. Copy the `DATABASE_URL` value (you'll need it in Step 4)

---

## Step 3 — Deploy the Backend (hndy-api)

1. **+ New** → **GitHub Repo** → select `dwanhb/hndy-client`
2. Railway auto-detects Node.js and uses `railway.json`
3. Set **Root Directory** to `/` (default)
4. Add the following **Environment Variables**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | (auto-injected by Railway MySQL plugin) |
| `JWT_SECRET` | (generate a random 32-char string) |
| `GEMINI_API_KEY` | (your Google Gemini API key) |
| `CLOUDINARY_CLOUD_NAME` | (your Cloudinary cloud name) |
| `CLOUDINARY_API_KEY` | (your Cloudinary API key) |
| `CLOUDINARY_API_SECRET` | (your Cloudinary API secret) |
| `CLOUDINARY_UPLOAD_PRESET` | `hndy_unsigned` |
| `CLIENT_URLS` | (set after deploying frontends — comma-separated) |
| `NODE_ENV` | `production` |

5. Deploy → note the generated URL (e.g. `https://hndy-api-production.up.railway.app`)

---

## Step 4 — Deploy the Client Frontend (hndy-client)

1. **+ New** → **GitHub Repo** → select `dwanhb/hndy-client`
2. Set **Root Directory** to `client`
3. Set **Build Command** to `npm run build`
4. Set **Output Directory** to `dist`
5. Add Environment Variable:

| Variable | Value |
|---|---|
| `VITE_API_BASE` | `https://hndy-api-production.up.railway.app/api` |

6. Deploy → note the generated URL (e.g. `https://hndy-client-production.up.railway.app`)

---

## Step 5 — Deploy the Provider Frontend (hndy-provider)

1. **+ New** → **GitHub Repo** → select `dwanhb/hndy-provider`
2. Set **Build Command** to `npm run build`
3. Set **Output Directory** to `dist`
4. Add Environment Variable:

| Variable | Value |
|---|---|
| `VITE_API_BASE` | `https://hndy-api-production.up.railway.app/api` |

5. Deploy → note the generated URL

---

## Step 6 — Update CORS on the Backend

Once both frontend URLs are known, update the `CLIENT_URLS` env var on `hndy-api`:

```
CLIENT_URLS=https://hndy-client-production.up.railway.app,https://hndy-provider-production.up.railway.app
```

Then redeploy the backend.

---

## Rollback

To roll back to the pre-Railway state:
```bash
git checkout v1.0-pre-railway
```
