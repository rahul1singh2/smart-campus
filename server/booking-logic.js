const db = require('./db');
// Overlap rule: existing.start < new.end AND existing.end > new.start (same resource)
exports.conflicts = (resourceId, start, end, excludeId = 0, statuses = ['pending', 'approved']) =>
  db.prepare(`SELECT b.*, u.name user_name FROM bookings b JOIN users u ON u.id=b.user_id
    WHERE b.resource_id=? AND b.id!=? AND b.status IN (${statuses.map(() => '?').join()})
    AND b.start_time < ? AND b.end_time > ?`).all(resourceId, excludeId, ...statuses, end, start);
exports.validate = (resource, start, end) => {
  if (!resource) return 'Resource not found';
  if (resource.status !== 'available') return `${resource.name} is under maintenance`;
  if (!start || !end || isNaN(new Date(start)) || isNaN(new Date(end))) return 'Invalid time range';
  if (new Date(end) <= new Date(start)) return 'End time must be after start time';
  if (new Date(start) < new Date()) return 'Start time is in the past';
  return null;
};
