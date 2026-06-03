# Itai Conference Intelligence

**Owner's site:** https://itailligenceconference.vercel.app  
This is the original live site for the project owner, hosted on [Vercel](https://vercel.com).

The app works in a desktop browser and on **mobile** (phone or tablet).

### Access (for team / demo users)

The live app is **login-protected**. If you open the site on your laptop or phone and sign-in does not work, **contact Itai (the owner) to approve your login** first. Access is granted per person — until your account is approved, the app will not work on that device.

---

## About

This is a portfolio piece: it shows how I design software for **people who are not technical** — sales and field teams who need clear flows, plain language, and layouts that work on a laptop and on a phone at a conference. The product domain (conference planning and lead capture) is the vehicle; the point is **usability and fit for real users**, not a stack showcase.

---

## What it does

Conference planning, field capture, contacts, ICP scoring, trip stacks, optional HubSpot push and Gemini summaries. Data is stored in **this browser** (`localStorage`), not a shared cloud database.

### App sections

| Route | What it does |
|-------|----------------|
| `/` | Hub — links to each area |
| `/conferences` | Browse ~30 events, filter, assign reps, add to plan |
| `/planner` | Planned timeline, trip stacks, team & rep coverage |
| `/capture` | Quick lead form (email-first on mobile) |
| `/contacts` | Search, HubSpot push, CSV export, AI summary on list |
| `/contacts/[id]` | Contact profile, encounters, Gemini **Summary** |
| `/settings` | Team members, HubSpot token, Gemini API key |

### Integrations (optional)

- **HubSpot** — Settings token → **Push to HubSpot** on Contacts (real API; key stays in the browser).
- **Gemini** — Settings API key → **Summary** on a contact (needs encounter history).

### Filters glossary

- **Region** — where the event is held (NA, Europe, APAC, etc.).
- **Vertical** — industry focus (Payments, Fintech, Treasury, …). An event can match several.

---

## Run the app as a developer

Requires Node.js. The Next.js code lives in `itai-conference-intel/`:

```bash
cd itai-conference-intel
npm install
npm run dev
```

Open http://localhost:3000

---

## Deploy

- **Vercel** — production at https://itailligenceconference.vercel.app (deploy from `itai-conference-intel/`)  
- **GitHub** — https://github.com/itaimarcus/itai-conference-intelligence  
- **Vercel + GitHub** — connect that repo in Vercel; set **Root Directory** to `itai-conference-intel`  
