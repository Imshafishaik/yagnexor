import express from 'express';
import Joi from 'joi';
import { validateRequest } from '../../core/middleware/guards.js';
import { requireMinimumRole } from '../../core/middleware/role-middleware.js';
import {
  createCourse,
  getCourseById,
  getTeacherCourses,
  getTenantCourses,
  enrollStudentInCourse,
  getStudentCourses,
  updateCourse,
  deleteCourse,
  validateCourseToken
} from '../../core/services/course-service.js';

const router = express.Router();

// Validation schemas
const createCourseSchema = Joi.object({
  name: Joi.string().min(3).required(),
  description: Joi.string().optional(),
  code: Joi.string().optional(),
  department_id: Joi.string().optional(),
  duration_years: Joi.number().integer().min(1).max(10).optional(),
});

const updateCourseSchema = Joi.object({
  name: Joi.string().min(3).optional(),
  description: Joi.string().optional(),
  code: Joi.string().optional(),
  department_id: Joi.string().optional(),
  duration_years: Joi.number().integer().min(1).max(10).optional(),
});

const enrollCourseSchema = Joi.object({
  course_token: Joi.string().required(),
});

// Get all courses for tenant (accessible by all authenticated users)
router.get('/', async (req, res) => {
  try {
    const courses = await getTenantCourses(req.tenantId);
    res.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const course = await getCourseById(id, req.tenantId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json({ course });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Get teacher's courses
router.get('/teacher/my-courses', async (req, res) => {
  try {
    const courses = await getTeacherCourses(req.user.id, req.tenantId);
    res.json({ courses });
  } catch (error) {
    console.error('Error fetching teacher courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get student's enrolled courses
router.get('/student/my-courses', async (req, res) => {
  try {
    const courses = await getStudentCourses(req.user.id, req.tenantId);
    res.json({ courses });
  } catch (error) {
    console.error('Error fetching student courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Create new course (teacher and above)
router.post('/', requireMinimumRole('manager'), validateRequest(createCourseSchema), async (req, res) => {
  try {
    const course = await createCourse({
      ...req.validatedBody,
      tenant_id: req.tenantId,
    });

    res.status(201).json({
      message: 'Course created successfully',
      course,
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course (teacher and above, only course teacher or admin)
router.put('/:id', requireMinimumRole('teacher'), validateRequest(updateCourseSchema), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is the course teacher or has higher privileges
    const course = await getCourseById(id, req.tenantId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const updatedCourse = await updateCourse(id, req.validatedBody, req.tenantId);

    res.json({
      message: 'Course updated successfully',
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course (teacher and above, only course teacher or admin)
router.delete('/:id', requireMinimumRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is the course teacher or has higher privileges
    const course = await getCourseById(id, req.tenantId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await deleteCourse(id, req.tenantId);

    res.json({
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Enroll in course with token (students only)
router.post('/:id/enroll', requireMinimumRole('student'), validateRequest(enrollCourseSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { course_token } = req.validatedBody;

    const course = await enrollStudentInCourse(id, req.user.id, course_token, req.tenantId);

    res.json({
      message: 'Successfully enrolled in course',
      course,
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    if (error.message.includes('Invalid course token') || error.message.includes('already enrolled') || error.message.includes('maximum student capacity')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

// Validate course token (public endpoint for token verification)
router.post('/validate-token', validateRequest(enrollCourseSchema), async (req, res) => {
  try {
    const { course_token } = req.validatedBody;

    const course = await validateCourseToken(course_token, req.tenantId);
    
    if (!course) {
      return res.status(404).json({ error: 'Invalid course token' });
    }

    // Return limited course information for token validation
    res.json({
      valid: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        teacher_first_name: course.teacher_first_name,
        teacher_last_name: course.teacher_last_name,
        max_students: course.max_students,
        current_enrollments: course.current_enrollments,
        start_date: course.start_date,
        end_date: course.end_date,
      }
    });
  } catch (error) {
    console.error('Error validating course token:', error);
    res.status(500).json({ error: 'Failed to validate course token' });
  }
});

export default router;
