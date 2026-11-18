import type { NextFunction, Request, Response } from 'express';
import { userDao } from '../daos/userDao.ts';
import { HttpError } from '../httpError.ts';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.session.userId) throw new HttpError(401, 'Not signed in');
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const id = req.session.userId;
  if (!id) throw new HttpError(401, 'Not signed in');
  if (userDao.findById(id)?.role !== 'admin') throw new HttpError(403, 'Admins only');
  next();
}
