import { Router } from 'express';
import * as catalogService from '../services/catalogService.ts';

/** Controller for the public catalog (no login needed). */
export const catalogRouter = Router();

catalogRouter.get('/items', (req, res) => {
  res.json({ items: catalogService.listItems(req.query) });
});

// Must be registered before /items/:id, or "facets" would be read as an id.
catalogRouter.get('/items/facets', (_req, res) => {
  res.json(catalogService.getFacets());
});

catalogRouter.get('/items/:id', (req, res) => {
  res.json({ item: catalogService.getItem(req.params.id) });
});
