const AuditLog = require("../models/AuditLog");

/**
 * Logs a system action for audit purposes.
 * @param {Object} params - Audit data
 */
const logAction = async ({ actor, action, entityType, entityId, before, after, req }) => {
  try {
    await AuditLog.create({
      actor: actor.id,
      role: actor.role,
      action,
      entityType,
      entityId,
      changes: { before, after },
      ipAddress: req?.ip || req?.headers["x-forwarded-for"] || "internal",
      userAgent: req?.headers["user-agent"] || "system",
    });
  } catch (error) {
    // Audit failures should not crash the main application, but should be logged.
    console.error("CRITICAL: Audit Logging Failed:", error);
  }
};

module.exports = { logAction };
