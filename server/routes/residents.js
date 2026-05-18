import express from 'express';
import prisma from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, residentValidation } from '../middleware/validate.js';

const router = express.Router();

// GET /api/residents (list all residents)
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = search
      ? { OR: [{ full_name: { contains: search, mode: 'insensitive' } }, { address: { contains: search, mode: 'insensitive' } }] }
      : {};

    const [residents, total] = await Promise.all([
      prisma.resident.findMany({
        where,
        skip: offset,
        take: parseInt(limit),
        orderBy: { full_name: 'asc' },
        include: { user: { select: { username: true } } }
      }),
      prisma.resident.count({ where })
    ]);

    res.json({
      residents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
});

// GET /api/residents/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const resident = await prisma.resident.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!resident) {
      res.status(404).json({ error: 'Resident not found' });
      return;
    }

    res.json({ resident });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resident' });
  }
});

// POST /api/residents (create) - Admin only
router.post('/', authenticate, authorize('ADMIN'), validate(residentValidation), async (req, res) => {
  try {
    const resident = await prisma.resident.create({
      data: req.body
    });

    res.status(201).json({ message: 'Resident created', resident });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create resident' });
  }
});

// PUT /api/residents/:id - Admin only
router.put('/:id', authenticate, authorize('ADMIN'), validate(residentValidation), async (req, res) => {
  try {
    const resident = await prisma.resident.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });

    res.json({ message: 'Resident updated', resident });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update resident' });
  }
});

// DELETE /api/residents/:id - Admin only
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.resident.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ message: 'Resident deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete resident' });
  }
});

// GET /api/residents/stats (dashboard stats)
router.get('/stats/all', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const total = await prisma.resident.count();
    const active = await prisma.resident.count({ where: { status: 'Active' } });

    res.json({ total, active });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
