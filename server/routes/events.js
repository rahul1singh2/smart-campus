const r = require('express').Router(), crypto = require('crypto'), db = require('../db'), { auth, role } = require('../auth'), { conflicts, validate } = require('../booking-logic');
r.use(auth);
r.get('/events', (q, s) => s.json(db.prepare(
  `SELECT e.*, u.name organizer_name, b.status booking_status,
    (SELECT COUNT(*) FROM registrations WHERE event_id=e.id) registered,
    (SELECT qr_code_token FROM registrations WHERE event_id=e.id AND user_id=?) my_token
   FROM events e JOIN users u ON u.id=e.organizer_id LEFT JOIN bookings b ON b.id=e.booking_id
   WHERE b.status IN ('pending','approved') OR e.organizer_id=? ORDER BY e.date`).all(q.user.id, q.user.id)));
// Creating an event files a venue booking (pending unless admin) through the same conflict engine
r.post('/events', role('organizer', 'admin'), (q, s) => {
  const { title, description, date, end_date, venue_id, capacity } = q.body;
  const res = db.prepare('SELECT * FROM resources WHERE id=?').get(venue_id);
  if (!title) return s.status(400).json({ error: 'Title is required' });
  const bad = validate(res, date, end_date); if (bad) return s.status(400).json({ error: bad });
  if (conflicts(res.id, date, end_date).length) return s.status(409).json({ error: `${res.name} is already booked for that time` });
  const tx = db.transaction(() => {
    const bid = db.prepare('INSERT INTO bookings(resource_id,user_id,start_time,end_time,purpose,status) VALUES (?,?,?,?,?,?)')
      .run(res.id, q.user.id, date, end_date, `Event: ${title}`, q.user.role === 'admin' ? 'approved' : 'pending').lastInsertRowid;
    return db.prepare('INSERT INTO events(title,description,date,end_date,venue_id,venue,organizer_id,capacity,booking_id) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(title, description || '', date, end_date, res.id, res.name, q.user.id, capacity || res.capacity, bid).lastInsertRowid;
  });
  s.status(201).json({ id: tx() });
});
r.post('/events/:id/register', (q, s) => {
  const e = db.prepare('SELECT e.*, b.status bs, (SELECT COUNT(*) FROM registrations WHERE event_id=e.id) n FROM events e LEFT JOIN bookings b ON b.id=e.booking_id WHERE e.id=?').get(q.params.id);
  if (!e) return s.status(404).json({ error: 'Event not found' });
  if (e.bs !== 'approved') return s.status(400).json({ error: 'Registration opens once the venue is approved' });
  if (e.n >= e.capacity) return s.status(409).json({ error: 'This event is full' });
  try {
    const token = crypto.randomBytes(12).toString('hex');
    db.prepare('INSERT INTO registrations(event_id,user_id,qr_code_token) VALUES (?,?,?)').run(e.id, q.user.id, token); s.status(201).json({ qr_code_token: token });
  } catch { s.status(409).json({ error: 'You are already registered' }); }
});
r.get('/registrations/mine', (q, s) => s.json(db.prepare(
  `SELECT g.*, e.title, e.date, e.venue FROM registrations g JOIN events e ON e.id=g.event_id WHERE g.user_id=? ORDER BY e.date`).all(q.user.id)));
const canManage = (u, e) => u.role === 'admin' || e.organizer_id === u.id;
r.get('/events/:id/attendees', role('organizer', 'admin'), (q, s) => {
  const e = db.prepare('SELECT * FROM events WHERE id=?').get(q.params.id);
  if (!e || !canManage(q.user, e)) return s.status(403).json({ error: 'Not your event' });
  s.json(db.prepare(`SELECT g.id,g.checked_in,g.checked_in_at,u.name,u.department FROM registrations g JOIN users u ON u.id=g.user_id WHERE g.event_id=? ORDER BY g.checked_in_at DESC, u.name`).all(e.id));
});
r.post('/checkin', role('organizer', 'admin'), (q, s) => {
  const g = db.prepare(`SELECT g.*, u.name, e.title, e.organizer_id FROM registrations g JOIN users u ON u.id=g.user_id JOIN events e ON e.id=g.event_id WHERE g.qr_code_token=?`).get((q.body.token || '').trim());
  if (!g) return s.status(404).json({ error: 'Invalid pass: no matching registration' });
  if (!canManage(q.user, g)) return s.status(403).json({ error: 'This pass is for an event you do not organize' });
  if (g.checked_in) return s.status(409).json({ error: `${g.name} is already checked in` });
  db.prepare('UPDATE registrations SET checked_in=1, checked_in_at=? WHERE id=?').run(new Date().toISOString(), g.id);
  s.json({ ok: true, attendee: g.name, event: g.title, event_id: g.event_id });
});
module.exports = r;
