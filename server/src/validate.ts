import { HttpError } from './httpError.ts';
import type { Address, Card } from './daos/userDao.ts';

// Input checks for request bodies. Each returns a clean value or throws a 400.

export function str(body: any, field: string, max = 100): string {
  const v = body?.[field];
  if (typeof v !== 'string' || !v.trim()) throw new HttpError(400, `${field} is required`);
  if (v.length > max) throw new HttpError(400, `${field} must be at most ${max} characters`);
  return v.trim();
}

export function email(body: any): string {
  const v = str(body, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new HttpError(400, 'email is not valid');
  return v;
}

export function password(body: any): string {
  const v = body?.password;
  if (typeof v !== 'string' || v.length < 8 || v.length > 128) {
    throw new HttpError(400, 'password must be 8 to 128 characters');
  }
  return v;
}

export function address(body: any): Address {
  const a = body?.address;
  if (typeof a !== 'object' || a === null) throw new HttpError(400, 'address is required');
  return {
    street: str(a, 'street'),
    city: str(a, 'city', 60),
    province: str(a, 'province', 60),
    country: str(a, 'country', 60),
    zip: str(a, 'zip', 20),
    phone: typeof a.phone === 'string' && a.phone.trim() ? a.phone.trim().slice(0, 20) : null,
  };
}

export function card(body: any): Card {
  const c = body?.card;
  if (typeof c !== 'object' || c === null) throw new HttpError(400, 'card is required');
  const number = str(c, 'number', 30).replace(/[\s-]/g, '');
  if (!/^\d{12,19}$/.test(number)) throw new HttpError(400, 'card.number must be 12 to 19 digits');
  const expiry = str(c, 'expiry', 5);
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) throw new HttpError(400, 'card.expiry must be MM/YY');
  return { name: str(c, 'name'), number, expiry };
}
