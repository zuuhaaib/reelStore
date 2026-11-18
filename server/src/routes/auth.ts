import { Router, type Request } from 'express';
import { promisify } from 'node:util';
import * as authService from '../services/authService.ts';
import { requireAuth } from '../middleware/auth.ts';

/** Controller for identity: register, login, logout, current user. */
export const authRouter = Router();

// New session id on sign-in so a pre-login session id can't be reused (session fixation).
async function signIn(req: Request, userId: number) {
  await promisify(req.session.regenerate.bind(req.session))();
  req.session.userId = userId;
}

authRouter.post('/auth/register', async (req, res) => {
  const user = await authService.register(req.body);
  await signIn(req, user.id);
  res.status(201).json({ user });
});

authRouter.post('/auth/login', async (req, res) => {
  const user = await authService.login(req.body);
  await signIn(req, user.id);
  res.json({ user });
});

authRouter.post('/auth/logout', async (req, res) => {
  await promisify(req.session.destroy.bind(req.session))();
  res.clearCookie('sid').status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  const user = authService.getUser(req.session.userId!);
  if (!user) return void res.status(401).json({ error: 'Not signed in' });
  res.json({ user });
});
