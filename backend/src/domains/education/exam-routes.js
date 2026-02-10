import express from 'express';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { validateRequest } from '../../core/middleware/guards.js';

const router = express.Router();

// Validation schemas
const createExamSchema = Joi.object({
  subject_id: Joi.string().required(),
  class_id: Joi.string().required(),
  academic_year_id: Joi.string().required(),
  name: Joi.string().required(),
  exam_type: Joi.string().valid('QUIZ', 'MID_TERM', 'FINAL', 'ASSIGNMENT', 'PRACTICAL').required(),
  total_marks: Joi.number().integer().min(1).required(),
  exam_date: Joi.date().required(),
  exam_time: Joi.string().required(),
  duration_minutes: Joi.number().integer().min(1).required(),
  instructions: Joi.string().allow('').optional(),
});

const updateExamSchema = Joi.object({
  subject_id: Joi.string().optional(),
  class_id: Joi.string().optional(),
  academic_year_id: Joi.string().optional(),
  name: Joi.string().optional(),
  exam_type: Joi.string().valid('QUIZ', 'MID_TERM', 'FINAL', 'ASSIGNMENT', 'PRACTICAL').optional(),
  total_marks: Joi.number().integer().min(1).optional(),
  exam_date: Joi.date().optional(),
  exam_time: Joi.string().optional(),
  duration_minutes: Joi.number().integer().min(1).optional(),
  instructions: Joi.string().allow('').optional(),
  is_published: Joi.boolean().optional(),
});

const addResultSchema = Joi.object({
  student_id: Joi.string().required(),
  marks_obtained: Joi.number().min(0).required(),
  grade: Joi.string().optional(),
  remarks: Joi.string().optional(),
});

// Get all exams with related data
router.get('/', async (req, res) => {
  const db = getDatabase();
  try {
    const tenantId = req.tenantId;
    const { class_id, subject_id, exam_type, status } = req.query;
    
    let query = `
      SELECT e.*, 
             s.name as subject_name, s.code as subject_code,
             c.name as class_name,
             ay.year_name as academic_year_name,
             COUNT(er.id) as results_count,
             AVG(er.marks_obtained) as average_marks
      FROM exams e
      LEFT JOIN subjects s ON e.subject_id = s.id
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
      LEFT JOIN exam_results er ON e.id = er.exam_id
      WHERE e.tenant_id = ?
    `;
    const params = [tenantId];

    if (class_id) {
      query += ' AND e.class_id = ?';
      params.push(class_id);
    }
    if (subject_id) {
      query += ' AND e.subject_id = ?';
      params.push(subject_id);
    }
    if (exam_type) {
      query += ' AND e.exam_type = ?';
      params.push(exam_type);
    }
    if (status === 'published') {
      query += ' AND e.is_published = 1';
    } else if (status === 'draft') {
      query += ' AND e.is_published = 0';
    }

    query += ' GROUP BY e.id ORDER BY e.exam_date DESC, e.exam_time ASC';

    const [exams] = await db.query(query, params);
    res.json({ exams });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// Get exam by ID with related data
router.get('/:id', async (req, res) => {
  const db = getDatabase();
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    const [exams] = await db.query(`
      SELECT e.*, 
             s.name as subject_name, s.code as subject_code,
             c.name as class_name,
             ay.year_name as academic_year_name
      FROM exams e
      LEFT JOIN subjects s ON e.subject_id = s.id
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
      WHERE e.id = ? AND e.tenant_id = ?
    `, [id, tenantId]);

    if (exams.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json(exams[0]);
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

// Create new exam
router.post('/', validateRequest(createExamSchema), async (req, res) => {
  const db = getDatabase();
  const { subject_id, class_id, academic_year_id, name, exam_type, total_marks, exam_date, exam_time, duration_minutes, instructions } = req.validatedBody;
  
  console.log('Creating exam with data:', {
    subject_id, class_id, academic_year_id, name, exam_type, total_marks, exam_date, exam_time, duration_minutes, instructions
  });
  
  try {
    const examId = uuidv4();
    await db.query(
      `INSERT INTO exams (id, tenant_id, subject_id, class_id, academic_year_id, name, exam_type, total_marks, exam_date, exam_time, duration_minutes, instructions, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [examId, req.tenantId, subject_id, class_id, academic_year_id, name, exam_type, total_marks, exam_date, exam_time, duration_minutes, instructions || null]
    );
    
    res.status(201).json({ 
      message: 'Exam created successfully', 
      exam_id: examId 
    });
  } catch (error) {
    console.error('Error creating exam:', error);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    res.status(500).json({ error: 'Failed to create exam', details: error.message });
  }
});

// Update exam
router.put('/:id', validateRequest(updateExamSchema), async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const updateData = req.validatedBody;
  
  try {
    // Check if exam exists
    const [existingExam] = await db.query(
      'SELECT id FROM exams WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingExam.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id, req.tenantId);
    
    await db.query(
      `UPDATE exams SET ${updateFields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      updateValues
    );
    
    res.json({ message: 'Exam updated successfully' });
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({ error: 'Failed to update exam' });
  }
});

// Delete exam
router.delete('/:id', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  try {
    // Check if exam exists
    const [existingExam] = await db.query(
      'SELECT id FROM exams WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingExam.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Check if exam has results
    const [resultsCount] = await db.query(
      'SELECT COUNT(*) as count FROM exam_results WHERE exam_id = ?',
      [id]
    );
    
    if (resultsCount[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete exam with existing results' 
      });
    }

    await db.query(
      'DELETE FROM exams WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

// Get students for exam results
router.get('/:id/students', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  try {
    // Check if exam exists
    const [existingExam] = await db.query(
      'SELECT e.*, c.name as class_name FROM exams e LEFT JOIN classes c ON e.class_id = c.id WHERE e.id = ? AND e.tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingExam.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const exam = existingExam[0];

    // Get students in the class
    const [students] = await db.query(`
      SELECT s.*, 
             u.first_name, u.last_name, u.email,
             CONCAT(s.first_name, ' ', s.last_name) as full_name,
             er.marks_obtained, er.grade, er.remarks
      FROM students s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN exam_results er ON s.id = er.student_id AND er.exam_id = ?
      WHERE s.class_id = ? AND s.tenant_id = ? AND s.status = 'ACTIVE'
      ORDER BY s.roll_number, s.first_name
    `, [id, exam.class_id, req.tenantId]);
    
    res.json({ exam, students });
  } catch (error) {
    console.error('Error fetching exam students:', error);
    res.status(500).json({ error: 'Failed to fetch exam students' });
  }
});

// Add exam results for multiple students
router.post('/:id/results', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { results } = req.body; // Array of { student_id, marks_obtained, grade, remarks }

  try {
    // Check if exam exists
    const [existingExam] = await db.query(
      'SELECT id, total_marks FROM exams WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingExam.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const exam = existingExam[0];

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'Results array is required' });
    }

    // Begin transaction
    await db.query('START TRANSACTION');

    try {
      // Delete existing results for this exam
      await db.query(
        'DELETE FROM exam_results WHERE exam_id = ?',
        [id]
      );

      // Insert new results
      for (const result of results) {
        // Validate marks
        if (result.marks_obtained < 0 || result.marks_obtained > exam.total_marks) {
          throw new Error(`Invalid marks for student ${result.student_id}: must be between 0 and ${exam.total_marks}`);
        }

        const resultId = uuidv4();
        await db.query(
          `INSERT INTO exam_results (id, tenant_id, exam_id, student_id, marks_obtained, grade, remarks)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [resultId, req.tenantId, id, result.student_id, result.marks_obtained, result.grade || null, result.remarks || null]
        );
      }

      await db.query('COMMIT');
      
      res.status(201).json({ 
        message: 'Exam results added successfully',
        results_added: results.length
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error adding exam results:', error);
    res.status(500).json({ error: error.message || 'Failed to add exam results' });
  }
});

// Get exam results with statistics
router.get('/:id/results', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  try {
    // Check if exam exists
    const [existingExam] = await db.query(
      'SELECT e.*, s.name as subject_name, c.name as class_name FROM exams e LEFT JOIN subjects s ON e.subject_id = s.id LEFT JOIN classes c ON e.class_id = c.id WHERE e.id = ? AND e.tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingExam.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const exam = existingExam[0];

    // Get results with student details
    const [results] = await db.query(`
      SELECT er.*, 
             s.roll_number,
             CONCAT(s.first_name, ' ', s.last_name) as student_name,
             u.email
      FROM exam_results er
      LEFT JOIN students s ON er.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE er.exam_id = ?
      ORDER BY s.roll_number, s.first_name
    `, [id]);

    // Calculate statistics
    const totalStudents = results.length;
    const passedStudents = results.filter(r => r.marks_obtained >= (exam.total_marks * 0.4)).length; // 40% passing
    const averageMarks = totalStudents > 0 ? results.reduce((sum, r) => sum + r.marks_obtained, 0) / totalStudents : 0;
    const highestMarks = totalStudents > 0 ? Math.max(...results.map(r => r.marks_obtained)) : 0;
    const lowestMarks = totalStudents > 0 ? Math.min(...results.map(r => r.marks_obtained)) : 0;

    res.json({
      exam,
      results,
      statistics: {
        total_students: totalStudents,
        passed_students: passedStudents,
        failed_students: totalStudents - passedStudents,
        pass_percentage: totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0,
        average_marks: Math.round(averageMarks * 100) / 100,
        highest_marks: highestMarks,
        lowest_marks: lowestMarks
      }
    });
  } catch (error) {
    console.error('Error fetching exam results:', error);
    res.status(500).json({ error: 'Failed to fetch exam results' });
  }
});

// Publish exam results
router.put('/:id/publish', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  try {
    // Check if exam exists and has results
    const [examCheck] = await db.query(
      'SELECT id FROM exams e LEFT JOIN exam_results er ON e.id = er.exam_id WHERE e.id = ? AND e.tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (examCheck.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (examCheck.length === 1 && !examCheck[0].exam_id) {
      return res.status(400).json({ error: 'Cannot publish exam without results' });
    }

    await db.query(
      'UPDATE exams SET is_published = 1 WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    res.json({ message: 'Exam results published successfully' });
  } catch (error) {
    console.error('Error publishing exam results:', error);
    res.status(500).json({ error: 'Failed to publish exam results' });
  }
});

export default router;
