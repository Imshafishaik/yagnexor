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
      INSERT INTO tenants (id, name, domain, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
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
        INSERT INTO users (id, tenant_id, email, password, first_name, last_name, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [user.id, user.tenant_id, user.email, user.password, user.first_name, user.last_name, user.role, user.is_active]);
    }
    console.log('✅ Users created');

    // 3. Create academic years
    const academicYears = [
      { id: uuidv4(), year_name: '2023-2024', start_date: '2023-06-01', end_date: '2024-05-31', is_active: false, tenant_id: tenantId },
      { id: uuidv4(), year_name: '2024-2025', start_date: '2024-06-01', end_date: '2025-05-31', is_active: true, tenant_id: tenantId }
    ];

    for (const year of academicYears) {
      await db.query(`
        INSERT INTO academic_years (id, tenant_id, year_name, start_date, end_date, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [year.id, year.tenant_id, year.year_name, year.start_date, year.end_date, year.is_active]);
    }
    console.log('✅ Academic years created');

    // 4. Create departments
    const departments = [
      { id: uuidv4(), name: 'Computer Science', description: 'CS Department', hod_id: users[2].id, tenant_id: tenantId },
      { id: uuidv4(), name: 'Mathematics', description: 'Math Department', hod_id: users[3].id, tenant_id: tenantId },
      { id: uuidv4(), name: 'Physics', description: 'Physics Department', tenant_id: tenantId }
    ];

    for (const dept of departments) {
      await db.query(`
        INSERT INTO departments (id, tenant_id, name, description, hod_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [dept.id, dept.tenant_id, dept.name, dept.description, dept.hod_id || null]);
    }
    console.log('✅ Departments created');

    // 5. Create courses
    const courses = [
      { id: uuidv4(), name: 'Computer Science Fundamentals', code: 'CS101', description: 'Intro to CS', department_id: departments[0].id, duration_months: 6, credits: 3, tenant_id: tenantId },
      { id: uuidv4(), name: 'Advanced Programming', code: 'CS201', description: 'Advanced CS', department_id: departments[0].id, duration_months: 6, credits: 4, tenant_id: tenantId },
      { id: uuidv4(), name: 'Calculus I', code: 'MATH101', description: 'Basic Calculus', department_id: departments[1].id, duration_months: 6, credits: 4, tenant_id: tenantId },
      { id: uuidv4(), name: 'Linear Algebra', code: 'MATH201', description: 'Linear Algebra', department_id: departments[1].id, duration_months: 6, credits: 3, tenant_id: tenantId }
    ];

    for (const course of courses) {
      await db.query(`
        INSERT INTO courses (id, tenant_id, name, code, description, department_id, duration_months, credits, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [course.id, course.tenant_id, course.name, course.code, course.description, course.department_id, course.duration_months, course.credits]);
    }
    console.log('✅ Courses created');

    // 6. Create subjects
    const subjects = [
      { id: uuidv4(), name: 'Programming Basics', code: 'PB101', course_id: courses[0].id, tenant_id: tenantId },
      { id: uuidv4(), name: 'Data Structures', code: 'DS101', course_id: courses[0].id, tenant_id: tenantId },
      { id: uuidv4(), name: 'Algorithms', code: 'ALG201', course_id: courses[1].id, tenant_id: tenantId },
      { id: uuidv4(), name: 'Differential Calculus', code: 'DC101', course_id: courses[2].id, tenant_id: tenantId },
      { id: uuidv4(), name: 'Matrix Theory', code: 'MT201', course_id: courses[3].id, tenant_id: tenantId }
    ];

    for (const subject of subjects) {
      await db.query(`
        INSERT INTO subjects (id, tenant_id, name, code, course_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [subject.id, subject.tenant_id, subject.name, subject.code, subject.course_id]);
    }
    console.log('✅ Subjects created');

    // 7. Create classes
    const classes = [
      { id: uuidv4(), name: 'CS-101-A', course_id: courses[0].id, academic_year_id: academicYears[1].id, teacher_id: users[2].id, max_students: 30, tenant_id: tenantId },
      { id: uuidv4(), name: 'CS-201-B', course_id: courses[1].id, academic_year_id: academicYears[1].id, teacher_id: users[2].id, max_students: 25, tenant_id: tenantId },
      { id: uuidv4(), name: 'MATH-101-A', course_id: courses[2].id, academic_year_id: academicYears[1].id, teacher_id: users[3].id, max_students: 35, tenant_id: tenantId }
    ];

    for (const cls of classes) {
      await db.query(`
        INSERT INTO classes (id, tenant_id, name, course_id, academic_year_id, teacher_id, max_students, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [cls.id, cls.tenant_id, cls.name, cls.course_id, cls.academic_year_id, cls.teacher_id, cls.max_students]);
    }
    console.log('✅ Classes created');

    // 8. Create students and enroll them
    const students = [
      { id: uuidv4(), user_id: users[4].id, roll_number: 'STU001', class_id: classes[0].id, academic_year_id: academicYears[1].id, tenant_id: tenantId },
      { id: uuidv4(), user_id: users[5].id, roll_number: 'STU002', class_id: classes[1].id, academic_year_id: academicYears[1].id, tenant_id: tenantId }
    ];

    for (const student of students) {
      await db.query(`
        INSERT INTO students (id, tenant_id, user_id, roll_number, class_id, academic_year_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [student.id, student.tenant_id, student.user_id, student.roll_number, student.class_id, student.academic_year_id]);
    }
    console.log('✅ Students created and enrolled');

    // 9. Create faculty assignments
    const faculty = [
      { id: uuidv4(), user_id: users[2].id, employee_id: 'FAC001', department_id: departments[0].id, tenant_id: tenantId },
      { id: uuidv4(), user_id: users[3].id, employee_id: 'FAC002', department_id: departments[1].id, tenant_id: tenantId }
    ];

    for (const fac of faculty) {
      await db.query(`
        INSERT INTO faculty (id, tenant_id, user_id, employee_id, department_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [fac.id, fac.tenant_id, fac.user_id, fac.employee_id, fac.department_id]);
    }
    console.log('✅ Faculty created');

    // 10. Create attendance records
    const attendanceRecords = [
      { id: uuidv4(), student_id: students[0].id, class_id: classes[0].id, date: '2024-01-15', status: 'PRESENT', remarks: 'On time', tenant_id: tenantId },
      { id: uuidv4(), student_id: students[1].id, class_id: classes[1].id, date: '2024-01-15', status: 'ABSENT', remarks: 'Sick leave', tenant_id: tenantId },
      { id: uuidv4(), student_id: students[0].id, class_id: classes[0].id, date: '2024-01-16', status: 'PRESENT', remarks: 'On time', tenant_id: tenantId }
    ];

    for (const attendance of attendanceRecords) {
      await db.query(`
        INSERT INTO attendance (id, tenant_id, student_id, class_id, date, status, remarks, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [attendance.id, attendance.tenant_id, attendance.student_id, attendance.class_id, attendance.date, attendance.status, attendance.remarks]);
    }
    console.log('✅ Attendance records created');

    // 11. Create exams
    const exams = [
      { id: uuidv4(), title: 'Midterm Exam - CS101', course_id: courses[0].id, class_id: classes[0].id, exam_date: '2024-02-15', total_marks: 100, duration_minutes: 120, tenant_id: tenantId },
      { id: uuidv4(), title: 'Final Exam - CS201', course_id: courses[1].id, class_id: classes[1].id, exam_date: '2024-03-20', total_marks: 100, duration_minutes: 180, tenant_id: tenantId },
      { id: uuidv4(), title: 'Quiz - MATH101', course_id: courses[2].id, class_id: classes[2].id, exam_date: '2024-01-25', total_marks: 50, duration_minutes: 60, tenant_id: tenantId }
    ];

    for (const exam of exams) {
      await db.query(`
        INSERT INTO exams (id, tenant_id, title, course_id, class_id, exam_date, total_marks, duration_minutes, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', NOW(), NOW())
      `, [exam.id, exam.tenant_id, exam.title, exam.course_id, exam.class_id, exam.exam_date, exam.total_marks, exam.duration_minutes]);
    }
    console.log('✅ Exams created');

    // 12. Create exam results
    const examResults = [
      { id: uuidv4(), exam_id: exams[0].id, student_id: students[0].id, marks_obtained: 85, grade: 'A', remarks: 'Excellent', tenant_id: tenantId },
      { id: uuidv4(), exam_id: exams[1].id, student_id: students[1].id, marks_obtained: 78, grade: 'B+', remarks: 'Good', tenant_id: tenantId },
      { id: uuidv4(), exam_id: exams[2].id, student_id: students[0].id, marks_obtained: 42, grade: 'A-', remarks: 'Well done', tenant_id: tenantId }
    ];

    for (const result of examResults) {
      await db.query(`
        INSERT INTO exam_results (id, tenant_id, exam_id, student_id, marks_obtained, grade, remarks, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [result.id, result.tenant_id, result.exam_id, result.student_id, result.marks_obtained, result.grade, result.remarks]);
    }
    console.log('✅ Exam results created');

    // 13. Create fee structures
    const feeStructures = [
      { id: uuidv4(), name: 'Tuition Fee - CS101', description: 'Semester tuition', amount_due: 1500, fee_type: 'TUITION', academic_year_id: academicYears[1].id, class_id: classes[0].id, due_date: '2024-01-31', tenant_id: tenantId },
      { id: uuidv4(), name: 'Exam Fee - CS201', description: 'Final exam fee', amount_due: 100, fee_type: 'EXAM', academic_year_id: academicYears[1].id, class_id: classes[1].id, due_date: '2024-02-28', tenant_id: tenantId },
      { id: uuidv4(), name: 'Library Fee', description: 'Annual library fee', amount_due: 200, fee_type: 'LIBRARY', academic_year_id: academicYears[1].id, due_date: '2024-01-15', tenant_id: tenantId }
    ];

    for (const fee of feeStructures) {
      await db.query(`
        INSERT INTO fee_structures (id, tenant_id, name, description, amount_due, fee_type, academic_year_id, class_id, due_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [fee.id, fee.tenant_id, fee.name, fee.description, fee.amount_due, fee.fee_type, fee.academic_year_id, fee.class_id || null, fee.due_date]);
    }
    console.log('✅ Fee structures created');

    // 14. Create student fees
    const studentFees = [
      { id: uuidv4(), student_id: students[0].id, fee_structure_id: feeStructures[0].id, amount_due: 1500, amount_paid: 1500, status: 'PAID', due_date: '2024-01-31', payment_date: '2024-01-25', tenant_id: tenantId },
      { id: uuidv4(), student_id: students[1].id, fee_structure_id: feeStructures[1].id, amount_due: 100, amount_paid: 50, status: 'PARTIAL', due_date: '2024-02-28', tenant_id: tenantId },
      { id: uuidv4(), student_id: students[0].id, fee_structure_id: feeStructures[2].id, amount_due: 200, amount_paid: 0, status: 'PENDING', due_date: '2024-01-15', tenant_id: tenantId }
    ];

    for (const studentFee of studentFees) {
      await db.query(`
        INSERT INTO student_fees (id, tenant_id, student_id, fee_structure_id, amount_due, amount_paid, status, due_date, payment_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [studentFee.id, studentFee.tenant_id, studentFee.student_id, studentFee.fee_structure_id, studentFee.amount_due, studentFee.amount_paid, studentFee.status, studentFee.due_date, studentFee.payment_date || null]);
    }
    console.log('✅ Student fees created');

    // 15. Create fee payments
    const feePayments = [
      { id: uuidv4(), student_fee_id: studentFees[0].id, amount: 1500, payment_method: 'CREDIT_CARD', transaction_id: 'TXN001', remarks: 'Full payment', tenant_id: tenantId },
      { id: uuidv4(), student_fee_id: studentFees[1].id, amount: 50, payment_method: 'CASH', transaction_id: null, remarks: 'Partial payment', tenant_id: tenantId }
    ];

    for (const payment of feePayments) {
      await db.query(`
        INSERT INTO fee_payments (id, tenant_id, student_fee_id, amount, payment_method, transaction_id, remarks, payment_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [payment.id, payment.tenant_id, payment.student_fee_id, payment.amount, payment.payment_method, payment.transaction_id, payment.remarks]);
    }
    console.log('✅ Fee payments created');

    await db.query('COMMIT');
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Super Admin: admin@demo.yagnexor.com / admin123');
    console.log('Principal: principal@demo.yagnexor.com / principal123');
    console.log('Faculty 1: faculty1@demo.yagnexor.com / faculty123');
    console.log('Faculty 2: faculty2@demo.yagnexor.com / faculty123');
    console.log('Student 1: student1@demo.yagnexor.com / student123');
    console.log('Student 2: student2@demo.yagnexor.com / student123');

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
