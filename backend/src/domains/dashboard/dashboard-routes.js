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
      'SELECT COUNT(*) as count FROM faculty WHERE tenant_id = ?',
      [tenantId]
    );
    
    const [studentCount] = await db.query(
      'SELECT COUNT(*) as count FROM students WHERE tenant_id = ?',
      [tenantId]
    );
    
    const [classCount] = await db.query(
      'SELECT COUNT(*) as count FROM classes WHERE tenant_id = ?',
      [tenantId]
    );
    
    const [courseCount] = await db.query(
      'SELECT COUNT(*) as count FROM courses WHERE tenant_id = ?',
      [tenantId]
    );

    // Get department count
    const [departmentCount] = await db.query(
      'SELECT COUNT(*) as count FROM departments WHERE tenant_id = ?',
      [tenantId]
    );

    // Get recent faculty with user details
    const [recentFaculty] = await db.query(`
      SELECT f.id, f.qualification, f.specialization, f.created_at,
             u.first_name, u.last_name, u.email,
             d.name as department_name
      FROM faculty f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN departments d ON f.department_id = d.id
      WHERE f.tenant_id = ?
      ORDER BY f.created_at DESC
      LIMIT 5
    `, [tenantId]);

    // Get recent students with user details
    const [recentStudents] = await db.query(`
      SELECT s.id, s.roll_number, s.created_at,
             u.first_name, u.last_name, u.email,
             c.name as class_name
      FROM students s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.tenant_id = ?
      ORDER BY s.created_at DESC
      LIMIT 5
    `, [tenantId]);

    res.json({
      stats: {
        faculty: facultyCount[0].count,
        students: studentCount[0].count,
        classes: classCount[0].count,
        courses: courseCount[0].count,
        departments: departmentCount[0].count
      },
      recentFaculty,
      recentStudents
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;
