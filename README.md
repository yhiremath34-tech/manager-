# Emergency Matchmaker

> A zero-touch volunteer coordination app for hyper-local crises powered by Antigravity IDE, Supabase Realtime, and Next.js.

---

## ⚡ Overview
When a crisis occurs, coordinator bandwidth is the primary bottleneck. Emergency Matchmaker takes raw, unformatted natural language crisis dispatches, parses them into structured actionable tasks using AI, matches verified local volunteers based on skillset overlap, and broadcasts updates live via Supabase Realtime replication.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict typing, no `any`)
- **Styling**: Tailwind CSS (Minimalist, functional, mobile-friendly)
- **Database & Realtime**: Supabase (PostgreSQL with Row Level Security & Realtime Publication)
- **AI Engine**: OpenAI gpt-4o-mini structured triage parser with deterministic regex fallback

---

## 🚀 Setup Steps

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd emergency-matchmaker
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
OPENAI_API_KEY=<your-openai-api-key>
```

### 3. Apply Supabase Database Migrations
Migrations are located in `supabase/migrations/`:
```bash
npx supabase db push --project-ref <your-project-ref>
```
Or paste the contents of `supabase/migrations/20260924000001_create_emergency_matchmaker_schema.sql` into the Supabase Dashboard SQL Editor and click **Run**.

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the Coordinator Dashboard.

---

## 🌐 Environment Variables Required

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client + Server) | Supabase project instance URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client + Server) | Supabase anonymous API key |
| `OPENAI_API_KEY` | Server-Side Only | OpenAI API key for crisis parser triage |

---

## 🚢 Vercel Deployment Instructions

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete Emergency Matchmaker"
   git push origin main
   ```
2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your GitHub repository
   - Framework Preset: **Next.js**
   - Root Directory: `./`
3. **Set Environment Variables in Vercel**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
4. **Deploy**:
   - Click **Deploy**. Your app will build and go live in < 2 minutes.
5. **Verify Live Health**:
   - Check `https://your-domain.vercel.app/api/health` to confirm `{ status: "ok", supabase: "connected" }`.
