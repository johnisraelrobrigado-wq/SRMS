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

    // Residents may only view their own profile
    if (req.user.role !== 'ADMIN' && (!resident.user_id || resident.user_id !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ resident });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resident' });
  }
});

// POST /api/residents (create) - Admin or self-only
router.post('/', authenticate, async (req, res) => {
  try {
    const { birthday, ...rest } = req.body;

    // Residents may only create a profile for themselves
    if (req.user.role !== 'ADMIN') {
      const existing = await prisma.resident.findFirst({
        where: { user_id: req.user.id }
      });
      if (existing) {
        return res.status(400).json({ error: 'Resident profile already exists for this account' });
      }
    }

    const data = {
      ...rest,
      birthday: birthday ? new Date(birthday) : new Date()
    };
    // Auto-link to the logged-in user when a resident creates their own record
    if (req.user.role !== 'ADMIN') {
      data.user_id = req.user.id;
    }

    const resident = await prisma.resident.create({ data });

    res.status(201).json({ message: 'Resident profile created', resident });
  } catch (error) {
    console.error('Create resident error:', error);
    res.status(500).json({ error: 'Failed to create resident', details: error.message });
  }
});

// PUT /api/residents/:id - Admin or own profile only
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { birthday, ...rest } = req.body;
    const existing = await prisma.resident.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    // Residents may only edit their own profile
    if (req.user.role !== 'ADMIN') {
      if (!existing.user_id || existing.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const updated = await prisma.resident.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...rest,
        birthday: birthday ? new Date(birthday) : undefined
      }
    });

    res.json({ message: 'Resident updated', resident: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update resident', details: error.message });
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
