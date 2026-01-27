import express from 'express';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all academic years
router.get('/', async (req, res) => {
  const db = getDatabase();
  try {
    const tenantId = req.tenantId;
    const [years] = await db.query('SELECT * FROM academic_years WHERE tenant_id = ?', [tenantId]);
    res.json({ academicYears: years });
  } catch (error) {
    console.error('Error fetching academic years:', error);
    res.status(500).json({ message: 'Failed to fetch academic years' });
  }
});

// Get academic year by ID
router.get('/:id', async (req, res) => {
  const db = getDatabase();
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const [years] = await db.query(
      'SELECT * FROM academic_years WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (years.length === 0) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    res.json(years[0]);
  } catch (error) {
    console.error('Error fetching academic year:', error);
    res.status(500).json({ message: 'Failed to fetch academic year' });
  }
});

// Create academic year
router.post('/', async (req, res) => {
  const db = getDatabase();
  const { year_name, start_date, end_date, is_current } = req.body;

  try {
    const yearId = uuidv4();
    await db.query(
      `INSERT INTO academic_years (id, tenant_id, year_name, start_date, end_date, is_current)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [yearId, req.tenantId, year_name, start_date, end_date, is_current || false]
    );
    
    res.status(201).json({ 
      message: 'Academic year created successfully', 
      academic_year_id: yearId 
    });
  } catch (error) {
    console.error('Error creating academic year:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Academic year name already exists' });
    }
    res.status(500).json({ error: 'Failed to create academic year' });
  }
});

// Update academic year
router.put('/:id', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { year_name, start_date, end_date, is_current } = req.body;

  try {
    // Check if academic year exists
    const [existingYear] = await db.query(
      'SELECT id FROM academic_years WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingYear.length === 0) {
      return res.status(404).json({ error: 'Academic year not found' });
    }

    // If setting as current, unset other current years
    if (is_current === true) {
      await db.query(
        'UPDATE academic_years SET is_current = false WHERE tenant_id = ? AND id != ?',
        [req.tenantId, id]
      );
    }

    // Update academic year
    await db.query(
      `UPDATE academic_years 
       SET year_name = ?, start_date = ?, end_date = ?, is_current = ?
       WHERE id = ? AND tenant_id = ?`,
      [year_name, start_date, end_date, is_current, id, req.tenantId]
    );
    
    res.json({ message: 'Academic year updated successfully' });
  } catch (error) {
    console.error('Error updating academic year:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Academic year name already exists' });
    }
    res.status(500).json({ error: 'Failed to update academic year' });
  }
});

// Delete academic year
router.delete('/:id', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;

  try {
    // Check if academic year exists
    const [existingYear] = await db.query(
      'SELECT id FROM academic_years WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingYear.length === 0) {
      return res.status(404).json({ error: 'Academic year not found' });
    }

    // Check if academic year has classes
    const [classCount] = await db.query(
      'SELECT COUNT(*) as count FROM classes WHERE academic_year_id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (classCount[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete academic year with associated classes' 
      });
    }

    // Delete academic year
    await db.query('DELETE FROM academic_years WHERE id = ? AND tenant_id = ?', [id, req.tenantId]);
    
    res.json({ message: 'Academic year deleted successfully' });
  } catch (error) {
    console.error('Error deleting academic year:', error);
    res.status(500).json({ error: 'Failed to delete academic year' });
  }
});

export default router;
