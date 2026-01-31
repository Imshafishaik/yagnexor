import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export async function createCourse(courseData) {
  const db = getDatabase();
  try {
    const courseId = uuidv4();
    const courseToken = generateCourseToken();
    
    const query = `
      INSERT INTO courses (id, tenant_id, title, description, course_code, teacher_id, course_token, max_students, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      courseId,
      courseData.tenant_id,
      courseData.title,
      courseData.description || null,
      courseData.course_code || null,
      courseData.teacher_id,
      courseToken,
      courseData.max_students || 0,
      courseData.start_date || null,
      courseData.end_date || null,
    ];

    await db.query(query, params);
    return await getCourseById(courseId, courseData.tenant_id);
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}

export async function getCourseById(courseId, tenantId) {
  const db = getDatabase();
  try {
    const [courses] = await db.query(
      `SELECT c.*, u.first_name as teacher_first_name, u.last_name as teacher_last_name, u.email as teacher_email
       FROM courses c
       JOIN users u ON c.teacher_id = u.id
       WHERE c.id = ? AND c.tenant_id = ?`,
      [courseId, tenantId]
    );
    return courses[0] || null;
  } catch (error) {
    console.error('Error getting course by ID:', error);
    throw error;
  }
}

export async function getTeacherCourses(teacherId, tenantId) {
  const db = getDatabase();
  try {
    const [courses] = await db.query(
      `SELECT c.*, 
              COUNT(ce.id) as enrolled_students
       FROM courses c
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.is_active = 1
       WHERE c.teacher_id = ? AND c.tenant_id = ?
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [teacherId, tenantId]
    );
    return courses;
  } catch (error) {
    console.error('Error getting teacher courses:', error);
    throw error;
  }
}

export async function getTenantCourses(tenantId) {
  const db = getDatabase();
  try {
    const [courses] = await db.query(
      `SELECT c.*, 
              u.first_name as teacher_first_name, 
              u.last_name as teacher_last_name,
              COUNT(ce.id) as enrolled_students
       FROM courses c
       JOIN users u ON c.teacher_id = u.id
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.is_active = 1
       WHERE c.tenant_id = ? AND c.is_active = 1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [tenantId]
    );
    return courses;
  } catch (error) {
    console.error('Error getting tenant courses:', error);
    throw error;
  }
}

export async function enrollStudentInCourse(courseId, studentId, courseToken, tenantId) {
  const db = getDatabase();
  try {
    // Verify course token and get course details
    const [courses] = await db.query(
      'SELECT * FROM courses WHERE id = ? AND course_token = ? AND tenant_id = ? AND is_active = 1',
      [courseId, courseToken, tenantId]
    );

    if (courses.length === 0) {
      throw new Error('Invalid course token or course not found');
    }

    const course = courses[0];

    // Check if student is already enrolled
    const [existingEnrollments] = await db.query(
      'SELECT * FROM course_enrollments WHERE course_id = ? AND student_id = ?',
      [courseId, studentId]
    );

    if (existingEnrollments.length > 0) {
      throw new Error('Student already enrolled in this course');
    }

    // Check max students limit
    if (course.max_students > 0) {
      const [currentEnrollments] = await db.query(
        'SELECT COUNT(*) as count FROM course_enrollments WHERE course_id = ? AND is_active = 1',
        [courseId]
      );

      if (currentEnrollments[0].count >= course.max_students) {
        throw new Error('Course has reached maximum student capacity');
      }
    }

    // Enroll student
    const enrollmentId = uuidv4();
    await db.query(
      'INSERT INTO course_enrollments (id, tenant_id, course_id, student_id, course_token_used) VALUES (?, ?, ?, ?, ?)',
      [enrollmentId, tenantId, courseId, studentId, courseToken]
    );

    // Update current enrollments count
    await db.query(
      'UPDATE courses SET current_enrollments = current_enrollments + 1 WHERE id = ?',
      [courseId]
    );

    return await getCourseById(courseId, tenantId);
  } catch (error) {
    console.error('Error enrolling student in course:', error);
    throw error;
  }
}

export async function getStudentCourses(studentId, tenantId) {
  const db = getDatabase();
  try {
    const [courses] = await db.query(
      `SELECT c.*, 
              u.first_name as teacher_first_name, 
              u.last_name as teacher_last_name,
              ce.enrolled_at,
              ce.course_token_used
       FROM courses c
       JOIN users u ON c.teacher_id = u.id
       JOIN course_enrollments ce ON c.id = ce.course_id
       WHERE ce.student_id = ? AND c.tenant_id = ? AND ce.is_active = 1
       ORDER BY ce.enrolled_at DESC`,
      [studentId, tenantId]
    );
    return courses;
  } catch (error) {
    console.error('Error getting student courses:', error);
    throw error;
  }
}

export async function updateCourse(courseId, courseData, tenantId) {
  const db = getDatabase();
  try {
    const updateFields = [];
    const params = [];

    if (courseData.title !== undefined) {
      updateFields.push('title = ?');
      params.push(courseData.title);
    }
    if (courseData.description !== undefined) {
      updateFields.push('description = ?');
      params.push(courseData.description);
    }
    if (courseData.course_code !== undefined) {
      updateFields.push('course_code = ?');
      params.push(courseData.course_code);
    }
    if (courseData.max_students !== undefined) {
      updateFields.push('max_students = ?');
      params.push(courseData.max_students);
    }
    if (courseData.start_date !== undefined) {
      updateFields.push('start_date = ?');
      params.push(courseData.start_date);
    }
    if (courseData.end_date !== undefined) {
      updateFields.push('end_date = ?');
      params.push(courseData.end_date);
    }
    if (courseData.is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(courseData.is_active);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(courseId, tenantId);

    const query = `
      UPDATE courses 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND tenant_id = ?
    `;

    await db.query(query, params);
    return await getCourseById(courseId, tenantId);
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
}

export async function deleteCourse(courseId, tenantId) {
  const db = getDatabase();
  try {
    await db.query(
      'UPDATE courses SET is_active = 0 WHERE id = ? AND tenant_id = ?',
      [courseId, tenantId]
    );
    return true;
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}

function generateCourseToken() {
  return crypto.randomBytes(32).toString('hex').toUpperCase();
}

export async function validateCourseToken(courseToken, tenantId) {
  const db = getDatabase();
  try {
    const [courses] = await db.query(
      'SELECT * FROM courses WHERE course_token = ? AND tenant_id = ? AND is_active = 1',
      [courseToken, tenantId]
    );
    return courses[0] || null;
  } catch (error) {
    console.error('Error validating course token:', error);
    throw error;
  }
}
