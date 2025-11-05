/**
 * Audit logging utility
 * Records all important actions in the system
 */

const prisma = require('./prisma');

/**
 * Log an audit event
 * @param {string} actor - Username or 'system'
 * @param {string} action - Action type (e.g., 'MESSAGE_POSTED', 'GROUP_CREATED')
 * @param {string} entityType - Optional entity type ('course', 'group', 'message', 'user')
 * @param {string} entityId - Optional entity ID
 * @param {string} detail - Optional detail string
 */
async function logEvent(actor, action, entityType = null, entityId = null, detail = null) {
  try {
    // Prisma doesn't accept null for optional fields, need to omit them instead
    const data = {
      actor,
      action,
    };
    
    if (entityType !== null && entityType !== undefined) {
      data.entityType = entityType;
    }
    
    if (entityId !== null && entityId !== undefined) {
      data.entityId = entityId;
    }
    
    if (detail !== null && detail !== undefined) {
      data.detail = detail;
    }
    
    await prisma.auditLog.create({ data });
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Get recent audit logs
 * @param {number} limit - Number of logs to fetch
 * @returns {Array} Array of audit logs
 */
async function getRecentLogs(limit = 100) {
  try {
    return await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
}

module.exports = { logEvent, getRecentLogs };

