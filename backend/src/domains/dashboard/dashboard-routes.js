import { Router } from 'express';
import { getDatabase } from '../../config/database.js';

const router = Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  const db = getDatabase();
  const tenantId = req.tenantId;

  try {
    // Get counts for dashboard
    const [facultyCount] = await db.query(
      'SELECT COUNT(*) as count FROM faculty WHERE tenant_id = ? AND employment_status = "ACTIVE"',
      [tenantId]
    );
    
    const [studentCount] = await db.query(
      'SELECT COUNT(*) as count FROM students WHERE tenant_id = ? AND status = "ACTIVE"',
      [tenantId]
    );
    
    const [classCount] = await db.query(
      'SELECT COUNT(*) as count FROM classes WHERE tenant_id = ?',
      [tenantId]
    );
    
    const [courseCount] = await db.query(
      'SELECT COUNT(*) as count FROM courses c WHERE c.tenant_id = ?',
      [tenantId]
    );

    // Get recent faculty
    const [recentFaculty] = await db.query(`
      SELECT f.id, f.first_name, f.last_name, f.specialization, d.name as department_name, f.created_at
      FROM faculty f
      LEFT JOIN departments d ON f.department_id = d.id
      WHERE f.tenant_id = ?
      ORDER BY f.created_at DESC
      LIMIT 5
    `, [tenantId]);

    res.json({
      stats: {
        faculty: facultyCount[0].count,
        students: studentCount[0].count,
        classes: classCount[0].count,
        courses: courseCount[0].count
      },
      recentFaculty
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;
