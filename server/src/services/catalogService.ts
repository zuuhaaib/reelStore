import { itemDao, type Facets, type ItemFilter, type ItemRow } from '../daos/itemDao.ts';
import { HttpError } from '../httpError.ts';

/** Item as the API returns it (camelCase, money in cents). */
export type Item = {
  id: number;
  name: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  genre: string;
  priceCents: number;
  quantity: number;
  imageUrl: string | null;
  trailerUrl: string | null;
};

export function toItem(r: ItemRow): Item {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    brand: r.brand,
    model: r.model,
    genre: r.genre,
    priceCents: r.price_cents,
    quantity: r.quantity,
    imageUrl: r.image_url,
    trailerUrl: r.trailer_url,
  };
}

/** Reads one optional query param; repeated params (?brand=a&brand=b) arrive as arrays and are rejected. */
function param(query: Record<string, unknown>, name: string): string | undefined {
  const v = query[name];
  if (v === undefined || v === '') return undefined;
  if (typeof v !== 'string') throw new HttpError(400, `${name} must be a single value`);
  if (v.length > 100) throw new HttpError(400, `${name} is too long`);
  return v.trim() || undefined;
}

function oneOf<T extends string>(query: Record<string, unknown>, name: string, allowed: readonly T[], fallback: T): T {
  const v = param(query, name);
  if (v === undefined) return fallback;
  if (!allowed.includes(v as T)) throw new HttpError(400, `${name} must be one of: ${allowed.join(', ')}`);
  return v as T;
}

export function listItems(query: Record<string, unknown>): Item[] {
  const filter: ItemFilter = {
    category: param(query, 'category'),
    brand: param(query, 'brand'),
    model: param(query, 'model'),
    genre: param(query, 'genre'),
    q: param(query, 'q'),
    sort: oneOf(query, 'sort', ['name', 'price'], 'name'),
    dir: oneOf(query, 'dir', ['asc', 'desc'], 'asc'),
  };
  return itemDao.list(filter).map(toItem);
}

export function getItem(idParam: string): Item {
  const id = /^\d{1,9}$/.test(idParam) ? Number(idParam) : NaN;
  const row = Number.isNaN(id) ? undefined : itemDao.findById(id);
  if (!row) throw new HttpError(404, 'Item not found');
  return toItem(row);
}

export function getFacets(): Facets {
  return itemDao.facets();
}
