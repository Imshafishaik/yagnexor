export function buildTenantQuery(baseQuery, tenantId, tableAlias = '') {
  const tenantField = tableAlias ? `${tableAlias}.tenant_id` : 'tenant_id';
  return `${baseQuery} AND ${tenantField} = ${tenantId}`;
}

export async function validateTenantResourceAccess(db, tableName, resourceId, tenantId) {
  try {
    const [rows] = await db.query(`SELECT id FROM ${tableName} WHERE id = ? AND tenant_id = ?`, [resourceId, tenantId]);
    return rows.length > 0;
  } catch (error) {
    console.error('Error validating tenant resource access:', error);
    return false;
  }
}
