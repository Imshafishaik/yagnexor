import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { validateRequest } from '../../core/middleware/guards.js';
import { getDatabase } from '../../config/database.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'subject-content');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDFs, Word documents, PowerPoint files, images, and text files are allowed.'));
    }
  }
});

// Validation schemas
const createContentSchema = Joi.object({
  subject_id: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().optional(),
  is_public: Joi.boolean().optional().default(true)
});

const updateContentSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  is_public: Joi.boolean().optional()
});

// Get all content for a subject (for teachers/managers)
router.get('/subject/:subject_id', async (req, res) => {
  const db = getDatabase();
  try {
    const { subject_id } = req.params;
    const tenantId = req.tenantId;
    
    const [contents] = await db.query(`
      SELECT sc.*, 
             CONCAT(u.first_name, ' ', u.last_name) as uploader_name,
             u.email as uploader_email,
             u.role as uploader_role
      FROM subject_contents sc
      LEFT JOIN users u ON sc.uploaded_by = u.id
      WHERE sc.subject_id = ? AND sc.tenant_id = ?
      ORDER BY sc.created_at DESC
    `, [subject_id, tenantId]);
    
    res.json({ contents });
  } catch (error) {
    console.error('Error fetching subject contents:', error);
    res.status(500).json({ error: 'Failed to fetch subject contents' });
  }
});

// Get content accessible to a specific student
router.get('/student/:student_id', async (req, res) => {
  const db = getDatabase();
  try {
    const { student_id } = req.params;
    const tenantId = req.tenantId;
    
    // Get content from subjects the student is enrolled in
    const [contents] = await db.query(`
      SELECT DISTINCT sc.*, 
             s.name as subject_name,
             s.code as subject_code,
             CONCAT(u.first_name, ' ', u.last_name) as uploader_name
      FROM subject_contents sc
      JOIN subjects s ON sc.subject_id = s.id
      JOIN course_enrollments ce ON s.course_id = ce.course_id
      LEFT JOIN users u ON sc.uploaded_by = u.id
      WHERE ce.student_id = ? 
        AND ce.tenant_id = ? 
        AND sc.tenant_id = ?
        AND sc.is_public = TRUE
      ORDER BY sc.created_at DESC
    `, [student_id, tenantId, tenantId]);
    
    res.json({ contents });
  } catch (error) {
    console.error('Error fetching student contents:', error);
    res.status(500).json({ error: 'Failed to fetch student contents' });
  }
});

// Upload new content
router.post('/', upload.single('file'), validateRequest(createContentSchema), async (req, res) => {
  const db = getDatabase();
  try {
    const { subject_id, title, description, is_public } = req.validatedBody;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Check if subject exists and belongs to tenant
    const [subjectCheck] = await db.query(
      'SELECT id FROM subjects WHERE id = ? AND tenant_id = ?',
      [subject_id, req.tenantId]
    );
    
    if (subjectCheck.length === 0) {
      // Clean up uploaded file
      await fs.unlink(file.path).catch(() => {});
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    const contentId = uuidv4();
    
    await db.query(`
      INSERT INTO subject_contents 
      (id, tenant_id, subject_id, title, description, file_name, file_path, file_type, file_size, uploaded_by, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      contentId,
      req.tenantId,
      subject_id,
      title,
      description || null,
      file.originalname,
      file.path,
      file.mimetype,
      file.size,
      req.user.id,
      is_public !== undefined ? is_public : true
    ]);
    
    res.status(201).json({
      message: 'Content uploaded successfully',
      content_id: contentId,
      file_info: {
        original_name: file.originalname,
        size: file.size,
        type: file.mimetype
      }
    });
    
  } catch (error) {
    console.error('Error uploading content:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({ error: 'Failed to upload content' });
  }
});

// Update content metadata
router.put('/:id', validateRequest(updateContentSchema), async (req, res) => {
  const db = getDatabase();
  try {
    const { id } = req.params;
    const { title, description, is_public } = req.validatedBody;
    
    // Check if content exists and belongs to tenant
    const [contentCheck] = await db.query(
      'SELECT id FROM subject_contents WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (contentCheck.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const updateFields = [];
    const updateValues = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (is_public !== undefined) {
      updateFields.push('is_public = ?');
      updateValues.push(is_public);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateValues.push(id, req.tenantId);
    
    await db.query(
      `UPDATE subject_contents SET ${updateFields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      updateValues
    );
    
    res.json({ message: 'Content updated successfully' });
    
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Delete content
router.delete('/:id', async (req, res) => {
  const db = getDatabase();
  try {
    const { id } = req.params;
    
    // Get content info before deletion
    const [contentInfo] = await db.query(
      'SELECT file_path FROM subject_contents WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (contentInfo.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Delete from database
    await db.query(
      'DELETE FROM subject_contents WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    // Delete file from filesystem
    if (contentInfo[0].file_path) {
      await fs.unlink(contentInfo[0].file_path).catch(() => {});
    }
    
    res.json({ message: 'Content deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

// Download content file
router.get('/:id/download', async (req, res) => {
  const db = getDatabase();
  try {
    const { id } = req.params;
    
    const [contentInfo] = await db.query(`
      SELECT sc.*, s.name as subject_name
      FROM subject_contents sc
      JOIN subjects s ON sc.subject_id = s.id
      WHERE sc.id = ? AND sc.tenant_id = ?
    `, [id, req.tenantId]);
    
    if (contentInfo.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const content = contentInfo[0];
    
    // Check if file exists
    try {
      await fs.access(content.file_path);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${content.file_name}"`);
    res.setHeader('Content-Type', content.file_type);
    
    // Send file
    res.sendFile(path.resolve(content.file_path));
    
  } catch (error) {
    console.error('Error downloading content:', error);
    res.status(500).json({ error: 'Failed to download content' });
  }
});

export default router;
