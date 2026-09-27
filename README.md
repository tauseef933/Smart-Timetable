# Smart Timetable & Substitute Teacher Management System

A production-ready web application for colleges to manage teacher timetables and automatically find substitute teachers when faculty are absent. Same-subject teachers are prioritized first; fairness (fewest substitutions this month) is used as a tiebreaker.

Built for admin demos and real campus deployment — clean UI, secure auth, and email notifications included.

---

## Architecture overview

| Layer | Technology | Where it runs |
|-------|------------|---------------|
| Frontend (UI) | Next.js 14 App Router, React, Tailwind CSS, shadcn/ui | **Vercel** |
| Backend (API / logic) | Next.js Server Actions & Route Handlers | **Vercel** (same project) |
| Database & Auth | Supabase (PostgreSQL + Auth) | **Supabase Cloud** |
| Email | Nodemailer + Gmail SMTP | Sent from **Vercel** serverless functions |

**Yes — frontend and backend deploy together on Vercel as a single Next.js project.** You do not need a separate Node server, Express app, or second Vercel project. Supabase hosts the database and authentication; Vercel hosts the app that talks to Supabase and sends emails.

```
Browser  →  Vercel (Next.js UI + Server Actions)
                ↓
           Supabase (Postgres + Auth)
                ↓
           Gmail SMTP (substitute emails)
```

---

## Features

- **Admin authentication** — email/password via Supabase Auth; protected routes
- **Teachers** — create, edit, deactivate; assign subjects
- **Classes** — manage class names and sections
- **Weekly timetable** — grid view (Mon–Sat × periods); add/remove slots with overlap validation
- **Absence + substitute finder** — mark a teacher absent; get top 3 ranked substitutes; one-click confirm
- **Email notifications** — HTML email to the substitute with subject, class, date, time, room
- **Dashboard** — today’s absences, pending substitutions, quick stats
- **Substitution history** — log with status updates
- **Settings** — college name, logo URL, email sender display name

---

## Tech stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **UI:** Tailwind CSS, shadcn/ui
- **Database / Auth:** Supabase (Postgres)
- **Email:** Nodemailer (Gmail App Password)
- **Hosting:** Vercel

---

## Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) project
- A Gmail account with [2-Step Verification](https://myaccount.google.com/security) and an [App Password](https://myaccount.google.com/apppasswords)
- A [Vercel](https://vercel.com) account (for deployment)
- A [GitHub](https://github.com) account (recommended for Vercel import)

---

## Getting started (local)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd smart-timetable
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL from Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | `anon` / public key from the same page |
| `GMAIL_USER` | Yes (for email) | Gmail address that sends notifications |
| `GMAIL_APP_PASSWORD` | Yes (for email) | 16-character App Password **without spaces** |

> **Do not** commit `.env.local`. It is gitignored. Never put secrets in the README or client code.

### 3. Database schema

In the Supabase Dashboard → **SQL Editor**, run in order:

1. [`supabase/schema.sql`](supabase/schema.sql) — tables, RLS policies, default settings
2. [`supabase/seed.sql`](supabase/seed.sql) — demo teachers, subjects, classes, full Mon–Sat timetable

### 4. Create an admin user

Supabase Dashboard → **Authentication** → **Users** → **Add user**

- Email and password of your choice
- Enable **Auto Confirm User**

Change any demo credentials before sharing the app publicly.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

```bash
npm run build   # production build check
npm run start   # run production build locally
npm run lint    # ESLint
```

---

## Gmail SMTP setup

1. Turn on **2-Step Verification** for the Gmail account  
2. Create an **App Password**: [Google App Passwords](https://myaccount.google.com/apppasswords)  
3. Select Mail → Other (e.g. “Smart Timetable”)  
4. Copy the 16-character password into `GMAIL_APP_PASSWORD` **with spaces removed**  
5. Restart `npm run dev` after saving `.env.local`

For a real test, set a teacher’s email in **/teachers** to an inbox you can open. Seed emails (`@greenfield.edu.pk`) are demo-only and will not receive mail.

---

## Deploy to GitHub + Vercel

### A. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Smart Timetable system"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Confirm `.env.local` is **not** in the commit (it should be ignored).

### B. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repository  
2. Framework Preset: **Next.js** (auto-detected)  
3. Add **Environment Variables** (same names as `.env.local`):

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
   | `GMAIL_USER` | your Gmail |
   | `GMAIL_APP_PASSWORD` | your App Password (no spaces) |

4. Click **Deploy**  
5. After deploy, open the Vercel URL and sign in with your Supabase admin user  

No extra backend service is required. Server Actions that assign substitutes and send email run on Vercel automatically.

### C. Optional: custom domain

Vercel Project → **Settings** → **Domains** → add your college domain and follow DNS instructions.

---

## Application routes

| Route | Description |
|-------|-------------|
| `/login` | Admin sign-in |
| `/dashboard` | Overview: absences today, pending subs, stats |
| `/teachers` | Teacher CRUD and subject assignment |
| `/classes` | Class / section management |
| `/timetable` | Weekly timetable grid |
| `/absences` | Mark absence → confirm substitutes |
| `/substitutions` | Substitution history |
| `/settings` | College branding and email display name |

---

## Substitute assignment logic

When a teacher is marked absent for a date:

1. Load that teacher’s timetable slots for the weekday  
2. Find teachers who are **free** (not teaching that slot, not absent, not already covering that slot)  
3. Rank candidates:
   - **Priority 1:** teaches the same subject  
   - **Priority 2:** fewest substitutions in the current calendar month  
4. Show the **top 3** suggestions; admin confirms before anything is saved or emailed  
5. On confirm: insert a `substitutions` row and send the email  

---

## Project structure

```
src/
  app/
    (app)/          # Authenticated pages (dashboard, teachers, …)
    login/          # Public login
    layout.tsx
  components/
    layout/         # Sidebar, top bar, page header
    teachers/ classes/ timetable/ absences/ …
    ui/             # shadcn/ui primitives
  lib/
    actions/        # Server Actions (CRUD, absences, email trigger)
    supabase/       # Browser + server clients, middleware helper
    email.ts        # Nodemailer + Gmail
    substitute-finder.ts
supabase/
  schema.sql
  seed.sql
.env.example
```

---

## Demo seed data

`supabase/seed.sql` loads realistic sample data for presentations:

- 10 teachers (Pakistani names), each with 1–2 subjects  
- 9 subjects (Physics, Chemistry, Mathematics, …)  
- 1st Year & 2nd Year — sections A, B, C  
- Full Monday–Saturday timetable with no overlapping slots per teacher  

To reset demo data, re-run `supabase/seed.sql` in the SQL Editor (it truncates and reloads seed tables).

---

## Security notes

- Enable RLS on all public tables (included in `schema.sql`)  
- Use App Passwords for Gmail; never store the normal account password  
- Keep `GMAIL_*` and Supabase keys in Vercel Environment Variables only  
- Change default/demo admin passwords before production use  
- Rotate keys if they were ever committed to git by mistake  

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Redirected to login always | Check Supabase URL/anon key; confirm admin user is email-confirmed |
| “Email is not configured” | Ensure `.env.local` / Vercel env vars are set; **restart** the server after changing env |
| Gmail `Invalid login` | Use a fresh App Password (not your Gmail password); remove spaces |
| Email sent but not received | Check spam; use a real teacher email address for testing |
| Build fails on Vercel | Run `npm run build` locally; confirm all env vars are set for Production |

---

## License

Private / institutional use. Adapt for your college as needed.
