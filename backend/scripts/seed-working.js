import { getDatabase, initializeDatabase } from '../src/config/database.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

// Initialize database first
await initializeDatabase();
const db = getDatabase();

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    await db.query('START TRANSACTION');

    // 1. Create sample tenant
    const tenantId = uuidv4();
    await db.query(`
      INSERT INTO tenants (id, name, domain, is_active)
      VALUES (?, ?, ?, ?)
    `, [tenantId, 'Demo School', 'demo.yagnexor.com', true]);
    console.log('✅ Tenant created');

    // 2. Create sample users with different roles
    const users = [
      {
        id: uuidv4(),
        email: 'admin@demo.yagnexor.com',
        password: await bcrypt.hash('admin123', 10),
        first_name: 'Super',
        last_name: 'Admin',
        role: 'super_admin',
        is_active: true,
        tenant_id: tenantId
      },
      {
        id: uuidv4(),
        email: 'principal@demo.yagnexor.com',
        password: await bcrypt.hash('principal123', 10),
        first_name: 'John',
        last_name: 'Smith',
        role: 'principal',
        is_active: true,
        tenant_id: tenantId
      },
      {
        id: uuidv4(),
        email: 'faculty1@demo.yagnexor.com',
        password: await bcrypt.hash('faculty123', 10),
        first_name: 'Sarah',
        last_name: 'Johnson',
        role: 'faculty',
        is_active: true,
        tenant_id: tenantId
      },
      {
        id: uuidv4(),
        email: 'faculty2@demo.yagnexor.com',
        password: await bcrypt.hash('faculty123', 10),
        first_name: 'Michael',
        last_name: 'Brown',
        role: 'faculty',
        is_active: true,
        tenant_id: tenantId
      },
      {
        id: uuidv4(),
        email: 'student1@demo.yagnexor.com',
        password: await bcrypt.hash('student123', 10),
        first_name: 'Emma',
        last_name: 'Wilson',
        role: 'student',
        is_active: true,
        tenant_id: tenantId
      },
      {
        id: uuidv4(),
        email: 'student2@demo.yagnexor.com',
        password: await bcrypt.hash('student123', 10),
        first_name: 'James',
        last_name: 'Davis',
        role: 'student',
        is_active: true,
        tenant_id: tenantId
      }
    ];

    for (const user of users) {
      await db.query(`
        INSERT INTO users (id, tenant_id, email, password, first_name, last_name, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [user.id, user.tenant_id, user.email, user.password, user.first_name, user.last_name, user.role, user.is_active]);
    }
    console.log('✅ Users created');

    // 3. Create academic years
    const academicYears = [
      { id: uuidv4(), year_name: '2023-2024', start_date: '2023-06-01', end_date: '2024-05-31', is_current: false, tenant_id: tenantId },
      { id: uuidv4(), year_name: '2024-2025', start_date: '2024-06-01', end_date: '2025-05-31', is_current: true, tenant_id: tenantId }
    ];

    for (const year of academicYears) {
      await db.query(`
        INSERT INTO academic_years (id, tenant_id, year_name, start_date, end_date, is_current)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [year.id, year.tenant_id, year.year_name, year.start_date, year.end_date, year.is_current]);
    }
    console.log('✅ Academic years created');

    // 4. Create departments
    const departments = [
      { id: uuidv4(), name: 'Computer Science', hod_id: users[2].id, tenant_id: tenantId },
      { id: uuidv4(), name: 'Mathematics', hod_id: users[3].id, tenant_id: tenantId },
      { id: uuidv4(), name: 'Physics', tenant_id: tenantId }
    ];

    for (const dept of departments) {
      await db.query(`
        INSERT INTO departments (id, tenant_id, name, hod_id)
        VALUES (?, ?, ?, ?)
      `, [dept.id, dept.tenant_id, dept.name, dept.hod_id || null]);
    }
    console.log('✅ Departments created');

    // 5. Create courses
    const courses = [
      { id: uuidv4(), name: 'Computer Science Fundamentals', code: 'CS101', description: 'Intro to CS', department_id: departments[0].id, duration_years: 1, tenant_id: tenantId },
      { id: uuidv4(), name: 'Advanced Programming', code: 'CS201', description: 'Advanced CS', department_id: departments[0].id, duration_years: 1, tenant_id: tenantId },
      { id: uuidv4(), name: 'Calculus I', code: 'MATH101', description: 'Basic Calculus', department_id: departments[1].id, duration_years: 1, tenant_id: tenantId }
    ];

    for (const course of courses) {
      await db.query(`
        INSERT INTO courses (id, tenant_id, name, code, description, department_id, duration_years)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [course.id, course.tenant_id, course.name, course.code, course.description, course.department_id, course.duration_years]);
    }
    console.log('✅ Courses created');

    // 6. Create classes
    const classes = [
      { id: uuidv4(), name: 'CS-101-A', course_id: courses[0].id, academic_year_id: academicYears[1].id, class_teacher_id: users[2].id, capacity: 30, tenant_id: tenantId },
      { id: uuidv4(), name: 'CS-201-B', course_id: courses[1].id, academic_year_id: academicYears[1].id, class_teacher_id: users[2].id, capacity: 25, tenant_id: tenantId },
      { id: uuidv4(), name: 'MATH-101-A', course_id: courses[2].id, academic_year_id: academicYears[1].id, class_teacher_id: users[3].id, capacity: 35, tenant_id: tenantId }
    ];

    for (const cls of classes) {
      await db.query(`
        INSERT INTO classes (id, tenant_id, name, course_id, academic_year_id, class_teacher_id, capacity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [cls.id, cls.tenant_id, cls.name, cls.course_id, cls.academic_year_id, cls.class_teacher_id, cls.capacity]);
    }
    console.log('✅ Classes created');

    // 7. Create students and enroll them
    const students = [
      { id: uuidv4(), user_id: users[4].id, roll_number: 'STU001', class_id: classes[0].id, academic_year_id: academicYears[1].id, tenant_id: tenantId },
      { id: uuidv4(), user_id: users[5].id, roll_number: 'STU002', class_id: classes[1].id, academic_year_id: academicYears[1].id, tenant_id: tenantId }
    ];

    for (const student of students) {
      await db.query(`
        INSERT INTO students (id, tenant_id, user_id, roll_number, class_id, academic_year_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [student.id, student.tenant_id, student.user_id, student.roll_number, student.class_id, student.academic_year_id]);
    }
    console.log('✅ Students created and enrolled');

    // 8. Create faculty assignments
    const faculty = [
      { id: uuidv4(), user_id: users[2].id, department_id: departments[0].id, qualification: 'M.Tech', specialization: 'Computer Science', tenant_id: tenantId },
      { id: uuidv4(), user_id: users[3].id, department_id: departments[1].id, qualification: 'M.Sc', specialization: 'Mathematics', tenant_id: tenantId }
    ];

    for (const fac of faculty) {
      await db.query(`
        INSERT INTO faculty (id, tenant_id, user_id, department_id, qualification, specialization)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [fac.id, fac.tenant_id, fac.user_id, fac.department_id, fac.qualification, fac.specialization]);
    }
    console.log('✅ Faculty created');

    // 9. Create attendance records
    const attendanceRecords = [
      { id: uuidv4(), student_id: students[0].id, class_id: classes[0].id, date: '2024-01-15', status: 'PRESENT', remarks: 'On time', tenant_id: tenantId },
      { id: uuidv4(), student_id: students[1].id, class_id: classes[1].id, date: '2024-01-15', status: 'ABSENT', remarks: 'Sick leave', tenant_id: tenantId },
      { id: uuidv4(), student_id: students[0].id, class_id: classes[0].id, date: '2024-01-16', status: 'PRESENT', remarks: 'On time', tenant_id: tenantId }
    ];

    for (const attendance of attendanceRecords) {
      await db.query(`
        INSERT INTO attendance (id, tenant_id, student_id, class_id, date, status, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [attendance.id, attendance.tenant_id, attendance.student_id, attendance.class_id, attendance.date, attendance.status, attendance.remarks]);
    }
    console.log('✅ Attendance records created');

    // 10. Create exams
    const exams = [
      { id: uuidv4(), title: 'Midterm Exam - CS101', course_id: courses[0].id, class_id: classes[0].id, exam_date: '2024-02-15', total_marks: 100, duration_minutes: 120, tenant_id: tenantId },
      { id: uuidv4(), title: 'Final Exam - CS201', course_id: courses[1].id, class_id: classes[1].id, exam_date: '2024-03-20', total_marks: 100, duration_minutes: 180, tenant_id: tenantId },
      { id: uuidv4(), title: 'Quiz - MATH101', course_id: courses[2].id, class_id: classes[2].id, exam_date: '2024-01-25', total_marks: 50, duration_minutes: 60, tenant_id: tenantId }
    ];

    for (const exam of exams) {
      await db.query(`
        INSERT INTO exams (id, tenant_id, title, course_id, class_id, exam_date, total_marks, duration_minutes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')
      `, [exam.id, exam.tenant_id, exam.title, exam.course_id, exam.class_id, exam.exam_date, exam.total_marks, exam.duration_minutes]);
    }
    console.log('✅ Exams created');

    // 11. Create exam results
    const examResults = [
      { id: uuidv4(), exam_id: exams[0].id, student_id: students[0].id, marks_obtained: 85, grade: 'A', remarks: 'Excellent', tenant_id: tenantId },
      { id: uuidv4(), exam_id: exams[1].id, student_id: students[1].id, marks_obtained: 78, grade: 'B+', remarks: 'Good', tenant_id: tenantId },
      { id: uuidv4(), exam_id: exams[2].id, student_id: students[0].id, marks_obtained: 42, grade: 'A-', remarks: 'Well done', tenant_id: tenantId }
    ];

    for (const result of examResults) {
      await db.query(`
        INSERT INTO exam_results (id, tenant_id, exam_id, student_id, marks_obtained, grade, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [result.id, result.tenant_id, result.exam_id, result.student_id, result.marks_obtained, result.grade, result.remarks]);
    }
    console.log('✅ Exam results created');

    await db.query('COMMIT');
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Super Admin: admin@demo.yagnexor.com / admin123');
    console.log('Principal: principal@demo.yagnexor.com / principal123');
    console.log('Faculty 1: faculty1@demo.yagnexor.com / faculty123');
    console.log('Faculty 2: faculty2@demo.yagnexor.com / faculty123');
    console.log('Student 1: student1@demo.yagnexor.com / student123');
    console.log('Student 2: student2@demo.yagnexor.com / student123');

    console.log('\n🏫 Sample Data Created:');
    console.log('- 1 Tenant: Demo School');
    console.log('- 6 Users (Admin, Principal, Faculty, Students)');
    console.log('- 2 Academic Years');
    console.log('- 3 Departments');
    console.log('- 3 Courses');
    console.log('- 3 Classes');
    console.log('- 2 Students enrolled');
    console.log('- 2 Faculty assigned');
    console.log('- 3 Attendance records');
    console.log('- 3 Exams scheduled');
    console.log('- 3 Exam results');

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run the seeding
seedDatabase().catch(console.error);
