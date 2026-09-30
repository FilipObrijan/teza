# Agro B2B Platform

Platformă web B2B pentru gestionarea comenzilor en-gros și optimizarea fluxurilor de distribuție a produselor agricole.

## Structură inițială

- `client/` — aplicația frontend React + TypeScript
- `server/` — API-ul backend Node.js + TypeScript
- `docker-compose.yml` — serviciul PostgreSQL local

## Obiectiv MVP

1. Landing page cu prezentarea platformei
2. Autentificare și roluri (Vânzător / Distribuitor / Administrator)
3. Catalog produse și gestionare stocuri
4. Plasarea și urmărirea comenzilor
5. Admin pentru validare conturi și moderare

## Comenzi rapide

```bash
npm install
npm run db:up
npm run dev
npm run dev:server
```

La prima pornire serverul aplică automat `database/schema.sql` dacă baza de date e goală. Dacă `ADMIN_EMAIL` și `ADMIN_PASSWORD` sunt setate, creează și contul de administrator.

## Deploy

Toate serviciile au planuri gratuite care permit uz comercial. Fiecare push pe `main` actualizează automat site-ul și serverul.

| Parte | Serviciu | Configurare |
|---|---|---|
| Site (frontend) | Cloudflare Pages | build `npm run build --workspace client`, output `client/dist`, variabila `VITE_API_URL` |
| Server (API) | Render | [render.yaml](render.yaml) |
| Bază de date | Neon (PostgreSQL) | `DATABASE_URL` pe Render |
| Emailuri | Brevo | `BREVO_API_KEY` și `SMTP_FROM` pe Render |
| Logare cu Google | Google Cloud (OAuth) | `GOOGLE_CLIENT_ID` pe Render și `VITE_GOOGLE_CLIENT_ID` pe Cloudflare (aceeași valoare) |
| Menținere activă | UptimeRobot | ping la `/api/health` la fiecare 5 minute |

Schimbările de structură a bazei de date se adaugă în [server/src/db/migrate.ts](server/src/db/migrate.ts), cu instrucțiuni idempotente (`IF NOT EXISTS`). `database/schema.sql` rulează doar pe o bază de date goală.
