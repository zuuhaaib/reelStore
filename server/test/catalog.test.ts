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

async function get(path: string) {
  const res = await fetch(base + path);
  return { status: res.status, body: await res.json() };
}
const names = (items: { name: string }[]) => items.map((i) => i.name);

test('lists every item without login, sorted by name by default', async () => {
  const { status, body } = await get('/items');
  assert.equal(status, 200);
  assert.equal(body.items.length, 12);
  const sorted = [...names(body.items)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  assert.deepEqual(names(body.items), sorted);
  assert.equal(typeof body.items[0].priceCents, 'number');
  assert.equal('price_cents' in body.items[0], false);
});

test('filters by category, brand, model and genre, and combines them', async () => {
  assert.equal((await get('/items?brand=Criterion')).body.items.length, 4);
  assert.equal((await get('/items?genre=Horror')).body.items.length, 3);
  assert.ok((await get('/items?category=4K%20UHD')).body.items.every((i: any) => i.category === '4K UHD'));
  assert.ok((await get('/items?model=Steelbook')).body.items.every((i: any) => i.model === 'Steelbook'));
  const both = (await get('/items?brand=Arrow&genre=Horror')).body.items;
  assert.deepEqual(names(both).sort(), ['Suspiria (1977)', 'The Thing (1982)']);
  assert.equal((await get('/items?brand=Nobody')).body.items.length, 0);
});

test('keyword search matches name, genre and description, case-insensitive', async () => {
  assert.ok(names((await get('/items?q=samurai')).body.items).every((n) => n === 'Seven Samurai'));
  assert.equal((await get('/items?q=HORROR')).body.items.length, 3);
  assert.equal((await get('/items?q=multiverse')).body.items.length, 2);
  // LIKE wildcards in user input match literally, not "everything".
  assert.equal((await get('/items?q=%25')).body.items.length, 0);
  assert.equal((await get('/items?q=_')).body.items.length, 0);
});

test('sorts by price both ways', async () => {
  const asc = (await get('/items?sort=price&dir=asc')).body.items.map((i: any) => i.priceCents);
  const desc = (await get('/items?sort=price&dir=desc')).body.items.map((i: any) => i.priceCents);
  assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
  assert.deepEqual(desc, [...asc].reverse());
  assert.equal(asc[0], 1499);
});

test('rejects bad sort, dir and repeated params with 400', async () => {
  for (const q of ['sort=rating', 'dir=up', 'brand=A24&brand=Arrow', 'sort=name;DROP TABLE item']) {
    const r = await get(`/items?${q}`);
    assert.equal(r.status, 400, q);
    assert.equal(typeof r.body.error, 'string');
  }
});

test('item detail includes stock; unknown or bad ids are 404', async () => {
  const { status, body } = await get('/items/1');
  assert.equal(status, 200);
  assert.equal(body.item.name, 'Seven Samurai');
  assert.equal(body.item.quantity, 25);
  for (const id of ['999', 'abc', '1.5', '-1', '99999999999999']) {
    assert.equal((await get(`/items/${id}`)).status, 404, id);
  }
});

test('facets list the distinct filter values', async () => {
  const { status, body } = await get('/items/facets');
  assert.equal(status, 200);
  assert.deepEqual(body.brands, ['A24', 'Arrow', 'Criterion']);
  assert.ok(body.categories.includes('Poster'));
  assert.ok(body.models.includes('Steelbook'));
  assert.ok(body.genres.includes('Sci-Fi'));
});
