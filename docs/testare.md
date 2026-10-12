# Cazuri de testare

Testele automate se află în [`server/test/api.test.mjs`](../server/test/api.test.mjs) și se rulează cu `npm test` (vezi README). Fiecare rulare pornește serverul pe o bază de date goală, creează conturile prin API (cu codul de verificare din email) și parcurge cazurile de mai jos, în ordine. Pe GitHub rulează automat la fiecare push.

| ID | Modul | Caz de testare | Pași | Rezultat așteptat |
|---|---|---|---|---|
| TC01 | Conturi | Înregistrare cu confirmarea emailului | Înregistrare vânzător și distribuitor, introducerea codului primit pe email, autentificare | Contul este aprobat automat după confirmare; autentificarea întoarce un token |
| TC02 | Conturi | Parolă greșită | Autentificare cu o parolă incorectă | 401, autentificarea este refuzată |
| TC03 | Securitate | Acces fără autentificare | Cerere la cabinet (`/dashboard/me`) fără token | 401 |
| TC04 | Securitate | Restricție de rol | Distribuitorul încearcă să publice un anunț | 403 |
| TC05 | Anunțuri | Moderarea anunțului unui vânzător nou | Vânzătorul publică primul anunț; adminul îl aprobă | Anunțul intră „în așteptare” cu motivul afișat, apoi apare în catalog după aprobare |
| TC06 | Anunțuri | Anunț cu link în text | Anunț cu „www…” în termenii de livrare | Nu se publică automat, rămâne „în așteptare” |
| TC07 | Comenzi | Comandă peste stoc | Comandă de 1500 kg dintr-un stoc de 1000 kg | 400, mesaj cu cantitatea disponibilă |
| TC08 | Comenzi | Comandă validă | Comandă de 300 kg | 201, status „în așteptare”; vânzătorul primește o notificare în aplicație |
| TC09 | Securitate | Acceptare de către alt vânzător | Un vânzător încearcă să accepte comanda altui vânzător | 404 |
| TC10 | Stoc | Acceptarea scade stocul | Vânzătorul acceptă comanda de 300 kg | Stocul scade de la 1000 la 700 kg |
| TC11 | Comenzi | Acceptare de două ori | A doua acceptare a aceleiași comenzi | 400, stocul rămâne 700 kg |
| TC12 | Stoc | Acceptări simultane | Două cereri de acceptare trimise în același timp | Doar una reușește (200 + 400); stocul scade o singură dată |
| TC13 | Comenzi | Livrarea unei comenzi neacceptate | „Marchează ca livrată” pe o comandă în așteptare | 400 |
| TC14 | Comenzi | Livrarea unei comenzi acceptate | Vânzătorul marchează comanda ca livrată | Status „Livrată” (`completed`); distribuitorul primește o notificare |
| TC15 | Comenzi | Anularea unei comenzi livrate | Distribuitorul încearcă să anuleze comanda livrată | 400, stocul nu se modifică |
| TC16 | Stoc | Anularea unei comenzi acceptate | Comandă de 200 kg acceptată, apoi anulată | Stocul scade la acceptare și revine la anulare |
| TC17 | Recenzii | Reguli pentru recenzii | Recenzie la o comandă în așteptare; notă 6; recenzie validă după livrare | 400, 400, apoi 200 |
| TC18 | Notificări | Marcarea notificărilor ca citite | „Marchează toate ca citite” | Numărul de notificări necitite devine 0 |
| TC19 | Securitate | Cont blocat | Adminul blochează un cont autentificat | Sesiunea existentă primește 403 imediat; autentificarea nouă este refuzată |

## Ciclul de viață al unei comenzi

```
în așteptare (pending) ──acceptă──▶ acceptată (confirmed) ──marchează ca livrată──▶ livrată (completed)
        │                                   │
        ├──refuză──▶ refuzată (rejected)    └──anulează (distribuitorul)──▶ anulată (cancelled), stocul revine
        └──anulează (distribuitorul)──▶ anulată (cancelled)
```

O comandă refuzată sau anulată poate fi editată de distribuitor și retrimisă (revine „în așteptare”). O comandă livrată nu mai poate fi anulată.
