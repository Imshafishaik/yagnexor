export const migrations = [
  {
    name: '001_create_base_tables',
    sql: `
      CREATE TABLE IF NOT EXISTS tenants (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'student',
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        UNIQUE KEY unique_email_tenant (email, tenant_id),
        INDEX idx_tenant_id (tenant_id)
      );

      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        UNIQUE KEY unique_role_tenant (name, tenant_id)
      );

      CREATE TABLE IF NOT EXISTS permissions (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        resource VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        UNIQUE KEY unique_permission (tenant_id, resource, action)
      );

      CREATE TABLE IF NOT EXISTS role_permissions (
        id VARCHAR(36) PRIMARY KEY,
        role_id VARCHAR(36) NOT NULL,
        permission_id VARCHAR(36) NOT NULL,
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (permission_id) REFERENCES permissions(id),
        UNIQUE KEY unique_role_permission (role_id, permission_id)
      );

      CREATE TABLE IF NOT EXISTS campuses (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        principal_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (principal_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS academic_years (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        year_name VARCHAR(50) NOT NULL,
        start_date DATE,
        end_date DATE,
        is_current BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      );

      CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        campus_id VARCHAR(36),
        name VARCHAR(255) NOT NULL,
        hod_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (campus_id) REFERENCES campuses(id),
        FOREIGN KEY (hod_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS courses (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        department_id VARCHAR(36),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50),
        duration_years INT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (department_id) REFERENCES departments(id)
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        course_id VARCHAR(36),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50),
        credits INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (course_id) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS classes (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        course_id VARCHAR(36),
        academic_year_id VARCHAR(36),
        name VARCHAR(100),
        class_teacher_id VARCHAR(36),
        capacity INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (course_id) REFERENCES courses(id),
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
        FOREIGN KEY (class_teacher_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) UNIQUE NOT NULL,
        class_id VARCHAR(36),
        academic_year_id VARCHAR(36),
        roll_number VARCHAR(50),
        enrollment_number VARCHAR(50) UNIQUE,
        date_of_birth DATE,
        gender VARCHAR(20),
        phone VARCHAR(20),
        address TEXT,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
      );

      CREATE TABLE IF NOT EXISTS faculty (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) UNIQUE NOT NULL,
        department_id VARCHAR(36),
        qualification VARCHAR(255),
        specialization VARCHAR(255),
        phone VARCHAR(20),
        office_number VARCHAR(50),
        employment_status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (department_id) REFERENCES departments(id)
      );

      CREATE TABLE IF NOT EXISTS faculty_subjects (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        faculty_id VARCHAR(36),
        subject_id VARCHAR(36),
        class_id VARCHAR(36),
        academic_year_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (faculty_id) REFERENCES faculty(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id),
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
      );

      CREATE TABLE IF NOT EXISTS attendance_records (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        student_id VARCHAR(36),
        subject_id VARCHAR(36),
        attendance_date DATE,
        status VARCHAR(20) DEFAULT 'PRESENT',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id),
        INDEX idx_student_date (student_id, attendance_date)
      );

      CREATE TABLE IF NOT EXISTS exams (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        subject_id VARCHAR(36),
        class_id VARCHAR(36),
        academic_year_id VARCHAR(36),
        name VARCHAR(255) NOT NULL,
        exam_type VARCHAR(50),
        total_marks INT,
        exam_date DATE,
        exam_time TIME,
        duration_minutes INT,
        instructions TEXT,
        is_published BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id),
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
      );

      CREATE TABLE IF NOT EXISTS exam_results (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        exam_id VARCHAR(36),
        student_id VARCHAR(36),
        marks_obtained INT,
        grade VARCHAR(5),
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (exam_id) REFERENCES exams(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
      );

      CREATE TABLE IF NOT EXISTS fee_structures (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        course_id VARCHAR(36),
        academic_year_id VARCHAR(36),
        amount DECIMAL(12,2),
        due_date DATE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (course_id) REFERENCES courses(id),
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
      );

      CREATE TABLE IF NOT EXISTS student_fees (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        student_id VARCHAR(36),
        fee_structure_id VARCHAR(36),
        amount_due DECIMAL(12,2),
        amount_paid DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'PENDING',
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id)
      );

      CREATE TABLE IF NOT EXISTS course_materials (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        subject_id VARCHAR(36),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_url VARCHAR(500),
        uploaded_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36),
        action VARCHAR(255),
        entity_type VARCHAR(100),
        entity_id VARCHAR(36),
        changes JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS courses (
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (teacher_id) REFERENCES users(id),
        FOREIGN KEY (department_id) REFERENCES departments(id),
        INDEX idx_course_token (course_token),
        INDEX idx_teacher_id (teacher_id),
        INDEX idx_tenant_id (tenant_id),
        INDEX idx_department_id (department_id)
      );

      CREATE TABLE IF NOT EXISTS course_enrollments (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        course_id VARCHAR(36) NOT NULL,
        student_id VARCHAR(36) NOT NULL,
        course_token_used VARCHAR(64),
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (course_id) REFERENCES courses(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        UNIQUE KEY unique_enrollment (course_id, student_id),
        INDEX idx_student_id (student_id)
      );

      CREATE TABLE IF NOT EXISTS student_registrations (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        registration_token VARCHAR(36) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'pending', -- pending, completed, expired
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        INDEX idx_email (email),
        INDEX idx_token (registration_token),
        INDEX idx_status (status),
        INDEX idx_expires (expires_at)
      );
    `,
  },
];
