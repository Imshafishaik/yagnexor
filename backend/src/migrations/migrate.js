import { getDatabase } from '../config/database.js';
import { migrations } from './schema.js';
import { getOrCreatePermission } from '../core/rbac/rbac-service.js';
import { v4 as uuidv4 } from 'uuid';

export async function runMigrations() {
  const db = getDatabase();

  try {
    console.log('Running migrations...');

    for (const migration of migrations) {
      console.log(`Executing migration: ${migration.name}`);
      const statements = migration.sql.split(';').filter((s) => s.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          await db.query(statement);
        }
      }
    }

    console.log('✓ All migrations completed');
    await seedInitialData();
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function seedInitialData() {
  const db = getDatabase();

  try {
    console.log('Seeding initial data...');

    // Check if test tenant exists
    const [tenants] = await db.query("SELECT id FROM tenants LIMIT 1");

    if (tenants.length === 0) {
      // Create default tenant
      const tenantId = uuidv4();
      await db.query(
        "INSERT INTO tenants (id, name, domain) VALUES (?, ?, ?)",
        [tenantId, 'Test Institution', 'testinst']
      );
      console.log('✓ Default tenant created');
    }

    console.log('✓ Data seeding completed');
  } catch (error) {
    console.error('Seeding failed:', error);
  }
}
