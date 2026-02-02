import express from 'express';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { validateRequest } from '../../core/middleware/guards.js';

const router = express.Router();

// Validation schemas
const createSubjectSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  course_id: Joi.string().required(),
  credits: Joi.number().integer().min(1).max(10).optional(),
});

const updateSubjectSchema = Joi.object({
  name: Joi.string().optional(),
  code: Joi.string().optional(),
  course_id: Joi.string().optional(),
  credits: Joi.number().integer().min(1).max(10).optional(),
});

// Get all subjects with related data
router.get('/', async (req, res) => {
  const db = getDatabase();
  try {
    const tenantId = req.tenantId;
    const [subjects] = await db.query(`
      SELECT s.*, 
             c.name as course_name,
             c.code as course_code,
             d.name as department_name
      FROM subjects s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE s.tenant_id = ?
      ORDER BY c.name, s.name
    `, [tenantId]);
    res.json({ subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get subject by ID with related data
router.get('/:id', async (req, res) => {
  const db = getDatabase();
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const [subjects] = await db.query(`
      SELECT s.*, 
             c.name as course_name,
             c.code as course_code,
             d.name as department_name
      FROM subjects s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE s.id = ? AND s.tenant_id = ?
    `, [id, tenantId]);

    if (subjects.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.json(subjects[0]);
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
});

// Get subjects by course ID
router.get('/course/:course_id', async (req, res) => {
  const db = getDatabase();
  try {
    const { course_id } = req.params;
    const tenantId = req.tenantId;
    
    // Verify course exists
    const [courseCheck] = await db.query(
      'SELECT id FROM courses WHERE id = ? AND tenant_id = ?',
      [course_id, tenantId]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const [subjects] = await db.query(`
      SELECT s.*, 
             COUNT(f.id) as faculty_count
      FROM subjects s
      LEFT JOIN faculty_subjects f ON s.id = f.subject_id
      WHERE s.course_id = ? AND s.tenant_id = ?
      GROUP BY s.id
      ORDER BY s.name
    `, [course_id, tenantId]);
    
    res.json({ subjects });
  } catch (error) {
    console.error('Error fetching course subjects:', error);
    res.status(500).json({ error: 'Failed to fetch course subjects' });
  }
});

// Create new subject
router.post('/', validateRequest(createSubjectSchema), async (req, res) => {
  const db = getDatabase();
  const { name, code, course_id, credits } = req.validatedBody;
  
  try {
    // Check if course exists
    const [courseCheck] = await db.query(
      'SELECT id FROM courses WHERE id = ? AND tenant_id = ?',
      [course_id, req.tenantId]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const subjectId = uuidv4();
    await db.query(
      `INSERT INTO subjects (id, tenant_id, name, code, course_id, credits)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [subjectId, req.tenantId, name, code, course_id, credits || null]
    );
    
    res.status(201).json({ 
      message: 'Subject created successfully', 
      subject_id: subjectId 
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Subject code already exists' });
    }
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// Update subject
router.put('/:id', validateRequest(updateSubjectSchema), async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { name, code, course_id, credits } = req.validatedBody;
  
  try {
    // Check if subject exists
    const [existingSubject] = await db.query(
      'SELECT id FROM subjects WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingSubject.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // If course_id is being updated, check if new course exists
    if (course_id) {
      const [courseCheck] = await db.query(
        'SELECT id FROM courses WHERE id = ? AND tenant_id = ?',
        [course_id, req.tenantId]
      );
      
      if (courseCheck.length === 0) {
        return res.status(404).json({ error: 'Course not found' });
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (code !== undefined) {
      updateFields.push('code = ?');
      updateValues.push(code);
    }
    if (course_id !== undefined) {
      updateFields.push('course_id = ?');
      updateValues.push(course_id);
    }
    if (credits !== undefined) {
      updateFields.push('credits = ?');
      updateValues.push(credits);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id, req.tenantId);
    
    await db.query(
      `UPDATE subjects SET ${updateFields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      updateValues
    );
    
    res.json({ message: 'Subject updated successfully' });
  } catch (error) {
    console.error('Error updating subject:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Subject code already exists' });
    }
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

// Delete subject
router.delete('/:id', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  try {
    // Check if subject exists
    const [existingSubject] = await db.query(
      'SELECT id FROM subjects WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingSubject.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Check if subject has faculty assignments
    const [facultyAssignments] = await db.query(
      'SELECT COUNT(*) as count FROM faculty_subjects WHERE subject_id = ?',
      [id]
    );
    
    if (facultyAssignments[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete subject with assigned faculty' 
      });
    }

    await db.query(
      'DELETE FROM subjects WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// Get available subjects for course (not already assigned)
router.get('/available/:course_id', async (req, res) => {
  const db = getDatabase();
  const { course_id } = req.params;
  
  try {
    // Verify course exists
    const [courseCheck] = await db.query(
      'SELECT id FROM courses WHERE id = ? AND tenant_id = ?',
      [course_id, req.tenantId]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const [subjects] = await db.query(`
      SELECT s.*
      FROM subjects s
      WHERE s.tenant_id = ? AND s.course_id != ? AND s.id NOT IN (
        SELECT subject_id FROM subjects WHERE course_id = ? AND tenant_id = ?
      )
      ORDER BY s.name
    `, [req.tenantId, course_id, course_id, req.tenantId]);
    
    res.json({ subjects });
  } catch (error) {
    console.error('Error fetching available subjects:', error);
    res.status(500).json({ error: 'Failed to fetch available subjects' });
  }
});

// Add existing subject to course
router.post('/add-to-course', async (req, res) => {
  const db = getDatabase();
  const { subject_id, course_id } = req.body;
  
  try {
    // Check if subject exists
    const [subjectCheck] = await db.query(
      'SELECT id FROM subjects WHERE id = ? AND tenant_id = ?',
      [subject_id, req.tenantId]
    );
    
    if (subjectCheck.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Check if course exists
    const [courseCheck] = await db.query(
      'SELECT id FROM courses WHERE id = ? AND tenant_id = ?',
      [course_id, req.tenantId]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Update subject's course assignment
    await db.query(
      'UPDATE subjects SET course_id = ? WHERE id = ? AND tenant_id = ?',
      [course_id, subject_id, req.tenantId]
    );
    
    res.json({ message: 'Subject added to course successfully' });
  } catch (error) {
    console.error('Error adding subject to course:', error);
    res.status(500).json({ error: 'Failed to add subject to course' });
  }
});

export default router;
