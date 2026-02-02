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

// Get available faculty for assignment
router.get('/:id/available-faculty', async (req, res) => {
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

    const [faculty] = await db.query(`
      SELECT f.*, 
             u.first_name, u.last_name, u.email,
             d.name as department_name
      FROM faculty f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN departments d ON f.department_id = d.id
      WHERE f.tenant_id = ?
      ORDER BY u.first_name, u.last_name
    `, [req.tenantId]);
    
    res.json({ faculty });
  } catch (error) {
    console.error('Error fetching available faculty:', error);
    res.status(500).json({ message: 'Failed to fetch available faculty' });
  }
});

// Get available students for enrollment
router.get('/:id/available-students', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  try {
    // Check if class exists
    const [existingClass] = await db.query(
      'SELECT id, capacity FROM classes WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingClass.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const [students] = await db.query(`
      SELECT s.*, 
             u.first_name, u.last_name, u.email
      FROM students s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.tenant_id = ? AND (s.class_id IS NULL OR s.class_id = '')
      ORDER BY u.first_name, u.last_name
    `, [req.tenantId]);
    
    // Get current enrollment count
    const [enrollmentCount] = await db.query(
      'SELECT COUNT(*) as count FROM students WHERE class_id = ?',
      [id]
    );
    
    res.json({ 
      students,
      capacity: existingClass[0].capacity,
      currentEnrollment: enrollmentCount[0].count
    });
  } catch (error) {
    console.error('Error fetching available students:', error);
    res.status(500).json({ message: 'Failed to fetch available students' });
  }
});

// Assign faculty to class
router.post('/:id/assign-faculty', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { faculty_id } = req.body;
  
  try {
    // Check if class exists
    const [existingClass] = await db.query(
      'SELECT id FROM classes WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingClass.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if faculty exists (using user_id)
    const [existingFaculty] = await db.query(
      'SELECT id FROM faculty WHERE user_id = ? AND tenant_id = ?',
      [faculty_id, req.tenantId]
    );
    
    if (existingFaculty.length === 0) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Update class with faculty assignment (use user_id since class_teacher_id references users table)
    await db.query(
      'UPDATE classes SET class_teacher_id = ? WHERE id = ? AND tenant_id = ?',
      [faculty_id, id, req.tenantId]
    );
    
    res.json({ message: 'Faculty assigned to class successfully' });
  } catch (error) {
    console.error('Error assigning faculty to class:', error);
    res.status(500).json({ message: 'Failed to assign faculty to class' });
  }
});

// Enroll students in class
router.post('/:id/enroll-students', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { student_ids } = req.body;
  
  try {
    // Check if class exists and get capacity
    const [existingClass] = await db.query(
      'SELECT id, capacity FROM classes WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingClass.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Get current enrollment count
    const [currentEnrollment] = await db.query(
      'SELECT COUNT(*) as count FROM students WHERE class_id = ?',
      [id]
    );

    const availableSlots = existingClass[0].capacity - currentEnrollment[0].count;
    
    if (student_ids.length > availableSlots) {
      return res.status(400).json({ 
        message: `Cannot enroll ${student_ids.length} students. Only ${availableSlots} slots available.` 
      });
    }

    // Enroll students
    for (const studentId of student_ids) {
      await db.query(
        'UPDATE students SET class_id = ? WHERE id = ? AND tenant_id = ?',
        [id, studentId, req.tenantId]
      );
    }
    
    res.json({ message: `${student_ids.length} students enrolled successfully` });
  } catch (error) {
    console.error('Error enrolling students:', error);
    res.status(500).json({ message: 'Failed to enroll students' });
  }
});

// Remove student from class
router.delete('/:id/students/:student_id', async (req, res) => {
  const db = getDatabase();
  const { id, student_id } = req.params;
  
  try {
    // Check if class exists
    const [existingClass] = await db.query(
      'SELECT id FROM classes WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingClass.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Remove student from class
    await db.query(
      'UPDATE students SET class_id = NULL WHERE id = ? AND class_id = ? AND tenant_id = ?',
      [student_id, id, req.tenantId]
    );
    
    res.json({ message: 'Student removed from class successfully' });
  } catch (error) {
    console.error('Error removing student from class:', error);
    res.status(500).json({ message: 'Failed to remove student from class' });
  }
});

// Get class subjects
router.get('/:id/subjects', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  try {
    // Check if class exists
    const [existingClass] = await db.query(
      'SELECT id, course_id FROM classes WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingClass.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const [subjects] = await db.query(`
      SELECT s.* 
      FROM subjects s
      WHERE s.course_id = ? AND s.tenant_id = ?
      ORDER BY s.name
    `, [existingClass[0].course_id, req.tenantId]);
    
    res.json({ subjects });
  } catch (error) {
    console.error('Error fetching class subjects:', error);
    res.status(500).json({ message: 'Failed to fetch class subjects' });
  }
});

export default router;
