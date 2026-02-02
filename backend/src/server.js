import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import { rateLimitMiddleware, errorHandler } from './core/middleware/guards.js';
import { authMiddleware, tenantScopeMiddleware } from './core/middleware/api-guard.js';
import { runMigrations } from './migrations/migrate.js';
import authRoutes from './domains/auth/auth-routes.js';
import userRoutes from './domains/admin/user-routes.js';
import roleRoutes from './domains/admin/role-routes.js';
import departmentRoutes from './domains/admin/department-routes.js';
import studentRoutes from './domains/education/student-routes.js';
import facultyRoutes from './domains/education/faculty-routes.js';
import courseRoutes from './domains/courses/course-routes.js';
import subjectRoutes from './domains/education/subject-routes.js';
import attendanceRoutes from './domains/education/attendance-routes.js';
import examRoutes from './domains/education/exam-routes.js';
import feeRoutes from './domains/education/fee-routes.js';
import classRoutes from './domains/education/class-routes.js';
import academicYearRoutes from './domains/education/academic-year-routes.js';
import subjectContentRoutes from './domains/education/subject-content-routes.js';
import tenantRoutes from './domains/admin/tenant-routes.js';
import dashboardRoutes from './domains/dashboard/dashboard-routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(requestLogger);

// Temporary fix endpoint (before rate limiting)
app.get('/fix-courses', async (req, res) => {
  try {
    const { getDatabase } = await import('./config/database.js');
    const db = getDatabase();
    
    // Test database connection
    await db.query('SELECT 1');
    console.log('Database connection OK');
    
    // Drop course_enrollments table first if it exists
    try {
      await db.query('DROP TABLE IF EXISTS course_enrollments');
      console.log('Dropped existing course_enrollments table');
    } catch (error) {
      console.log('No course_enrollments table to drop');
    }
    
    // Drop existing courses table if it exists
    try {
      await db.query('DROP TABLE IF EXISTS courses');
      console.log('Dropped existing courses table');
    } catch (error) {
      console.log('No courses table to drop');
    }
    
    // Create courses table
    await db.query(`
      CREATE TABLE courses (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        course_code VARCHAR(50) UNIQUE,
        teacher_id VARCHAR(36) NOT NULL,
        department_id VARCHAR(36),
        course_token VARCHAR(64) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        max_students INT DEFAULT 0,
        current_enrollments INT DEFAULT 0,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create course_enrollments table
    await db.query(`
      CREATE TABLE course_enrollments (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        course_id VARCHAR(36) NOT NULL,
        student_id VARCHAR(36) NOT NULL,
        course_token_used VARCHAR(64),
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        UNIQUE KEY unique_enrollment (course_id, student_id)
      )
    `);
    
    console.log('Created courses and course_enrollments tables successfully');
    res.json({ message: 'Courses tables created successfully!' });
  } catch (error) {
    console.error('Error fixing courses table:', error);
    res.status(500).json({ error: 'Failed to fix courses table', details: error.message });
  }
});

// Test endpoint
app.get('/test-db', async (req, res) => {
  try {
    const { getDatabase } = await import('./config/database.js');
    const db = getDatabase();
    const [result] = await db.query('SELECT "Database working!" as message');
    res.json(result);
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: 'Database test failed', details: error.message });
  }
});

// Check subjects table structure
app.get('/check-subjects', async (req, res) => {
  try {
    const { getDatabase } = await import('./config/database.js');
    const db = getDatabase();
    const [columns] = await db.query('DESCRIBE subjects');
    res.json({ columns: columns.map(col => col.Field) });
  } catch (error) {
    console.error('Error checking subjects table:', error);
    res.status(500).json({ error: 'Failed to check subjects table', details: error.message });
  }
});

// Test enrollment endpoint
app.post('/test-enrollment', async (req, res) => {
  try {
    const { getDatabase } = await import('./config/database.js');
    const { randomUUID } = await import('crypto');
    const db = getDatabase();
    const { student_id, course_id } = req.body;
    
    await db.query(
      'INSERT INTO course_enrollments (id, tenant_id, student_id, course_id, enrolled_at, is_active) VALUES (?, ?, ?, ?, NOW(), 1)',
      [randomUUID(), '72668e17-6b73-41bf-b0b0-4049415dfee0', student_id, course_id]
    );
    
    res.json({ message: 'Test enrollment created successfully' });
  } catch (error) {
    console.error('Error creating test enrollment:', error);
    res.status(500).json({ error: 'Failed to create test enrollment', details: error.message });
  }
});

app.use(rateLimitMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', authMiddleware, tenantScopeMiddleware, userRoutes);
app.use('/api/roles', authMiddleware, tenantScopeMiddleware, roleRoutes);
app.use('/api/departments', authMiddleware, tenantScopeMiddleware, departmentRoutes);
app.use('/api/students', authMiddleware, tenantScopeMiddleware, studentRoutes);
app.use('/api/faculty', authMiddleware, tenantScopeMiddleware, facultyRoutes);
app.use('/api/courses', authMiddleware, tenantScopeMiddleware, courseRoutes);
app.use('/api/subjects', authMiddleware, tenantScopeMiddleware, subjectRoutes);
app.use('/api/subject-content', authMiddleware, tenantScopeMiddleware, subjectContentRoutes);
app.use('/api/attendance', authMiddleware, tenantScopeMiddleware, attendanceRoutes);
app.use('/api/exams', authMiddleware, tenantScopeMiddleware, examRoutes);
app.use('/api/fees', authMiddleware, tenantScopeMiddleware, feeRoutes);
app.use('/api/classes', authMiddleware, tenantScopeMiddleware, classRoutes);
app.use('/api/academic-years', authMiddleware, tenantScopeMiddleware, academicYearRoutes);
app.use('/api/dashboard', authMiddleware, tenantScopeMiddleware, dashboardRoutes);

// Super Admin routes (no tenant scope)
app.use('/api/tenants', authMiddleware, tenantRoutes);

// Error handling
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    await runMigrations();

    app.listen(PORT, () => {
      console.log(`\n✓ YAGNEXOR Backend running on http://localhost:${PORT}`);
      console.log(`✓ API available at http://localhost:${PORT}/api`);
      console.log(`✓ Health check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
