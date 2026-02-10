import { initializeDatabase, getDatabase } from './src/config/database.js';
import { createExamTables } from './src/migrations/exam-schema.js';

async function setupExamTables() {
  try {
    // Initialize database first
    await initializeDatabase();
    console.log('Database initialized');
    
    // Create exam tables
    await createExamTables();
    console.log('✓ Exam tables setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up exam tables:', error);
    throw error;
  }
}

// Run the setup
setupExamTables()
  .then(() => {
    console.log('Exam tables migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
