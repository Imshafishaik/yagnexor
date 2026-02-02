import { initializeDatabase } from './src/config/database.js';
import { createSubjectContentTables } from './src/migrations/subject-content-schema.js';

async function main() {
  try {
    // Initialize database first
    await initializeDatabase();
    console.log('Database initialized');
    
    // Create subject content tables
    await createSubjectContentTables();
    console.log('Subject content tables created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
