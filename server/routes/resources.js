const r = require('express').Router(), db = require('../db'), { auth, role } = require('../auth'), { conflicts, validate } = require('../booking-logic');
r.use(auth);
const STUDENT_TYPES = ['study', 'sports'];
r.get('/resources', (q, s) => s.json(db.prepare('SELECT * FROM resources ORDER BY type,name').all()));
r.post('/resources', role('admin'), (q, s) => {
  const { name, type, capacity, location } = q.body; if (!name || !type) return s.status(400).json({ error: 'Name and type are required' });
  try { const id = db.prepare('INSERT INTO resources(name,type,capacity,location) VALUES (?,?,?,?)').run(name, type, capacity || 1, location || '').lastInsertRowid; s.status(201).json({ id }); }
  catch (e) { s.status(400).json({ error: e.message }); }
});
r.patch('/resources/:id', role('admin'), (q, s) => {
  const { status, capacity } = q.body;
  db.prepare('UPDATE resources SET status=COALESCE(?,status), capacity=COALESCE(?,capacity) WHERE id=?').run(status || null, capacity || null, q.params.id); s.json({ ok: true });
});
// Calendar data for a resource within a window (feeds the slot timeline)
r.get('/resources/:id/bookings', (q, s) => s.json(db.prepare(
  `SELECT b.id,b.start_time,b.end_time,b.status,u.name user_name FROM bookings b JOIN users u ON u.id=b.user_id
   WHERE resource_id=? AND b.status IN ('pending','approved') AND start_time < ? AND end_time > ? ORDER BY start_time`).all(q.params.id, q.query.to, q.query.from)));
r.get('/bookings', (q, s) => {
  const admin = q.user.role === 'admin';
  s.json(db.prepare(`SELECT b.*, r.name resource_name, r.type resource_type, u.name user_name FROM bookings b
    JOIN resources r ON r.id=b.resource_id JOIN users u ON u.id=b.user_id ${admin ? '' : 'WHERE b.user_id=?'} ORDER BY b.start_time DESC`).all(...(admin ? [] : [q.user.id])));
});
r.post('/bookings', (q, s) => {
  const { resource_id, start_time, end_time, purpose } = q.body;
  const res = db.prepare('SELECT * FROM resources WHERE id=?').get(resource_id);
  const bad = validate(res, start_time, end_time); if (bad) return s.status(400).json({ error: bad });
  if (q.user.role === 'student' && !STUDENT_TYPES.includes(res.type)) return s.status(403).json({ error: 'Students can book study rooms and sports facilities. Ask a club organizer to request this one.' });
  const clash = conflicts(res.id, start_time, end_time);
  if (clash.length) return s.status(409).json({ error: `Slot overlaps an existing ${clash[0].status} booking by ${clash[0].user_name}` });
  const id = db.prepare('INSERT INTO bookings(resource_id,user_id,start_time,end_time,purpose,status) VALUES (?,?,?,?,?,?)')
    .run(res.id, q.user.id, start_time, end_time, purpose || '', q.user.role === 'admin' ? 'approved' : 'pending').lastInsertRowid;
  s.status(201).json({ id });
});
r.patch('/bookings/:id/status', role('admin'), (q, s) => {
  const b = db.prepare('SELECT * FROM bookings WHERE id=?').get(q.params.id); const { status } = q.body;
  if (!b) return s.status(404).json({ error: 'Booking not found' });
  if (!['approved', 'rejected'].includes(status)) return s.status(400).json({ error: 'Status must be approved or rejected' });
  if (status === 'approved' && conflicts(b.resource_id, b.start_time, b.end_time, b.id, ['approved']).length) return s.status(409).json({ error: 'Cannot approve: overlaps an approved booking' });
  db.prepare('UPDATE bookings SET status=? WHERE id=?').run(status, b.id); s.json({ ok: true });
});
r.delete('/bookings/:id', (q, s) => { // cancel own booking
  const b = db.prepare('SELECT * FROM bookings WHERE id=?').get(q.params.id);
  if (!b || (b.user_id !== q.user.id && q.user.role !== 'admin')) return s.status(404).json({ error: 'Booking not found' });
  db.prepare("UPDATE bookings SET status='cancelled' WHERE id=?").run(b.id); s.json({ ok: true });
});
module.exports = r;
