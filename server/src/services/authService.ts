import { userDao, type Address, type UserRow } from '../daos/userDao.ts';
import { HttpError } from '../httpError.ts';
import { hashPassword, verifyPassword } from '../password.ts';
import * as v from '../validate.ts';

/** What the API returns for a user: no password hash, card number masked to the last 4 digits. */
export type PublicUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
  address: Address | null;
  card: { name: string; last4: string; expiry: string } | null;
};

export function toPublicUser(u: UserRow): PublicUser {
  return {
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    role: u.role,
    address: u.address_id ? (userDao.findAddress(u.address_id) ?? null) : null,
    card: u.card_number ? { name: u.card_name!, last4: u.card_number.slice(-4), expiry: u.card_expiry! } : null,
  };
}

export async function register(body: unknown): Promise<PublicUser> {
  const input = {
    email: v.email(body),
    password: v.password(body),
    firstName: v.str(body, 'firstName', 60),
    lastName: v.str(body, 'lastName', 60),
    address: v.address(body),
    card: v.card(body),
  };
  if (userDao.findByEmail(input.email)) throw new HttpError(409, 'An account with that email already exists');
  const id = userDao.create({ ...input, passwordHash: await hashPassword(input.password) });
  return toPublicUser(userDao.findById(id)!);
}

export async function login(body: unknown): Promise<PublicUser> {
  const email = v.email(body);
  const password = v.str(body, 'password', 128);
  const user = userDao.findByEmail(email);
  // Same message for unknown email and wrong password, so the API doesn't reveal which emails exist.
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  return toPublicUser(user);
}

export function getUser(id: number): PublicUser | undefined {
  const user = userDao.findById(id);
  return user && toPublicUser(user);
}
