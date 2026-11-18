import express, { type NextFunction, type Request, type Response } from 'express';
import session from 'express-session';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HttpError } from './httpError.ts';
import { authRouter } from './routes/auth.ts';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use(
    session({
      name: 'sid',
      secret: process.env.SESSION_SECRET ?? 'dev-only-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
      // shortcut: default in-memory session store, so a server restart signs everyone out. Swap for a DB store if that matters for the demo.
    }),
  );
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

  // Each feature adds its router here: catalog, cart, checkout, admin.
  app.use('/api', authRouter);
  app.use('/api', (_req, res) => void res.status(404).json({ error: 'Not found' }));

  // In production the built React app is served from the same origin.
  const webDist = fileURLToPath(new URL('../../web/dist', import.meta.url));
  if (existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get('/{*path}', (_req, res) => res.sendFile('index.html', { root: webDist }));
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) return void res.status(err.status).json({ error: err.message });
    if (err?.type === 'entity.parse.failed') return void res.status(400).json({ error: 'Malformed JSON' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}
