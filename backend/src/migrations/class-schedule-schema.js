import { getDatabase } from '../config/database.js';

export async function createClassScheduleTables() {
  const db = getDatabase();
  
  try {
    // Create class_schedules table
    await db.query(`
      CREATE TABLE IF NOT EXISTS class_schedules (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        class_id VARCHAR(36) NOT NULL,
        subject_id VARCHAR(36) NOT NULL,
        teacher_id VARCHAR(36) NOT NULL,
        day_of_week ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        room_number VARCHAR(50),
        semester VARCHAR(50),
        academic_year VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_schedule_tenant (tenant_id),
        INDEX idx_schedule_class (class_id),
        INDEX idx_schedule_subject (subject_id),
        INDEX idx_schedule_teacher (teacher_id),
        INDEX idx_schedule_day_time (day_of_week, start_time),
        UNIQUE KEY unique_schedule_time (class_id, subject_id, day_of_week, start_time, end_time)
      )
    `);

    // Create schedule_exceptions table for holidays, special events, etc.
    await db.query(`
      CREATE TABLE IF NOT EXISTS schedule_exceptions (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        schedule_id VARCHAR(36) NOT NULL,
        exception_date DATE NOT NULL,
        exception_type ENUM('HOLIDAY', 'CANCELLED', 'RESCHEDULED', 'SPECIAL_EVENT') NOT NULL,
        new_date DATE,
        new_start_time TIME,
        new_end_time TIME,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (schedule_id) REFERENCES class_schedules(id) ON DELETE CASCADE,
        
        INDEX idx_exception_tenant (tenant_id),
        INDEX idx_exception_schedule (schedule_id),
        INDEX idx_exception_date (exception_date)
      )
    `);

    // Create weekly_schedule_templates table for reusable weekly patterns
    await db.query(`
      CREATE TABLE IF NOT EXISTS weekly_schedule_templates (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        template_name VARCHAR(100) NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT FALSE,
        created_by VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_template_tenant (tenant_id),
        INDEX idx_template_creator (created_by)
      )
    `);

    // Create template_schedule_items table for template items
    await db.query(`
      CREATE TABLE IF NOT EXISTS template_schedule_items (
        id VARCHAR(36) PRIMARY KEY,
        template_id VARCHAR(36) NOT NULL,
        subject_id VARCHAR(36) NOT NULL,
        teacher_id VARCHAR(36) NOT NULL,
        day_of_week ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        room_number VARCHAR(50),
        notes TEXT,
        
        FOREIGN KEY (template_id) REFERENCES weekly_schedule_templates(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_template_item_template (template_id),
        INDEX idx_template_item_subject (subject_id),
        INDEX idx_template_item_teacher (teacher_id)
      )
    `);

    console.log('Class schedule tables created successfully');
  } catch (error) {
    console.error('Error creating class schedule tables:', error);
    throw error;
  }
}
