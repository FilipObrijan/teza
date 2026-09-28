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

Frontend-ul și backend-ul sunt găzduite separat, deoarece GitHub Pages servește doar fișiere statice.

**Frontend: GitHub Pages** (https://filipobrijan.github.io/teza/)
1. GitHub → Settings → Pages → Source: **GitHub Actions**.
2. GitHub → Settings → Secrets and variables → Actions → Variables: adaugă `VITE_API_URL` cu adresa API-ului (ex. `https://agrohub-api.onrender.com`).
3. Fiecare push pe `main` rulează [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml).

**Backend + PostgreSQL: Render**
1. Render Dashboard → New → Blueprint → repo-ul `FilipObrijan/teza` (folosește [render.yaml](render.yaml)).
2. Completează `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BREVO_API_KEY` și `SMTP_FROM` (adresa de expeditor verificată în Brevo).
3. Copiază URL-ul serviciului `agrohub-api` în variabila `VITE_API_URL` de pe GitHub și rulează din nou workflow-ul.
