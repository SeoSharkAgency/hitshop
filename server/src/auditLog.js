const AuditLog = require('./models/AuditLog');
const { Admin } = require('./models');

async function logAction(req, action, entity, entityId = null, details = null) {
  try {
    let username = null;
    if (req.adminId) {
      const admin = await Admin.findByPk(req.adminId, { attributes: ['username'] });
      username = admin?.username || null;
    }

    await AuditLog.create({
      adminId: req.adminId || null,
      adminUsername: username,
      action,
      entity,
      entityId,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      ip: req.ip || req.connection?.remoteAddress || null,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { logAction };
