const { protect, isAdmin } = require('./auth');

/** Chain protect then isAdmin for admin-only routes */
const requireAdmin = [protect, isAdmin];

module.exports = { requireAdmin };
