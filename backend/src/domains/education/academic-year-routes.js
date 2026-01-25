import express from 'express';
import { getDatabase } from '../../config/database.js';

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

export default router;
