import { getDatabase } from '../config/database.js';

export async function createExamTables() {
  const db = getDatabase();
  
  try {
    // Create exams table
    await db.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        subject_id VARCHAR(36) NOT NULL,
        exam_type ENUM('quiz', 'midterm', 'final', 'assignment', 'other') DEFAULT 'quiz',
        duration_minutes INT NOT NULL DEFAULT 60,
        total_marks DECIMAL(10,2) NOT NULL DEFAULT 100.00,
        passing_marks DECIMAL(10,2) NOT NULL DEFAULT 50.00,
        exam_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        instructions TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_by VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_tenant_subject (tenant_id, subject_id),
        INDEX idx_exam_date (exam_date),
        INDEX idx_created_by (created_by)
      )
    `);
    
    // Create exam_questions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS exam_questions (
        id VARCHAR(36) PRIMARY KEY,
        exam_id VARCHAR(36) NOT NULL,
        question_text TEXT NOT NULL,
        question_type ENUM('multiple_choice', 'true_false', 'short_answer', 'essay') NOT NULL,
        marks DECIMAL(5,2) NOT NULL DEFAULT 1.00,
        order_index INT NOT NULL,
        options JSON, -- For multiple choice questions
        correct_answer TEXT,
        explanation TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
        INDEX idx_exam_order (exam_id, order_index)
      )
    `);
    
    // Create exam_submissions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS exam_submissions (
        id VARCHAR(36) PRIMARY KEY,
        exam_id VARCHAR(36) NOT NULL,
        student_id VARCHAR(36) NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_score DECIMAL(10,2),
        marks_obtained DECIMAL(10,2),
        percentage DECIMAL(5,2),
        status ENUM('not_started', 'in_progress', 'submitted', 'graded') DEFAULT 'not_started',
        time_taken_minutes INT,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_exam_student (exam_id, student_id),
        INDEX idx_student_status (student_id, status),
        INDEX idx_exam_status (exam_id, status)
      )
    `);
    
    // Create exam_answers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS exam_answers (
        id VARCHAR(36) PRIMARY KEY,
        submission_id VARCHAR(36) NOT NULL,
        question_id VARCHAR(36) NOT NULL,
        answer_text TEXT,
        selected_options JSON, -- For multiple choice
        marks_obtained DECIMAL(5,2) DEFAULT 0.00,
        is_correct BOOLEAN DEFAULT FALSE,
        graded_at TIMESTAMP NULL,
        graded_by VARCHAR(36),
        feedback TEXT,
        
        FOREIGN KEY (submission_id) REFERENCES exam_submissions(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE CASCADE,
        FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY unique_submission_question (submission_id, question_id)
      )
    `);
    
    console.log('✓ Exam tables created successfully');
    
  } catch (error) {
    console.error('Error creating exam tables:', error);
    throw error;
  }
}
