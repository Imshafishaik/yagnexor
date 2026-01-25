import express from 'express';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { validateRequest } from '../../core/middleware/guards.js';

const router = express.Router();

// Validation schemas
const createClassSchema = Joi.object({
  name: Joi.string().required(),
  course_id: Joi.string().optional(),
  academic_year_id: Joi.string().optional(),
  class_teacher_id: Joi.string().optional(),
  capacity: Joi.number().integer().min(1).optional(),
});

const updateClassSchema = Joi.object({
  name: Joi.string().optional(),
  course_id: Joi.string().optional(),
  academic_year_id: Joi.string().optional(),
  class_teacher_id: Joi.string().optional(),
  capacity: Joi.number().integer().min(1).optional(),
});

// Get all classes with related data
router.get('/', async (req, res) => {
  const db = getDatabase();
  try {
    const tenantId = req.tenantId;
    const [classes] = await db.query(`
      SELECT c.*, 
             co.name as course_name,
             ay.year_name as academic_year_name,
             CONCAT(u.first_name, ' ', u.last_name) as class_teacher_name
      FROM classes c
      LEFT JOIN courses co ON c.course_id = co.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      LEFT JOIN users u ON c.class_teacher_id = u.id
      WHERE c.tenant_id = ?
      ORDER BY c.name
    `, [tenantId]);
    res.json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
});

// Get class by ID with related data
router.get('/:id', async (req, res) => {
  const db = getDatabase();
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const [classes] = await db.query(`
      SELECT c.*, 
             co.name as course_name,
             ay.year_name as academic_year_name,
             CONCAT(u.first_name, ' ', u.last_name) as class_teacher_name
      FROM classes c
      LEFT JOIN courses co ON c.course_id = co.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      LEFT JOIN users u ON c.class_teacher_id = u.id
      WHERE c.id = ? AND c.tenant_id = ?
    `, [id, tenantId]);

    if (classes.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(classes[0]);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ message: 'Failed to fetch class' });
  }
});

// Create new class
router.post('/', validateRequest(createClassSchema), async (req, res) => {
  const db = getDatabase();
  const { name, course_id, academic_year_id, class_teacher_id, capacity } = req.validatedBody;
  
  try {
    const classId = uuidv4();
    await db.query(
      `INSERT INTO classes (id, tenant_id, name, course_id, academic_year_id, class_teacher_id, capacity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [classId, req.tenantId, name, course_id || null, academic_year_id || null, class_teacher_id || null, capacity || null]
    );
    
    res.status(201).json({ 
      message: 'Class created successfully', 
      class_id: classId 
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ message: 'Failed to create class' });
  }
});

// Update class
router.put('/:id', validateRequest(updateClassSchema), async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { name, course_id, academic_year_id, class_teacher_id, capacity } = req.validatedBody;
  
  try {
    // Check if class exists
    const [existingClass] = await db.query(
      'SELECT id FROM classes WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingClass.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (course_id !== undefined) {
      updateFields.push('course_id = ?');
      updateValues.push(course_id);
    }
    if (academic_year_id !== undefined) {
      updateFields.push('academic_year_id = ?');
      updateValues.push(academic_year_id);
    }
    if (class_teacher_id !== undefined) {
      updateFields.push('class_teacher_id = ?');
      updateValues.push(class_teacher_id);
    }
    if (capacity !== undefined) {
      updateFields.push('capacity = ?');
      updateValues.push(capacity);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(id, req.tenantId);
    
    await db.query(
      `UPDATE classes SET ${updateFields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      updateValues
    );
    
    res.json({ message: 'Class updated successfully' });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ message: 'Failed to update class' });
  }
});

// Delete class
router.delete('/:id', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  try {
    // Check if class exists
    const [existingClass] = await db.query(
      'SELECT id FROM classes WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingClass.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if class has students
    const [studentsCount] = await db.query(
      'SELECT COUNT(*) as count FROM students WHERE class_id = ?',
      [id]
    );
    
    if (studentsCount[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete class with enrolled students' 
      });
    }

    await db.query(
      'DELETE FROM classes WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ message: 'Failed to delete class' });
  }
});

// Get students in a class
router.get('/:id/students', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  try {
    // Check if class exists
    const [existingClass] = await db.query(
      'SELECT id FROM classes WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingClass.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const [students] = await db.query(`
      SELECT s.*, 
             u.first_name, u.last_name, 
             CONCAT(u.first_name, ' ', u.last_name) as full_name
      FROM students s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.class_id = ? AND s.tenant_id = ?
      ORDER BY s.roll_number
    `, [id, req.tenantId]);
    
    res.json({ students });
  } catch (error) {
    console.error('Error fetching class students:', error);
    res.status(500).json({ message: 'Failed to fetch class students' });
  }
});

export default router;
