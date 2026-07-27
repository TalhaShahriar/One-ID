import { prisma } from '../prisma.js';

/**
 * Creates an immutable record in the security audit log.
 * @param {number|null} userId - The identifier of the action's associated user.
 * @param {string} eventType - The action category of the audit log event.
 * @param {string} description - High-level description of what transpired.
 * @param {string|null} ipAddress - Client IP coordinates.
 * @param {number|null} electionId - Associated election identifier.
 * @returns {Promise<object>} The newly created AuditLog record.
 */
export async function logEvent(userId, eventType, description, ipAddress, electionId = null) {
  try {
    return await prisma.auditLog.create({
      data: {
        user_id: userId ? parseInt(userId, 10) : null,
        event_type: eventType,
        description,
        ip_address: ipAddress,
        election_id: electionId ? parseInt(electionId, 10) : null
      }
    });
  } catch (error) {
    console.error('❌ Logger failed to record safety transaction event:', error);
  }
}
export default logEvent;
