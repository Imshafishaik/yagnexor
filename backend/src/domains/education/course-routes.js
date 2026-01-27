import express from 'express';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { validateRequest } from '../../core/middleware/guards.js';

const router = express.Router();

// Validation schemas
const createCourseSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  description: Joi.string().optional(),
  department_id: Joi.string().optional(),
  duration_years: Joi.number().integer().min(1).max(10).optional(),
  credits: Joi.number().integer().min(1).optional(),
});

const updateCourseSchema = Joi.object({
  name: Joi.string().optional(),
  code: Joi.string().optional(),
  description: Joi.string().optional(),
  department_id: Joi.string().optional(),
  duration_years: Joi.number().integer().min(1).max(10).optional(),
  credits: Joi.number().integer().min(1).optional(),
});

// Get all courses with related data
router.get('/', async (req, res) => {
  const db = getDatabase();
  try {
    const tenantId = req.tenantId;
    const [courses] = await db.query(`
      SELECT c.*, 
             d.name as department_name,
             COUNT(cl.id) as class_count,
             COUNT(s.id) as subject_count
      FROM courses c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN classes cl ON c.id = cl.course_id AND cl.tenant_id = c.tenant_id
      LEFT JOIN subjects s ON c.id = s.course_id AND s.tenant_id = c.tenant_id
      WHERE c.tenant_id = ?
      GROUP BY c.id
      ORDER BY c.name
    `, [tenantId]);
    res.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get course by ID with related data
router.get('/:id', async (req, res) => {
  const db = getDatabase();
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const [courses] = await db.query(`
      SELECT c.*, 
             d.name as department_name
      FROM courses c
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE c.id = ? AND c.tenant_id = ?
    `, [id, tenantId]);

    if (courses.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(courses[0]);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create new course
router.post('/', validateRequest(createCourseSchema), async (req, res) => {
  const db = getDatabase();
  const { name, code, description, department_id, duration_years, credits } = req.validatedBody;
  
  try {
    const courseId = uuidv4();
    await db.query(
      `INSERT INTO courses (id, tenant_id, name, code, description, department_id, duration_years, credits)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [courseId, req.tenantId, name, code, description || null, department_id || null, duration_years || null, credits || null]
    );
    
    res.status(201).json({ 
      message: 'Course created successfully', 
      course_id: courseId 
    });
  } catch (error) {
    console.error('Error creating course:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course
router.put('/:id', validateRequest(updateCourseSchema), async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { name, code, description, department_id, duration_years, credits } = req.validatedBody;
  
  try {
    // Check if course exists
    const [existingCourse] = await db.query(
      'SELECT id FROM courses WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingCourse.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
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
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (department_id !== undefined) {
      updateFields.push('department_id = ?');
      updateValues.push(department_id);
    }
    if (duration_years !== undefined) {
      updateFields.push('duration_years = ?');
      updateValues.push(duration_years);
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
      `UPDATE courses SET ${updateFields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      updateValues
    );
    
    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course
router.delete('/:id', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  try {
    // Check if course exists
    const [existingCourse] = await db.query(
      'SELECT id FROM courses WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingCourse.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if course has classes
    const [classesCount] = await db.query(
      'SELECT COUNT(*) as count FROM classes WHERE course_id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (classesCount[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete course with associated classes' 
      });
    }

    await db.query(
      'DELETE FROM courses WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Get subjects for a course
router.get('/:id/subjects', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  try {
    // Check if course exists
    const [existingCourse] = await db.query(
      'SELECT id FROM courses WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingCourse.length === 0) {
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
    `, [id, req.tenantId]);
    
    res.json({ subjects });
  } catch (error) {
    console.error('Error fetching course subjects:', error);
    res.status(500).json({ error: 'Failed to fetch course subjects' });
  }
});

// Create subject for course
router.post('/:id/subjects', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { name, code, description, credits, is_elective } = req.body;
  
  try {
    // Check if course exists
    const [existingCourse] = await db.query(
      'SELECT id FROM courses WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingCourse.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const subjectId = uuidv4();
    await db.query(
      `INSERT INTO subjects (id, tenant_id, name, code, description, course_id, credits, is_elective)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [subjectId, req.tenantId, name, code, description || null, id, credits || null, is_elective || false]
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

// Remove subject from course
router.delete('/:id/subjects/:subject_id', async (req, res) => {
  const db = getDatabase();
  const { id, subject_id } = req.params;
  
  try {
    // Check if course exists
    const [existingCourse] = await db.query(
      'SELECT id FROM courses WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingCourse.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if subject exists and belongs to this course
    const [existingSubject] = await db.query(
      'SELECT id FROM subjects WHERE id = ? AND course_id = ? AND tenant_id = ?',
      [subject_id, id, req.tenantId]
    );
    
    if (existingSubject.length === 0) {
      return res.status(404).json({ error: 'Subject not found in this course' });
    }

    // Check if subject has faculty assignments
    const [facultyAssignments] = await db.query(
      'SELECT COUNT(*) as count FROM faculty_subjects WHERE subject_id = ?',
      [subject_id]
    );
    
    if (facultyAssignments[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot remove subject with assigned faculty' 
      });
    }

    await db.query(
      'DELETE FROM subjects WHERE id = ? AND course_id = ? AND tenant_id = ?',
      [subject_id, id, req.tenantId]
    );
    
    res.json({ message: 'Subject removed from course successfully' });
  } catch (error) {
    console.error('Error removing subject from course:', error);
    res.status(500).json({ error: 'Failed to remove subject from course' });
  }
});

export default router;
