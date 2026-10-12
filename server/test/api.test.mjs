// Teste automate pe API (cazurile de testare din docs/testare.md).
// Rulare: TEST_DATABASE_URL=postgresql://.../agro_test npm test --workspace server
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { ADMIN, getTestDatabaseUrl, listingForm, login, registerVerified, resetDatabase, startServer } from './helpers.mjs';

let server;
let api;
const tokens = {};
let listingId;

before(async () => {
  const databaseUrl = getTestDatabaseUrl();
  await resetDatabase(databaseUrl);
  server = await startServer(databaseUrl);
  api = server.api;
  tokens.admin = await login(api, ADMIN.email, ADMIN.password);
});

after(async () => {
  await server?.stop();
});

const stockOf = async (id) => Number((await api('GET', '/listings')).body.listings.find((listing) => listing.id === id)?.quantityKg);

const createOrder = (quantityKg, token = tokens.distributor) => api('POST', '/orders', { token, json: { listingId, quantityKg } });

describe('Conturi și acces', () => {
  test('TC01: contul se activează după confirmarea emailului (aprobare automată)', async () => {
    tokens.seller = await registerVerified(server, { fullName: 'Ion Fermierul', email: 'seller@test.local', role: 'seller' });
    tokens.distributor = await registerVerified(server, { fullName: 'Distribuitor Chișinău', email: 'dist@test.local', role: 'distributor', region: 'Chișinău' });
    tokens.otherSeller = await registerVerified(server, { fullName: 'Alt Vânzător', email: 'seller2@test.local', role: 'seller' });
    assert.ok(tokens.seller && tokens.distributor && tokens.otherSeller);
  });

  test('TC02: autentificarea cu parolă greșită este respinsă (401)', async () => {
    const response = await api('POST', '/auth/login', { json: { email: 'seller@test.local', password: 'gresita123' } });
    assert.equal(response.status, 401);
  });

  test('TC03: cabinetul nu este accesibil fără autentificare (401)', async () => {
    assert.equal((await api('GET', '/dashboard/me')).status, 401);
  });

  test('TC04: distribuitorul nu poate publica anunțuri (403)', async () => {
    const response = await api('POST', '/listings', { token: tokens.distributor, form: listingForm() });
    assert.equal(response.status, 403);
  });
});

describe('Anunțuri și moderare', () => {
  test('TC05: anunțul unui vânzător nou ajunge la moderare, apoi apare în catalog după aprobare', async () => {
    const created = await api('POST', '/listings', { token: tokens.seller, form: listingForm({ quantityKg: '1000' }) });
    assert.equal(created.status, 201);
    assert.equal(created.body.listing.status, 'pending');
    listingId = created.body.listing.id;

    const queue = await api('GET', '/admin/listings?status=pending', { token: tokens.admin });
    assert.match(queue.body.listings.find((listing) => listing.id === listingId).moderationReasons.join(' '), /Vânzător nou/);
    assert.ok(!(await api('GET', '/listings')).body.listings.some((listing) => listing.id === listingId));

    const approved = await api('PATCH', `/admin/listings/${listingId}/status`, { token: tokens.admin, json: { status: 'active' } });
    assert.equal(approved.status, 200);
    assert.equal(await stockOf(listingId), 1000);
  });

  test('TC06: un anunț cu link în text nu se publică automat', async () => {
    const created = await api('POST', '/listings', { token: tokens.seller, form: listingForm({ deliveryTerms: 'Detalii pe www.exemplu.md' }) });
    assert.equal(created.body.listing.status, 'pending');
  });
});

describe('Comenzi și stoc', () => {
  let orderId;

  test('TC07: o comandă peste stocul disponibil este respinsă (400)', async () => {
    const response = await createOrder(1500);
    assert.equal(response.status, 400);
    assert.match(response.body.message, /1000 kg/);
  });

  test('TC08: o comandă validă este creată, iar vânzătorul primește o notificare în aplicație', async () => {
    const response = await createOrder(300);
    assert.equal(response.status, 201);
    assert.equal(response.body.order.status, 'pending');
    orderId = response.body.order.id;

    await new Promise((resolve) => setTimeout(resolve, 300));
    const notifications = await api('GET', '/notifications', { token: tokens.seller });
    assert.ok(notifications.body.notifications.some((notification) => notification.type === 'order_new'));
  });

  test('TC09: alt vânzător nu poate accepta comanda (404)', async () => {
    const response = await api('PATCH', `/orders/${orderId}/status`, { token: tokens.otherSeller, json: { status: 'confirmed' } });
    assert.equal(response.status, 404);
  });

  test('TC10: acceptarea comenzii scade stocul', async () => {
    const response = await api('PATCH', `/orders/${orderId}/status`, { token: tokens.seller, json: { status: 'confirmed' } });
    assert.equal(response.status, 200);
    assert.equal(await stockOf(listingId), 700);
  });

  test('TC11: aceeași comandă nu poate fi acceptată de două ori (400)', async () => {
    const response = await api('PATCH', `/orders/${orderId}/status`, { token: tokens.seller, json: { status: 'confirmed' } });
    assert.equal(response.status, 400);
    assert.equal(await stockOf(listingId), 700);
  });

  test('TC12: două acceptări simultane: doar una reușește, stocul scade o singură dată', async () => {
    const order = (await createOrder(100)).body.order;
    const results = await Promise.all([1, 2].map(() => api('PATCH', `/orders/${order.id}/status`, { token: tokens.seller, json: { status: 'confirmed' } })));
    assert.deepEqual(results.map((result) => result.status).sort(), [200, 400]);
    assert.equal(await stockOf(listingId), 600);
  });

  test('TC13: o comandă în așteptare nu poate fi marcată ca livrată (400)', async () => {
    const pending = (await createOrder(50)).body.order;
    const response = await api('PATCH', `/orders/${pending.id}/complete`, { token: tokens.seller });
    assert.equal(response.status, 400);
  });

  test('TC14: comanda acceptată poate fi marcată ca livrată; distribuitorul este notificat', async () => {
    const response = await api('PATCH', `/orders/${orderId}/complete`, { token: tokens.seller });
    assert.equal(response.status, 200);
    assert.equal(response.body.order.status, 'completed');

    await new Promise((resolve) => setTimeout(resolve, 300));
    const notifications = await api('GET', '/notifications', { token: tokens.distributor });
    assert.ok(notifications.body.notifications.some((notification) => notification.type === 'order_completed'));
  });

  test('TC15: o comandă livrată nu mai poate fi anulată (400)', async () => {
    const response = await api('PATCH', `/orders/${orderId}/cancel`, { token: tokens.distributor });
    assert.equal(response.status, 400);
    assert.equal(await stockOf(listingId), 600);
  });

  test('TC16: anularea unei comenzi acceptate readuce cantitatea în stoc', async () => {
    const order = (await createOrder(200)).body.order;
    await api('PATCH', `/orders/${order.id}/status`, { token: tokens.seller, json: { status: 'confirmed' } });
    assert.equal(await stockOf(listingId), 400);

    const cancelled = await api('PATCH', `/orders/${order.id}/cancel`, { token: tokens.distributor });
    assert.equal(cancelled.status, 200);
    assert.equal(await stockOf(listingId), 600);
  });

  test('TC17: recenzia se poate lăsa doar după o comandă acceptată, cu nota între 1 și 5', async () => {
    const pending = (await createOrder(10)).body.order;
    assert.equal((await api('POST', `/orders/${pending.id}/review`, { token: tokens.distributor, json: { rating: 5 } })).status, 400);
    assert.equal((await api('POST', `/orders/${orderId}/review`, { token: tokens.distributor, json: { rating: 6 } })).status, 400);

    const saved = await api('POST', `/orders/${orderId}/review`, { token: tokens.distributor, json: { rating: 5, comment: 'Marfă bună, livrare la timp.' } });
    assert.equal(saved.status, 200);
  });
});

describe('Notificări și securitate', () => {
  test('TC18: notificările pot fi marcate ca citite', async () => {
    const before = await api('GET', '/notifications', { token: tokens.seller });
    assert.ok(before.body.unreadCount > 0);

    assert.equal((await api('POST', '/notifications/read-all', { token: tokens.seller })).status, 200);
    const afterRead = await api('GET', '/notifications', { token: tokens.seller });
    assert.equal(afterRead.body.unreadCount, 0);
  });

  test('TC19: un cont blocat de administrator pierde accesul imediat', async () => {
    const users = await api('GET', '/admin/users?status=approved', { token: tokens.admin });
    const other = users.body.users.find((user) => user.email === 'seller2@test.local');
    await api('PATCH', `/admin/users/${other.id}/status`, { token: tokens.admin, json: { status: 'blocked' } });

    assert.equal((await api('GET', '/dashboard/me', { token: tokens.otherSeller })).status, 403);
    assert.equal((await api('POST', '/auth/login', { json: { email: 'seller2@test.local', password: 'parola1234' } })).status, 403);
  });
});
