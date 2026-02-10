import { initializeDatabase, getDatabase } from './src/config/database.js';

async function addScheduleDateColumn() {
  try {
    // Initialize database first
    await initializeDatabase();
    console.log('Database initialized');
    
    const db = getDatabase();
    console.log('Adding schedule_date column to class_schedules table...');
    
    // Add schedule_date column to existing table
    await db.query(`
      ALTER TABLE class_schedules 
      ADD COLUMN schedule_date DATE,
      DROP FOREIGN KEY class_schedules_ibfk_3,
      ADD CONSTRAINT chk_schedule_type CHECK (
        (day_of_week IS NOT NULL AND schedule_date IS NULL) OR 
        (day_of_week IS NULL AND schedule_date IS NOT NULL)
      )
    `);
    
    console.log('✓ schedule_date column added successfully');
    console.log('✓ Schedule type constraint added');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_COLUMN_EXISTS') {
      console.log('✓ schedule_date column already exists');
    } else if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.log('✓ Constraint already exists or handled differently');
    } else {
      console.error('Error adding schedule_date column:', error);
      throw error;
    }
  }
}

// Run the migration
addScheduleDateColumn()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
