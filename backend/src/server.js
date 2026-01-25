import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import { rateLimitMiddleware, errorHandler, requestLogger } from './core/middleware/guards.js';
import { authMiddleware, tenantScopeMiddleware } from './core/middleware/api-guard.js';
import { runMigrations } from './migrations/migrate.js';
import authRoutes from './domains/auth/auth-routes.js';
import userRoutes from './domains/admin/user-routes.js';
import roleRoutes from './domains/admin/role-routes.js';
import studentRoutes from './domains/education/student-routes.js';
import facultyRoutes from './domains/education/faculty-routes.js';
import attendanceRoutes from './domains/education/attendance-routes.js';
import examRoutes from './domains/education/exam-routes.js';
import feeRoutes from './domains/education/fee-routes.js';
import classRoutes from './domains/education/class-routes.js';
import academicYearRoutes from './domains/education/academic-year-routes.js';
import tenantRoutes from './domains/admin/tenant-routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
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
app.use('/api/students', authMiddleware, tenantScopeMiddleware, studentRoutes);
app.use('/api/faculty', authMiddleware, tenantScopeMiddleware, facultyRoutes);
app.use('/api/attendance', authMiddleware, tenantScopeMiddleware, attendanceRoutes);
app.use('/api/exams', authMiddleware, tenantScopeMiddleware, examRoutes);
app.use('/api/fees', authMiddleware, tenantScopeMiddleware, feeRoutes);
app.use('/api/classes', authMiddleware, tenantScopeMiddleware, classRoutes);
app.use('/api/academic-years', authMiddleware, tenantScopeMiddleware, academicYearRoutes);

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
