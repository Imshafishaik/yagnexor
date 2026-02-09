import { initializeDatabase, getDatabase } from './src/config/database.js';

async function updateSubjectContentTables() {
  try {
    // Initialize database first
    await initializeDatabase();
    console.log('Database initialized');
    
    const db = getDatabase();
    console.log('Updating subject_content tables...');
    
    // Increase file_type column size from VARCHAR(50) to VARCHAR(100)
    await db.query(`
      ALTER TABLE subject_contents 
      MODIFY COLUMN file_type VARCHAR(100) NOT NULL
    `);
    
    console.log('✓ file_type column updated to VARCHAR(100)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating subject content tables:', error);
    process.exit(1);
  }
}

updateSubjectContentTables();
