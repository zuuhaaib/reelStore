import type { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './password.ts';

// [name, description, category(format), brand(label), model(edition), genre, price_cents, quantity]
const items: [string, string, string, string, string, string, number, number][] = [
  ['Seven Samurai', 'Kurosawa\'s epic of farmers who hire masterless samurai.', 'Blu-ray', 'Criterion', 'Standard', 'Action', 3999, 25],
  ['Seven Samurai', 'Kurosawa\'s epic, restored in 4K.', '4K UHD', 'Criterion', 'Collector\'s', 'Action', 5999, 3],
  ['In the Mood for Love', 'Two neighbours in 1962 Hong Kong drift toward each other.', 'Blu-ray', 'Criterion', 'Standard', 'Romance', 3499, 18],
  ['Everything Everywhere All at Once', 'A laundromat owner jumps across the multiverse.', '4K UHD', 'A24', 'Steelbook', 'Sci-Fi', 3499, 12],
  ['Everything Everywhere All at Once', 'A laundromat owner jumps across the multiverse.', 'DVD', 'A24', 'Standard', 'Sci-Fi', 1499, 40],
  ['Hereditary', 'A grieving family uncovers something sinister.', 'Blu-ray', 'A24', 'Standard', 'Horror', 2499, 2],
  ['Suspiria (1977)', 'A dancer arrives at a German ballet academy run by witches.', '4K UHD', 'Arrow', 'Collector\'s', 'Horror', 5499, 6],
  ['Battle Royale', 'Students are forced to fight on a remote island.', 'Blu-ray', 'Arrow', 'Standard', 'Thriller', 2999, 15],
  ['Moonlight', 'Three chapters in the life of a young man in Miami.', 'Blu-ray', 'A24', 'Standard', 'Drama', 2299, 20],
  ['Moonlight', 'Theatrical one-sheet, 27x40.', 'Poster', 'A24', 'Standard', 'Drama', 1999, 8],
  ['Stalker', 'A guide leads two men into the mysterious Zone.', 'Blu-ray', 'Criterion', 'Standard', 'Sci-Fi', 3999, 9],
  ['The Thing (1982)', 'An Antarctic research team meets a shape-shifting alien.', '4K UHD', 'Arrow', 'Steelbook', 'Horror', 4499, 1],
];

/** Fills an empty database with demo items and two test accounts (logins listed in the README). */
export async function seed(db: DatabaseSync): Promise<void> {
  const insertItem = db.prepare(`INSERT INTO item (name, description, category, brand, model, genre, price_cents, quantity, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const it of items) {
    // shortcut: placeholder art from placehold.co, replace with real cover images in web/public/images.
    insertItem.run(...it, `https://placehold.co/400x600?text=${encodeURIComponent(it[0])}`);
  }

  // Each user gets their own address row so editing one profile can't change another.
  const insertAddress = db.prepare(`INSERT INTO address (street, city, province, country, zip, phone) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertUser = db.prepare(`INSERT INTO users (email, password_hash, first_name, last_name, role, address_id, card_name, card_number, card_expiry)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const adminAddr = insertAddress.run('4700 Keele St', 'Toronto', 'ON', 'Canada', 'M3J 1P3', '416-555-0100').lastInsertRowid;
  insertUser.run('admin@estore.test', await hashPassword('admin123'), 'Store', 'Admin', 'admin', adminAddr, null, null, null);
  const janeAddr = insertAddress.run('567 Yonge St', 'Toronto', 'ON', 'Canada', 'M4Y 1Z2', '647-555-0199').lastInsertRowid;
  insertUser.run('jane@estore.test', await hashPassword('password123'), 'Jane', 'Doe', 'customer', janeAddr,
    'Jane Doe', '4111111111111111', '12/28');
}
