# API contract

All endpoints live under `/api`, take and return JSON, and use a session cookie (`sid`) for auth.
Errors always look like `{ "error": "human readable message" }` with a 4xx/5xx status.
Money is **integer cents** everywhere (`priceCents: 3999` = $39.99).

Status legend: ✅ built · ⏳ planned (owner in brackets)

## Shared shapes

```jsonc
// Address
{ "street": "1 Main St", "city": "Toronto", "province": "ON", "country": "Canada", "zip": "M1M 1M1", "phone": "416-555-0100" | null }

// User (what the API returns; never includes the password hash or full card number)
{ "id": 2, "email": "jane@estore.test", "firstName": "Jane", "lastName": "Doe", "role": "customer" | "admin",
  "address": Address | null, "card": { "name": "Jane Doe", "last4": "1111", "expiry": "12/28" } | null }

// CardInput (request bodies only)
{ "name": "Jane Doe", "number": "4111111111111111", "expiry": "12/28" }

// Item
{ "id": 1, "name": "Seven Samurai", "description": "...", "category": "Blu-ray", "brand": "Criterion",
  "model": "Standard", "genre": "Action", "priceCents": 3999, "quantity": 25, "imageUrl": "...", "trailerUrl": null }

// Order
{ "id": 7, "createdAt": "2026-11-30 14:02:11", "totalCents": 7498, "status": "PAID",
  "shipping": Address, "cardLast4": "1111",
  "items": [{ "itemId": 1, "name": "Seven Samurai", "qty": 2, "priceCents": 3749 }] }
```

## Identity ✅ (together)

| Method | Path | Body | Success |
|---|---|---|---|
| POST | `/auth/register` | `{ email, password (8-128), firstName, lastName, address: Address, card: CardInput }` | `201 { user }`, signs in. `409` if email taken |
| POST | `/auth/login` | `{ email, password }` | `200 { user }`. `401` on bad credentials |
| POST | `/auth/logout` | | `204` |
| GET | `/me` | | `200 { user }`. `401` if signed out |

## Profile ⏳ [teammate]

| Method | Path | Body | Success |
|---|---|---|---|
| PUT | `/me` | any of `{ firstName, lastName, address, card }` | `200 { user }` |
| GET | `/me/orders` | | `200 { orders: Order[] }` newest first |

## Catalog ✅ [me], public

`q` searches name, description, format, genre and label (case-insensitive substring). Defaults: `sort=name&dir=asc`.
Unknown `sort`/`dir` values or a repeated parameter give `400`.

| Method | Path | Success |
|---|---|---|
| GET | `/items?category=&brand=&model=&genre=&q=&sort=price\|name&dir=asc\|desc` | `200 { items: Item[] }` |
| GET | `/items/facets` | `200 { categories: string[], brands: string[], models: string[], genres: string[] }` (fills filter dropdowns) |
| GET | `/items/:id` | `200 { item }`. `404` if missing |

## Cart ⏳ [me], signed in (guest cart lives in localStorage and is merged on login)

| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/cart` | | `200 { lines: [{ item: Item, qty }], totalCents }` |
| PUT | `/cart/:itemId` | `{ qty }` | `200` same as GET. `409` if qty > stock |
| DELETE | `/cart/:itemId` | | `200` same as GET |
| POST | `/cart/merge` | `{ lines: [{ itemId, qty }] }` | `200` same as GET |

## Checkout ⏳ [me], signed in

| Method | Path | Body | Success |
|---|---|---|---|
| POST | `/checkout` | `{ useSaved: true }` or `{ useSaved: false, address: Address, card: CardInput }` | `201 { order }` |

Failures: `409 { error, items: [{ itemId, available }] }` when stock is short; `402 { error: "Credit Card Authorization Failed." }` when payment is denied (cart is kept, user can retry).

## Admin ⏳ [teammate], admin role

| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/admin/orders?customer=&item=&from=&to=` | | `200 { orders: (Order & { customer: { id, email, name } })[] }` |
| GET | `/admin/users` | | `200 { users: User[] }` |
| GET | `/admin/users/:id` | | `200 { user, orders: Order[] }` |
| PUT | `/admin/users/:id` | same as `PUT /me` | `200 { user }` |
| POST | `/admin/items` | Item without `id` | `201 { item }` |
| PUT | `/admin/items/:id` | any Item fields; `quantity` change is logged | `200 { item }` |
| GET | `/admin/inventory-log?item=` | | `200 { entries: [{ itemId, change, reason, createdAt }] }` |

## Payment service ⏳ [teammate] (separate app, not under `/api`)

`POST http://<payment-host>/pay`

```jsonc
// request
{ "amountCents": 7498, "card": { "name": "Jane Doe", "number": "4111111111111111", "expiry": "12/28" } }
// response 200
{ "approved": true, "transactionId": "txn_000042" }
{ "approved": false, "reason": "declined" }   // every 3rd request
```

The main server reads the URL from `PAYMENT_URL` (default `http://localhost:4000`). Until the service exists, checkout can stub it.
