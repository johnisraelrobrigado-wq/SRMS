import express from 'express';
import prisma from '../prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// GET /api/documents (list requests)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, resident_id } = req.query;

    let where = {};
    if (status) where.status = status;
    if (resident_id) where.resident_id = parseInt(resident_id);

    // Residents can only see their own requests
    if (req.user.role === 'RESIDENT') {
      const resident = await prisma.resident.findFirst({
        where: { user_id: req.user.id }
      });
      if (resident) {
        where.resident_id = resident.id;
      }
    }

const requests = await prisma.documentRequest.findMany({
      where,
      include: {
        resident: {
          select: { full_name: true, address: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /api/documents/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const request = await prisma.documentRequest.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { resident: true }
    });

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    // Check permission: resident can only view their own
    if (req.user.role === 'RESIDENT') {
      const resident = await prisma.resident.findFirst({
        where: { user_id: req.user.id }
      });
      if (!resident || request.resident_id !== resident.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }

    res.json({ request });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// POST /api/documents (create request) - Resident can create, Admin can create for anyone
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { type, purpose } = req.body;
    const filePath = req.file ? `/uploads/documents/${req.file.filename}` : null;

    let residentId;

    if (req.user.role === 'ADMIN') {
      residentId = req.body.resident_id || (await prisma.resident.findFirst({
        where: { user_id: req.user.id }
      }))?.id;
    } else {
      const resident = await prisma.resident.findFirst({
        where: { user_id: req.user.id }
      });
      if (!resident) {
        res.status(400).json({ error: 'No resident profile linked to this account' });
        return;
      }
      residentId = resident.id;
    }

    const request = await prisma.documentRequest.create({
      data: {
        resident_id: residentId,
        type,
        purpose,
        file_path: filePath
      },
      include: { resident: true }
    });

    res.status(201).json({ message: 'Request submitted', request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// PUT /api/documents/:id/status (Admin only - update status)
router.put('/:id/status', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { status, notes, processed_by } = req.body;

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'RELEASED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const request = await prisma.documentRequest.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status,
        notes,
        processed_by: processed_by || req.user.id,
        processed_at: new Date()
      },
      include: { resident: true }
    });

    res.json({ message: 'Request updated', request });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// GET /api/documents/stats
router.get('/stats/all', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const pending = await prisma.documentRequest.count({ where: { status: 'PENDING' } });
    const approved = await prisma.documentRequest.count({ where: { status: 'APPROVED' } });
    const released = await prisma.documentRequest.count({ where: { status: 'RELEASED' } });

    res.json({ pending, approved, released });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
