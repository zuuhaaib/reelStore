import { db, transaction } from '../db.ts';

export type Address = {
  street: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone: string | null;
};

export type Card = { name: string; number: string; expiry: string };

export type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'customer' | 'admin';
  address_id: number | null;
  card_name: string | null;
  card_number: string | null;
  card_expiry: string | null;
};

export type NewUser = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  address: Address;
  card: Card;
};

/** All SQL touching users/address lives here. */
export const userDao = {
  findByEmail(email: string): UserRow | undefined {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  },

  findById(id: number): UserRow | undefined {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  },

  findAddress(id: number): Address | undefined {
    return db.prepare('SELECT street, city, province, country, zip, phone FROM address WHERE id = ?').get(id) as
      | Address
      | undefined;
  },

  /** Inserts the address and the user together; returns the new user id. */
  create(u: NewUser): number {
    return transaction(() => {
      const a = u.address;
      const addressId = db
        .prepare('INSERT INTO address (street, city, province, country, zip, phone) VALUES (?, ?, ?, ?, ?, ?)')
        .run(a.street, a.city, a.province, a.country, a.zip, a.phone).lastInsertRowid;
      return Number(
        db
          .prepare(
            `INSERT INTO users (email, password_hash, first_name, last_name, address_id, card_name, card_number, card_expiry)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(u.email, u.passwordHash, u.firstName, u.lastName, addressId, u.card.name, u.card.number, u.card.expiry)
          .lastInsertRowid,
      );
    });
  },
};
