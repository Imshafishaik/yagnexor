import { Router } from 'express';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get class students for attendance taking
router.get('/class/:class_id', async (req, res) => {
  const db = getDatabase();
  const { class_id } = req.params;
  const { date } = req.query;

  try {
    // Get students in the class
    const [students] = await db.query(
      `SELECT s.id, s.roll_number, u.first_name, u.last_name, u.email 
       FROM students s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.class_id = ? AND s.tenant_id = ? AND s.status = 'active'
       ORDER BY s.roll_number, u.first_name`,
      [class_id, req.tenantId]
    );

    // If date is provided, get existing attendance for that date
    let existingAttendance = [];
    if (date) {
      const [attendance] = await db.query(
        `SELECT student_id, status, remarks 
         FROM attendance_records 
         WHERE class_id = ? AND attendance_date = ? AND tenant_id = ?`,
        [class_id, date, req.tenantId]
      );
      existingAttendance = attendance;
    }

    // Merge students with their attendance status
    const studentsWithAttendance = students.map(student => {
      const attendance = existingAttendance.find(a => a.student_id === student.id);
      return {
        ...student,
        status: attendance?.status || null,
        remarks: attendance?.remarks || null,
      };
    });

    res.json({ students: studentsWithAttendance });
  } catch (error) {
    console.error('Error fetching class students:', error);
    res.status(500).json({ error: 'Failed to fetch class students' });
  }
});

// Take attendance for entire class
router.post('/class/:class_id', async (req, res) => {
  const db = getDatabase();
  const { class_id } = req.params;
  const { attendance_date, subject_id, attendance_records, teacher_remarks } = req.body;

  try {
    // Validate required fields
    if (!attendance_date || !attendance_records || !Array.isArray(attendance_records)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Begin transaction
    await db.query('START TRANSACTION');

    try {
      // Delete any existing attendance for this class on this date
      await db.query(
        'DELETE FROM attendance_records WHERE class_id = ? AND attendance_date = ? AND tenant_id = ?',
        [class_id, attendance_date, req.tenantId]
      );

      // Insert new attendance records
      for (const record of attendance_records) {
        const attendanceId = uuidv4();
        await db.query(
          `INSERT INTO attendance_records (id, tenant_id, student_id, class_id, subject_id, attendance_date, status, remarks, teacher_remarks)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            attendanceId, 
            req.tenantId, 
            record.student_id, 
            class_id, 
            subject_id || null, 
            attendance_date, 
            record.status, 
            record.remarks || null, 
            teacher_remarks || null
          ]
        );
      }

      await db.query('COMMIT');
      
      res.status(201).json({ 
        message: 'Class attendance marked successfully',
        records_marked: attendance_records.length
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error marking class attendance:', error);
    res.status(500).json({ error: 'Failed to mark class attendance' });
  }
});

// Get teacher's classes for attendance
router.get('/teacher/classes', async (req, res) => {
  const db = getDatabase();
  const { teacher_id } = req.query;

  try {
    const [classes] = await db.query(
      `SELECT c.id, c.name, c.section, c.academic_year_id 
       FROM classes c 
       WHERE c.class_teacher_id = ? AND c.tenant_id = ?`,
      [teacher_id, req.tenantId]
    );

    res.json({ classes });
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ error: 'Failed to fetch teacher classes' });
  }
});

// Get attendance history for a class
router.get('/class/:class_id/history', async (req, res) => {
  const db = getDatabase();
  const { class_id } = req.params;
  const { date_from, date_to, limit = 30 } = req.query;

  try {
    let query = `
      SELECT ar.attendance_date, COUNT(*) as total_students,
             SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END) as present,
             SUM(CASE WHEN ar.status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
             SUM(CASE WHEN ar.status = 'LATE' THEN 1 ELSE 0 END) as late,
             ar.teacher_remarks
      FROM attendance_records ar
      WHERE ar.class_id = ? AND ar.tenant_id = ?
    `;
    const params = [class_id, req.tenantId];

    if (date_from) {
      query += ' AND ar.attendance_date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      query += ' AND ar.attendance_date <= ?';
      params.push(date_to);
    }

    query += ' GROUP BY ar.attendance_date, ar.teacher_remarks ORDER BY ar.attendance_date DESC LIMIT ?';
    params.push(parseInt(limit));

    const [records] = await db.query(query, params);

    res.json({ attendance_history: records });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
});

// Mark attendance (single student - keeping existing functionality)
router.post('/', async (req, res) => {
  const db = getDatabase();
  const { student_id, subject_id, attendance_date, status, remarks } = req.body;

  try {
    const attendanceId = uuidv4();
    await db.query(
      `INSERT INTO attendance_records (id, tenant_id, student_id, subject_id, attendance_date, status, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [attendanceId, req.tenantId, student_id, subject_id, attendance_date, status, remarks]
    );
    res.status(201).json({ message: 'Attendance marked', attendance_id: attendanceId });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Get attendance records (keeping existing functionality)
router.get('/', async (req, res) => {
  const db = getDatabase();
  const { student_id, date_from, date_to } = req.query;

  try {
    let query = 'SELECT * FROM attendance_records WHERE tenant_id = ?';
    const params = [req.tenantId];

    if (student_id) {
      query += ' AND student_id = ?';
      params.push(student_id);
    }
    if (date_from) {
      query += ' AND attendance_date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      query += ' AND attendance_date <= ?';
      params.push(date_to);
    }

    const [rows] = await db.query(query, params);
    res.json({ attendance: rows });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Get attendance summary (keeping existing functionality)
router.get('/summary/:student_id', async (req, res) => {
  const db = getDatabase();
  try {
    const [records] = await db.query(
      `SELECT status, COUNT(*) as count FROM attendance_records 
       WHERE student_id = ? AND tenant_id = ?
       GROUP BY status`,
      [req.params.student_id, req.tenantId]
    );

    const total = records.reduce((sum, r) => sum + r.count, 0);
    const present = records.find((r) => r.status === 'PRESENT')?.count || 0;
    const attendance_percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    res.json({
      student_id: req.params.student_id,
      total_days: total,
      present_days: present,
      attendance_percentage,
      breakdown: records,
    });
  } catch (error) {
    console.error('Error calculating attendance summary:', error);
    res.status(500).json({ error: 'Failed to calculate summary' });
  }
});

export default router;
