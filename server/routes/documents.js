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
const uploadMany = multer({ storage });

// ============================================================
// GET /api/documents (list requests)
// ============================================================
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
        },
        attachments: {
          where: { is_deleted: false },
          orderBy: { created_at: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// ============================================================
// GET /api/documents/:id
// ============================================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const request = await prisma.documentRequest.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        resident: true,
        attachments: {
          where: { is_deleted: false },
          orderBy: { created_at: 'asc' }
        }
      }
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
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// ============================================================
// POST /api/documents (create request with multiple files)
// ============================================================
router.post('/', authenticate, uploadMany.array('files', 10), async (req, res) => {
  try {
    const { type, purpose } = req.body;
    const files = req.files || [];

    const required = ['type', 'purpose'];
    for (const field of required) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

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
        return res.status(400).json({ error: 'No resident profile linked to this account' });
      }
      residentId = resident.id;
    }

    const request = await prisma.documentRequest.create({
      data: {
        resident_id: residentId,
        type,
        purpose,
        file_path: files.length > 0 ? `/uploads/documents/${files[0].filename}` : null,
        attachments: {
          create: files.map(f => ({
            file_path: `/uploads/documents/${f.filename}`,
            file_name: f.originalname,
            is_admin: false
          }))
        }
      },
      include: {
        resident: true,
        attachments: true
      }
    });

    res.status(201).json({ message: 'Request submitted', request });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Failed to create request', details: error.message });
  }
});

// ============================================================
// POST /api/documents/:id/upload (admin adds an attachment)
// ============================================================
router.post('/:id/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);

    const existing = await prisma.documentRequest.findUnique({
      where: { id: requestId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const attachment = await prisma.documentRequestAttachment.create({
      data: {
        request_id: requestId,
        file_path: `/uploads/documents/${req.file.filename}`,
        file_name: req.file.originalname,
        is_admin: true
      }
    });

    // Auto-approve on admin upload
    const updated = await prisma.documentRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        response_file: `/uploads/documents/${req.file.filename}`,
        processed_at: new Date()
      },
      include: {
        resident: true,
        attachments: true
      }
    });

    res.status(201).json({ message: 'Admin attachment uploaded', attachment, request: updated });
  } catch (error) {
    console.error('Admin upload error:', error);
    res.status(500).json({ error: 'Failed to upload admin attachment' });
  }
});

// ============================================================
// PUT /api/documents/:id/status (Admin only – update status)
// ============================================================
router.put('/:id/status', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { status, notes } = req.body;

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
        processed_at: new Date()
      },
      include: {
        resident: true,
        attachments: {
          where: { is_deleted: false },
          orderBy: { created_at: 'asc' }
        }
      }
    });

    res.json({ message: 'Request updated', request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// ============================================================
// GET /api/documents/stats/all (Admin only)
// ============================================================
router.get('/stats/all', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const pending = await prisma.documentRequest.count({ where: { status: 'PENDING' } });
    const approved = await prisma.documentRequest.count({ where: { status: 'APPROVED' } });
    const released = await prisma.documentRequest.count({ where: { status: 'RELEASED' } });

    res.json({ pending, approved, released });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================================
// DELETE /api/documents/:id/attachments/:attachId
// (Resident removes their own attachment)
// ============================================================
router.delete('/:id/attachments/:attachId', authenticate, async (req, res) => {
  try {
    const attachment = await prisma.documentRequestAttachment.findUnique({
      where: { id: parseInt(req.params.attachId) },
      include: { request: true }
    });

    if (!attachment || attachment.request_id !== parseInt(req.params.id)) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Only the request owner can remove
    if (req.user.role !== 'ADMIN') {
      const resident = await prisma.resident.findFirst({
        where: { user_id: req.user.id }
      });
      if (!resident || attachment.request.resident_id !== resident.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const fileOnDisk = path.join(
      process.cwd(),
      attachment.file_path.replace(/^\//, '')
    );
    if (fs.existsSync(fileOnDisk)) {
      fs.unlinkSync(fileOnDisk);
    }

    await prisma.documentRequestAttachment.update({
      where: { id: attachment.id },
      data: { is_deleted: true }
    });

    res.json({ message: 'Attachment removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove attachment' });
  }
});

// ============================================================
// DELETE /api/documents/:id/response-file
// (Admin removes the admin response/upload file)
// ============================================================
router.delete('/:id/response-file', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const request = await prisma.documentRequest.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!request || !request.response_file) {
      return res.status(404).json({ error: 'No response file attached' });
    }

    const fileOnDisk = path.join(
      process.cwd(),
      request.response_file.replace(/^\//, '')
    );
    if (fs.existsSync(fileOnDisk)) {
      fs.unlinkSync(fileOnDisk);
    }

    // Also remove admin attachment records
    await prisma.documentRequestAttachment.deleteMany({
      where: { request_id: request.id, is_admin: true }
    });

    await prisma.documentRequest.update({
      where: { id: request.id },
      data: { response_file: null }
    });

    res.json({ message: 'Response file removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove response file' });
  }
});

export default router;
