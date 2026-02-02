import { Router } from 'express';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List faculty
router.get('/', async (req, res) => {
  const db = getDatabase();
  try {
    const [rows] = await db.query(`
      SELECT f.*, u.first_name, u.last_name, u.email
      FROM faculty f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.tenant_id = ?
    `, [req.tenantId]);
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

// Update faculty
router.put('/:faculty_id', async (req, res) => {
  const db = getDatabase();
  const { user_id, department_id, qualification, specialization, phone, office_number, employment_status } = req.body;
  const { faculty_id } = req.params;

  try {
    // Check if faculty exists
    const [existingFaculty] = await db.query(
      'SELECT id FROM faculty WHERE id = ? AND tenant_id = ?',
      [faculty_id, req.tenantId]
    );
    
    if (existingFaculty.length === 0) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    // Update faculty
    await db.query(
      `UPDATE faculty 
       SET user_id = ?, department_id = ?, qualification = ?, specialization = ?, 
           phone = ?, office_number = ?, employment_status = ?
       WHERE id = ? AND tenant_id = ?`,
      [user_id, department_id, qualification, specialization, phone, office_number, employment_status || 'ACTIVE', faculty_id, req.tenantId]
    );
    
    res.json({ message: 'Faculty updated successfully' });
  } catch (error) {
    console.error('Error updating faculty:', error);
    res.status(500).json({ error: 'Failed to update faculty' });
  }
});

// Delete faculty
router.delete('/:faculty_id', async (req, res) => {
  const db = getDatabase();
  const { faculty_id } = req.params;

  try {
    // Check if faculty exists
    const [existingFaculty] = await db.query(
      'SELECT id FROM faculty WHERE id = ? AND tenant_id = ?',
      [faculty_id, req.tenantId]
    );
    
    if (existingFaculty.length === 0) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    // Delete faculty
    await db.query('DELETE FROM faculty WHERE id = ? AND tenant_id = ?', [faculty_id, req.tenantId]);
    
    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    console.error('Error deleting faculty:', error);
    res.status(500).json({ error: 'Failed to delete faculty' });
  }
});

export default router;
