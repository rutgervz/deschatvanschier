# De Schat van Schier — Mogelijkmaakdag

Website voor de Mogelijkmaakdag op 1 april 2026 in De Stag, Schiermonnikoog.
35 plannen van de kinderen van het eiland, met AI-chatbot per plan voor verrijking.

## Stack

- **Frontend**: Next.js 15 (React 19) op Vercel
- **Database**: Supabase (PostgreSQL)
- **AI Chat**: Anthropic Claude Sonnet via API
- **Hosting**: Vercel + GitHub

## Setup

### 1. Supabase

1. Maak een nieuw project op [supabase.com](https://supabase.com)
2. Ga naar **SQL Editor** en voer achtereenvolgens uit:
   - `supabase/migration.sql` — maakt de tabellen
   - `supabase/seed.sql` — vult alle 35 plannen in
3. Kopieer uit **Settings > API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Anthropic API

1. Maak een API key op [console.anthropic.com](https://console.anthropic.com)
2. Dit wordt `ANTHROPIC_API_KEY`

### 3. GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/JOUW_USERNAME/deschatvanschier.git
git push -u origin main
```

### 4. Vercel

1. Importeer de GitHub repo op [vercel.com](https://vercel.com)
2. Stel Environment Variables in (zie .env.local.example)
3. Deploy — Vercel detecteert Next.js automatisch
4. Koppel domein deschatvanschier.nl

### 5. Lokaal draaien

```bash
cp .env.local.example .env.local
# Vul de keys in
npm install
npm run dev
```

## Hoe werkt de AI-chatbot?

Elk plan heeft een "Plan verrijken (AI)" tab. De chatbot kent alle context van het plan, helpt met kosten/vergunningen/haalbaarheid, en slaat nieuwe inzichten automatisch op als verrijkingen in de database — zichtbaar voor iedereen.

## Kosten

- Vercel: gratis (Hobby plan)
- Supabase: gratis (Free tier)
- Anthropic: ~€0,003/bericht. €10 budget = ~3.000 berichten.
