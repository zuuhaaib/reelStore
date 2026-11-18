import { db } from '../db.ts';

export type ItemRow = {
  id: number;
  name: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  genre: string;
  price_cents: number;
  quantity: number;
  image_url: string | null;
  trailer_url: string | null;
};

export type ItemFilter = {
  category?: string;
  brand?: string;
  model?: string;
  genre?: string;
  q?: string;
  sort: 'name' | 'price';
  dir: 'asc' | 'desc';
};

export type Facets = { categories: string[]; brands: string[]; models: string[]; genres: string[] };

// Column names can't be bound as SQL parameters, so sort keys map through this whitelist.
const SORT_COLUMNS = { name: 'name', price: 'price_cents' } as const;

/** All SQL touching the item table lives here. */
export const itemDao = {
  list(f: ItemFilter): ItemRow[] {
    const where: string[] = [];
    const params: string[] = [];
    for (const col of ['category', 'brand', 'model', 'genre'] as const) {
      if (f[col]) {
        where.push(`${col} = ?`);
        params.push(f[col]);
      }
    }
    if (f.q) {
      // Keyword search over the text fields, so "horror", "criterion" or "samurai" all match.
      // % and _ in the user's text are escaped so they match literally.
      const like = `%${f.q.replace(/[\\%_]/g, '\\$&')}%`;
      where.push(
        "(name LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' OR category LIKE ? ESCAPE '\\' OR genre LIKE ? ESCAPE '\\' OR brand LIKE ? ESCAPE '\\')",
      );
      params.push(like, like, like, like, like);
    }
    const sql =
      'SELECT * FROM item' +
      (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
      ` ORDER BY ${SORT_COLUMNS[f.sort]} ${f.dir === 'desc' ? 'DESC' : 'ASC'}, id ASC`;
    return db.prepare(sql).all(...params) as ItemRow[];
  },

  findById(id: number): ItemRow | undefined {
    return db.prepare('SELECT * FROM item WHERE id = ?').get(id) as ItemRow | undefined;
  },

  /** Distinct values for the filter dropdowns. */
  facets(): Facets {
    const distinct = (col: string) =>
      (db.prepare(`SELECT DISTINCT ${col} AS v FROM item ORDER BY v`).all() as { v: string }[]).map((r) => r.v);
    return {
      categories: distinct('category'),
      brands: distinct('brand'),
      models: distinct('model'),
      genres: distinct('genre'),
    };
  },
};
