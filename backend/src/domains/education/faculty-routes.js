import { Router } from 'express';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List faculty
router.get('/', async (req, res) => {
  const db = getDatabase();
  try {
    const [rows] = await db.query('SELECT * FROM faculty WHERE tenant_id = ?', [req.tenantId]);
    res.json({ faculty: rows });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

// Create faculty
router.post('/', async (req, res) => {
  const db = getDatabase();
  const { user_id, department_id, qualification, specialization, phone, office_number } = req.body;

  try {
    const facultyId = uuidv4();
    await db.query(
      `INSERT INTO faculty (id, tenant_id, user_id, department_id, qualification, specialization, phone, office_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [facultyId, req.tenantId, user_id, department_id, qualification, specialization, phone, office_number]
    );
    res.status(201).json({ message: 'Faculty created', faculty_id: facultyId });
  } catch (error) {
    console.error('Error creating faculty:', error);
    res.status(500).json({ error: 'Failed to create faculty' });
  }
});

// Get faculty by ID
router.get('/:faculty_id', async (req, res) => {
  const db = getDatabase();
  try {
    const [rows] = await db.query('SELECT * FROM faculty WHERE id = ? AND tenant_id = ?', [req.params.faculty_id, req.tenantId]);
    if (!rows[0]) {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

export default router;
