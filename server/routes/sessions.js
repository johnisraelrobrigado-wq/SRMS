import express from 'express';
import prisma from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/sessions
router.get('/', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let where = {};
    if (start_date && end_date) {
      where = {
        date: {
          gte: new Date(start_date),
          lte: new Date(end_date)
        }
      };
    }

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/sessions/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// POST /api/sessions (Admin only)
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { title, description, date, time, location, attendees } = req.body;

    const session = await prisma.session.create({
      data: {
        title,
        description,
        date: new Date(date),
        time,
        location,
        attendees: attendees ? JSON.stringify(attendees) : null
      }
    });

    res.status(201).json({ message: 'Session created', session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// PUT /api/sessions/:id (Admin only)
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const session = await prisma.session.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined
      }
    });

    res.json({ message: 'Session updated', session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// DELETE /api/sessions/:id (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.session.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;
