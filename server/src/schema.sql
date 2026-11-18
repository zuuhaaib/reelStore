-- E-store schema (SQLite). Money is stored as integer cents to avoid float rounding.
-- Kept to portable SQL so moving to Postgres only touches the DAO layer.

CREATE TABLE IF NOT EXISTS address (
  id        INTEGER PRIMARY KEY,
  street    TEXT NOT NULL,
  city      TEXT NOT NULL,
  province  TEXT NOT NULL,
  country   TEXT NOT NULL,
  zip       TEXT NOT NULL,
  phone     TEXT
);

-- "users", not "user": user is a reserved word in Postgres.
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  address_id    INTEGER REFERENCES address(id),
  -- Fake cards only (course project); a real store would never keep the full number.
  card_name     TEXT,
  card_number   TEXT,
  card_expiry   TEXT
);

-- Film store mapping: category = format, brand = label/distributor, model = edition.
CREATE TABLE IF NOT EXISTS item (
  id           INTEGER PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL,
  category     TEXT NOT NULL,
  brand        TEXT NOT NULL,
  model        TEXT NOT NULL,
  genre        TEXT NOT NULL,
  price_cents  INTEGER NOT NULL CHECK (price_cents >= 0),
  quantity     INTEGER NOT NULL CHECK (quantity >= 0),
  image_url    TEXT,
  trailer_url  TEXT
);

CREATE TABLE IF NOT EXISTS cart_item (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id  INTEGER NOT NULL REFERENCES item(id),
  qty      INTEGER NOT NULL CHECK (qty > 0),
  PRIMARY KEY (user_id, item_id)
);

-- Purchase order. Shipping address is copied in so later profile edits don't rewrite history.
CREATE TABLE IF NOT EXISTS po (
  id             INTEGER PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id),
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  total_cents    INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'PAID',
  ship_street    TEXT NOT NULL,
  ship_city      TEXT NOT NULL,
  ship_province  TEXT NOT NULL,
  ship_country   TEXT NOT NULL,
  ship_zip       TEXT NOT NULL,
  ship_phone     TEXT,
  card_last4     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS po_item (
  po_id        INTEGER NOT NULL REFERENCES po(id) ON DELETE CASCADE,
  item_id      INTEGER NOT NULL REFERENCES item(id),
  qty          INTEGER NOT NULL CHECK (qty > 0),
  price_cents  INTEGER NOT NULL,
  PRIMARY KEY (po_id, item_id)
);

-- Every stock change (admin edit, checkout) gets a row: backs the admin "inventory history" view.
CREATE TABLE IF NOT EXISTS inventory_log (
  id          INTEGER PRIMARY KEY,
  item_id     INTEGER NOT NULL REFERENCES item(id),
  change      INTEGER NOT NULL,
  reason      TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_po_user ON po(user_id);
CREATE INDEX IF NOT EXISTS idx_po_created ON po(created_at);
