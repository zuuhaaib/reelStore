import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';

process.env.DB_PATH = ':memory:'; // fresh seeded DB per run; must be set before db.ts loads
const { createApp } = await import('../src/app.ts');

let server: Server;
let base: string;
before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://localhost:${(server.address() as { port: number }).port}/api`;
});
after(() => server.close());

/** Tiny client that keeps the session cookie between calls. */
function client() {
  let cookie = '';
  return async (path: string, init: { method?: string; body?: unknown } = {}) => {
    const res = await fetch(base + path, {
      method: init.method ?? (init.body ? 'POST' : 'GET'),
      headers: { 'content-type': 'application/json', cookie },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return { status: res.status, body: res.status === 204 ? null : await res.json() };
  };
}

const newUser = {
  email: 'Sam@Example.com',
  password: 'hunter2hunter2',
  firstName: 'Sam',
  lastName: 'Lee',
  address: { street: '1 Main St', city: 'Toronto', province: 'ON', country: 'Canada', zip: 'M1M 1M1' },
  card: { name: 'Sam Lee', number: '4111 1111 1111 1111', expiry: '01/29' },
};

test('register signs in, masks the card and hides the hash', async () => {
  const api = client();
  const r = await api('/auth/register', { body: newUser });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.email, 'sam@example.com');
  assert.deepEqual(r.body.user.card, { name: 'Sam Lee', last4: '1111', expiry: '01/29' });
  assert.equal(JSON.stringify(r.body).includes('password'), false);
  assert.equal((await api('/me')).body.user.address.city, 'Toronto');
});

test('duplicate email is rejected (case-insensitive)', async () => {
  const r = await client()('/auth/register', { body: { ...newUser, email: 'SAM@example.com' } });
  assert.equal(r.status, 409);
});

test('bad register input gets a 400 with a message', async () => {
  const api = client();
  for (const bad of [
    {},
    { ...newUser, email: 'not-an-email' },
    { ...newUser, password: 'short' },
    { ...newUser, card: { ...newUser.card, expiry: '13/29' } },
    { ...newUser, card: { ...newUser.card, number: 'abcd' } },
    { ...newUser, address: null },
  ]) {
    const r = await api('/auth/register', { body: bad });
    assert.equal(r.status, 400, JSON.stringify(bad));
    assert.equal(typeof r.body.error, 'string');
  }
});

test('login, me, logout round trip with seeded account', async () => {
  const api = client();
  assert.equal((await api('/me')).status, 401);
  const r = await api('/auth/login', { body: { email: 'jane@estore.test', password: 'password123' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.user.role, 'customer');
  assert.equal((await api('/me')).status, 200);
  assert.equal((await api('/auth/logout', { method: 'POST' })).status, 204);
  assert.equal((await api('/me')).status, 401);
});

test('wrong password and unknown email give the same 401', async () => {
  const api = client();
  const a = await api('/auth/login', { body: { email: 'jane@estore.test', password: 'wrong' } });
  const b = await api('/auth/login', { body: { email: 'nobody@estore.test', password: 'wrong' } });
  assert.equal(a.status, 401);
  assert.deepEqual(a.body, b.body);
});

test('malformed JSON and unknown routes', async () => {
  const res = await fetch(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' });
  assert.equal(res.status, 400);
  assert.equal((await client()('/nope')).status, 404);
});
