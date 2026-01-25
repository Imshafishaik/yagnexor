import { Router } from 'express';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Create exam
router.post('/', async (req, res) => {
  const db = getDatabase();
  const { subject_id, class_id, academic_year_id, name, exam_type, total_marks, exam_date, exam_time, duration_minutes } = req.body;

  try {
    const examId = uuidv4();
    await db.query(
      `INSERT INTO exams (id, tenant_id, subject_id, class_id, academic_year_id, name, exam_type, total_marks, exam_date, exam_time, duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [examId, req.tenantId, subject_id, class_id, academic_year_id, name, exam_type, total_marks, exam_date, exam_time, duration_minutes]
    );
    res.status(201).json({ message: 'Exam created', exam_id: examId });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

// List exams
router.get('/', async (req, res) => {
  const db = getDatabase();
  try {
    const [rows] = await db.query('SELECT * FROM exams WHERE tenant_id = ?', [req.tenantId]);
    res.json({ exams: rows });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// Add exam result
router.post('/:exam_id/results', async (req, res) => {
  const db = getDatabase();
  const { student_id, marks_obtained, grade, remarks } = req.body;

  try {
    const resultId = uuidv4();
    await db.query(
      `INSERT INTO exam_results (id, tenant_id, exam_id, student_id, marks_obtained, grade, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [resultId, req.tenantId, req.params.exam_id, student_id, marks_obtained, grade, remarks]
    );
    res.status(201).json({ message: 'Result added', result_id: resultId });
  } catch (error) {
    console.error('Error adding result:', error);
    res.status(500).json({ error: 'Failed to add result' });
  }
});

// Publish exam results
router.put('/:exam_id/publish', async (req, res) => {
  const db = getDatabase();
  try {
    await db.query('UPDATE exams SET is_published = 1 WHERE id = ? AND tenant_id = ?', [req.params.exam_id, req.tenantId]);
    res.json({ message: 'Exam results published' });
  } catch (error) {
    console.error('Error publishing results:', error);
    res.status(500).json({ error: 'Failed to publish results' });
  }
});

// Get exam results
router.get('/:exam_id/results', async (req, res) => {
  const db = getDatabase();
  try {
    const [rows] = await db.query(
      'SELECT * FROM exam_results WHERE exam_id = ? AND tenant_id = ?',
      [req.params.exam_id, req.tenantId]
    );
    res.json({ results: rows });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

export default router;
