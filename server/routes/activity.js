import express from 'express';
import prisma from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/activity/log
router.get('/log', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const activities = await prisma.activityLog.findMany({
      take: parseInt(limit),
      include: {
        user: {
          select: { username: true, fullName: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ activities });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

// POST /api/activity/log (helper to create activity logs)
router.post('/log', authenticate, async (req, res) => {
  try {
    const { action, details } = req.body;

    await prisma.activityLog.create({
      data: {
        user_id: req.user.id,
        action,
        details: details ? JSON.stringify(details) : null,
        ip_address: req.ip || req.connection.remoteAddress
      }
    });

    res.status(201).json({ message: 'Activity logged' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// GET /api/activity/dashboard-stats
router.get('/dashboard', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    // Recent activities (last 10)
    const recent = await prisma.activityLog.findMany({
      take: 10,
      include: {
        user: {
          select: { username: true, fullName: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ recent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
