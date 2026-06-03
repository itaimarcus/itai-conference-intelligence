# Vercel deploy (required settings)

The Next.js app lives in **`itai-conference-intel/`**, not the repo root.

In Vercel → your project → **Settings** → **Build and Deployment**:

| Setting | Value |
|---------|--------|
| **Root Directory** | `itai-conference-intel` |
| **Build Command** | (default) `npm run build` |
| **Install Command** | (default) `npm install` |

Save, then **Deployments** → **Redeploy** latest `master`.

Live URL: https://itailligenceconference.vercel.app

After deploy, on **Conferences** you should see grey placeholder **Search conference name** and a small **Build xxxxxxx** line under the title.
