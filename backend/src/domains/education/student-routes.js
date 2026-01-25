import { Router } from 'express';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List students
router.get('/', async (req, res) => {
  const db = getDatabase();
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.first_name, u.last_name, CONCAT(u.first_name, ' ', u.last_name) as full_name
      FROM students s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.tenant_id = ?
    `, [req.tenantId]);
    res.json({ students: rows });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Create student
router.post('/', async (req, res) => {
  const db = getDatabase();
  const { user_id, class_id, academic_year_id, roll_number, enrollment_number, date_of_birth, gender, phone, address } = req.body;

  try {
    const studentId = uuidv4();
    await db.query(
      `INSERT INTO students (id, tenant_id, user_id, class_id, academic_year_id, roll_number, enrollment_number, date_of_birth, gender, phone, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [studentId, req.tenantId, user_id, class_id, academic_year_id, roll_number, enrollment_number, date_of_birth, gender, phone, address]
    );
    res.status(201).json({ message: 'Student created', student_id: studentId });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Get student by ID
router.get('/:student_id', async (req, res) => {
  const db = getDatabase();
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.first_name, u.last_name, CONCAT(u.first_name, ' ', u.last_name) as full_name
      FROM students s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.tenant_id = ?
    `, [req.params.student_id, req.tenantId]);
    if (!rows[0]) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Update student
router.put('/:student_id', async (req, res) => {
  const db = getDatabase();
  const { phone, address, status } = req.body;
  try {
    await db.query('UPDATE students SET phone = ?, address = ?, status = ? WHERE id = ? AND tenant_id = ?', [
      phone,
      address,
      status,
      req.params.student_id,
      req.tenantId,
    ]);
    res.json({ message: 'Student updated' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

export default router;
