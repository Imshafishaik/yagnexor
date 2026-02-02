import { getDatabase } from './src/config/database.js';

async function fixCoursesTable() {
  try {
    const db = getDatabase();
    console.log('Database connected');
    
    // Check existing columns
    const [columns] = await db.query('SHOW COLUMNS FROM courses');
    console.log('Existing columns:', columns.map(col => col.Field));
    
    // Add missing columns
    const existingColumns = columns.map(col => col.Field);
    
    if (!existingColumns.includes('department_id')) {
      await db.query('ALTER TABLE courses ADD COLUMN department_id VARCHAR(36)');
      console.log('✓ Added department_id column');
    }
    
    if (!existingColumns.includes('is_active')) {
      await db.query('ALTER TABLE courses ADD COLUMN is_active BOOLEAN DEFAULT 1');
      console.log('✓ Added is_active column');
    }
    
    if (!existingColumns.includes('current_enrollments')) {
      await db.query('ALTER TABLE courses ADD COLUMN current_enrollments INT DEFAULT 0');
      console.log('✓ Added current_enrollments column');
    }
    
    console.log('✅ Courses table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing courses table:', error);
  }
}

// Run the fix
fixCoursesTable();
