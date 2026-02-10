import { initializeDatabase, getDatabase } from './src/config/database.js';

async function checkTables() {
  try {
    await initializeDatabase();
    const db = getDatabase();
    const [tables] = await db.query('SHOW TABLES');
    console.log('Tables in database:');
    tables.forEach(table => {
      console.log('-', Object.values(table)[0]);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();
