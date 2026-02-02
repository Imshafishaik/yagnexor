import { getDatabase } from './src/config/database.js';

async function addCourseColumns() {
  const db = getDatabase();
  
  try {
    console.log('Adding missing columns to courses table...');
    
    // Add department_id column if it doesn't exist
    try {
      await db.query('ALTER TABLE courses ADD COLUMN department_id VARCHAR(36)');
      console.log('✓ Added department_id column');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.log('⚠ department_id column already exists or error:', error.message);
      }
    }
    
    // Add is_active column if it doesn't exist
    try {
      await db.query('ALTER TABLE courses ADD COLUMN is_active BOOLEAN DEFAULT 1');
      console.log('✓ Added is_active column');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.log('⚠ is_active column already exists or error:', error.message);
      }
    }
    
    // Add current_enrollments column if it doesn't exist
    try {
      await db.query('ALTER TABLE courses ADD COLUMN current_enrollments INT DEFAULT 0');
      console.log('✓ Added current_enrollments column');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.log('⚠ current_enrollments column already exists or error:', error.message);
      }
    }
    
    // Add foreign key constraints if they don't exist
    try {
      await db.query('ALTER TABLE courses ADD FOREIGN KEY (department_id) REFERENCES departments(id)');
      console.log('✓ Added department_id foreign key');
    } catch (error) {
      console.log('⚠ department_id foreign key already exists or error:', error.message);
    }
    
    console.log('✅ Course table columns updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating course table:', error);
  }
}

addCourseColumns().then(() => {
  console.log('Migration completed');
  process.exit(0);
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
