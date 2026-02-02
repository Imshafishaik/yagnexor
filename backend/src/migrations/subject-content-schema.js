import { getDatabase } from '../config/database.js';

export async function createSubjectContentTables() {
  const db = getDatabase();
  
  try {
    // Create subject_contents table
    await db.query(`
      CREATE TABLE IF NOT EXISTS subject_contents (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        subject_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INT NOT NULL,
        uploaded_by VARCHAR(36) NOT NULL,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_subject_content_tenant (tenant_id),
        INDEX idx_subject_content_subject (subject_id),
        INDEX idx_subject_content_uploader (uploaded_by)
      )
    `);

    // Create student_content_access table to track which students can access which content
    await db.query(`
      CREATE TABLE IF NOT EXISTS student_content_access (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        student_id VARCHAR(36) NOT NULL,
        content_id VARCHAR(36) NOT NULL,
        access_granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (content_id) REFERENCES subject_contents(id) ON DELETE CASCADE,
        
        UNIQUE KEY unique_student_content (student_id, content_id),
        INDEX idx_student_access_student (student_id),
        INDEX idx_student_access_content (content_id)
      )
    `);

    console.log('Subject content tables created successfully');
  } catch (error) {
    console.error('Error creating subject content tables:', error);
    throw error;
  }
}
