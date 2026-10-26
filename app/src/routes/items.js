import { Router } from 'express';
import { z } from 'zod';

const text = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => !value.includes('\u0000'), 'invalid characters');

const createItemSchema = z.object({
  name: text(100).pipe(z.string().min(1)),
  description: text(1000).default(''),
});

const searchSchema = text(100).default('');

const idSchema = z.coerce.number().int().positive();

export function itemsRouter({ repo }) {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await repo.listItems(req.user.id));
  });

  router.get('/search', async (req, res) => {
    const term = searchSchema.safeParse(req.query.q);
    if (!term.success) {
      return res.status(400).json({ error: 'invalid_request' });
    }
    return res.json(await repo.searchItems(req.user.id, term.data));
  });

  router.get('/:id', async (req, res) => {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) {
      return res.status(400).json({ error: 'invalid_request' });
    }
    const item = await repo.getItem(req.user.id, id.data);
    if (!item) {
      return res.status(404).json({ error: 'not_found' });
    }
    return res.json(item);
  });

  router.post('/', async (req, res) => {
    const parsed = createItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_request' });
    }
    const item = await repo.createItem(req.user.id, parsed.data);
    return res.status(201).json(item);
  });

  return router;
}
