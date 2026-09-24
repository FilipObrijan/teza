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

## Următorul pas

Definim modelul de date, fluxul de autentificare și backlog-ul MVP înainte de implementarea funcționalităților reale.
