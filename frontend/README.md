# DriveLegal Frontend — Next.js 14

> **Branch:** `feature/frontend-nextjs`  
> **Status:** 🔲 Scaffolded — Implementation pending

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- React Query (API data fetching)
- Leaflet (maps)
- i18next (multilingual)

## Pages to Implement
- `/` — Landing page
- `/chat` — AI Legal Assistant chatbot
- `/violations` — Browse violations by location
- `/map` — Enforcement zone map
- `/upload` — Citation OCR upload
- `/profile` — Driving profile & risk score
- `/lawyers` — Attorney directory
- `/appeal` — Appeal guidance

## Getting Started
```bash
npm install
npm run dev
```

## API Integration
Backend runs at `http://localhost:8000`  
Set `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` in `.env.local`
