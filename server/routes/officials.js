import express from 'express';
import prisma from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/officials
router.get('/', authenticate, async (req, res) => {
  try {
    const officials = await prisma.official.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'desc' }
    });

    res.json({ officials });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch officials' });
  }
});

// GET /api/officials/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const official = await prisma.official.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!official) {
      res.status(404).json({ error: 'Official not found' });
      return;
    }

    res.json({ official });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch official' });
  }
});

// POST /api/officials (Admin only)
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, position, contact, term_start, term_end, is_active } = req.body;

    const official = await prisma.official.create({
      data: {
        name,
        position,
        contact,
        term_start: term_start ? new Date(term_start) : new Date(),
        term_end: term_end ? new Date(term_end) : null,
        is_active: is_active ?? true
      }
    });

    res.status(201).json({ message: 'Official added', official });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create official' });
  }
});

// PUT /api/officials/:id (Admin only)
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const official = await prisma.official.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });

    res.json({ message: 'Official updated', official });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update official' });
  }
});

// DELETE /api/officials/:id (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.official.update({
      where: { id: parseInt(req.params.id) },
      data: { is_active: false }
    });

    res.json({ message: 'Official deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete official' });
  }
});

export default router;
