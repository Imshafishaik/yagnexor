import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export async function createCourse(courseData) {
  const db = getDatabase();
  try {
    const courseId = uuidv4();
    const courseToken = generateCourseToken();
    
    const query = `
      INSERT INTO courses (id, tenant_id, name, description, code, department_id, duration_years)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      courseId,
      courseData.tenant_id,
      courseData.name,
      courseData.description || null,
      courseData.code || null,
      courseData.department_id || null,
      courseData.duration_years || 1,
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
      `SELECT c.*, d.name as department_name
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE c.id = ? AND c.tenant_id = ?`,
      [courseId, tenantId]
    );
    return courses[0] || null;
  } catch (error) {
    console.error('Error getting course by ID:', error);
    throw error;
  }
}

export async function getTenantCourses(tenantId) {
  const db = getDatabase();
  try {
    const [courses] = await db.query(
      `SELECT c.*, 
              d.name as department_name,
              (SELECT COUNT(*) FROM classes cl WHERE cl.course_id = c.id AND cl.tenant_id = c.tenant_id) as class_count,
              (SELECT COUNT(*) FROM subjects s WHERE s.course_id = c.id AND s.tenant_id = c.tenant_id) as subject_count
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE c.tenant_id = ?
       ORDER BY c.created_at DESC`,
      [tenantId]
    );
    return courses;
  } catch (error) {
    console.error('Error getting tenant courses:', error);
    throw error;
  }
}

export async function getTeacherCourses(teacherId, tenantId) {
  const db = getDatabase();
  try {
    const [courses] = await db.query(
      `SELECT c.*, d.name as department_name
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE c.tenant_id = ?
       ORDER BY c.created_at DESC`,
      [tenantId]
    );
    return courses;
  } catch (error) {
    console.error('Error getting teacher courses:', error);
    throw error;
  }
}

export async function getStudentByUserId(userId, tenantId) {
  const db = getDatabase();
  try {
    console.log('🔍 Looking up student for user ID:', userId, 'tenant:', tenantId);
    
    const [students] = await db.query(
      'SELECT id FROM students WHERE user_id = ? AND tenant_id = ?',
      [userId, tenantId]
    );
    
    console.log('📊 Found students:', students.length, 'records');
    
    if (students.length === 0) {
      // Create student record if it doesn't exist
      console.log('⚠️ No student record found, creating new one for user:', userId);
      const studentId = uuidv4();
      await db.query(
        `INSERT INTO students (id, tenant_id, user_id, status, created_at)
         VALUES (?, ?, ?, 'active', NOW())`,
        [studentId, tenantId, userId]
      );
      console.log('✅ Created new student record with ID:', studentId);
      return studentId;
    }
    
    console.log('✅ Found existing student ID:', students[0].id);
    return students[0].id;
  } catch (error) {
    console.error('Error getting student by user ID:', error);
    throw error;
  }
}

export async function enrollStudentInCourse(courseId, userId, courseToken, tenantId) {
  const db = getDatabase();
  try {
    // First get the student ID from user ID
    const studentId = await getStudentByUserId(userId, tenantId);
    
    // Verify course exists and tenant matches
    const [courses] = await db.query(
      'SELECT * FROM courses WHERE id = ? AND tenant_id = ?',
      [courseId, tenantId]
    );

    if (courses.length === 0) {
      throw new Error('Course not found');
    }

    // Check if student is already enrolled
    const [existingEnrollment] = await db.query(
      'SELECT * FROM course_enrollments WHERE course_id = ? AND student_id = ?',
      [courseId, studentId]
    );

    if (existingEnrollment.length > 0) {
      throw new Error('Student already enrolled in this course');
    }

    // Create enrollment record
    const enrollmentId = uuidv4();
    await db.query(
      `INSERT INTO course_enrollments (id, tenant_id, course_id, student_id, course_token_used, enrolled_at, is_active)
       VALUES (?, ?, ?, ?, ?, NOW(), 1)`,
      [enrollmentId, tenantId, courseId, studentId, courseToken]
    );

    return { success: true, enrollmentId };
  } catch (error) {
    console.error('Error enrolling student:', error);
    throw error;
  }
}

export async function getStudentCourses(studentId, tenantId) {
  const db = getDatabase();
  try {
    const [courses] = await db.query(
      `SELECT c.*, 
              d.name as department_name,
              ce.enrolled_at,
              ce.course_token_used
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id
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

    if (courseData.name !== undefined) {
      updateFields.push('name = ?');
      params.push(courseData.name);
    }
    if (courseData.description !== undefined) {
      updateFields.push('description = ?');
      params.push(courseData.description);
    }
    if (courseData.code !== undefined) {
      updateFields.push('code = ?');
      params.push(courseData.code);
    }
    if (courseData.department_id !== undefined) {
      updateFields.push('department_id = ?');
      params.push(courseData.department_id);
    }
    if (courseData.duration_years !== undefined) {
      updateFields.push('duration_years = ?');
      params.push(courseData.duration_years);
    }

    if (updateFields.length === 0) {
      return null; // No fields to update
    }

    params.push(courseId, tenantId);
    
    await db.query(
      `UPDATE courses SET ${updateFields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      params
    );
    
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
      'DELETE FROM courses WHERE id = ? AND tenant_id = ?',
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
      'SELECT * FROM courses WHERE course_token = ? AND tenant_id = ?',
      [courseToken, tenantId]
    );
    return courses[0] || null;
  } catch (error) {
    console.error('Error validating course token:', error);
    throw error;
  }
}
