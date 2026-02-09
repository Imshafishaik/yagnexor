import { initializeDatabase } from './src/config/database.js';
import { createClassScheduleTables } from './src/migrations/class-schedule-schema.js';

async function main() {
  try {
    // Initialize database first
    await initializeDatabase();
    console.log('Database initialized');
    
    // Create class schedule tables
    await createClassScheduleTables();
    console.log('Class schedule tables created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
