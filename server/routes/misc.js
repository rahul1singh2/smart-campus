const r = require('express').Router(), db = require('../db'), { auth, role } = require('../auth');
r.use(auth);
r.get('/analytics', (q, s) => {
  const rows = db.prepare("SELECT b.*, r.name rname FROM bookings b JOIN resources r ON r.id=b.resource_id WHERE b.status='approved'").all();
  const nRes = db.prepare("SELECT COUNT(*) c FROM resources WHERE status='available'").get().c || 1;
  const overlapH = (b, a, z) => Math.max(0, Math.min(+new Date(b.end_time), z) - Math.max(+new Date(b.start_time), a)) / 36e5;
  const utilization = []; // 8:00-20:00 operating window, 4 days back to 2 ahead
  for (let d = -4; d <= 2; d++) {
    const day = new Date(); day.setDate(day.getDate() + d);
    const a = new Date(day).setHours(8, 0, 0, 0), z = new Date(day).setHours(20, 0, 0, 0);
    const hrs = rows.reduce((t, b) => t + overlapH(b, a, z), 0);
    utilization.push({ day: day.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }), rate: Math.min(100, Math.round(hrs / (nRes * 12) * 100)) });
  }
  const per = {}; rows.forEach(b => per[b.rname] = (per[b.rname] || 0) + (+new Date(b.end_time) - +new Date(b.start_time)) / 36e5);
  const byResource = Object.entries(per).map(([name, hours]) => ({ name, hours: +hours.toFixed(1) })).sort((a, b) => b.hours - a.hours).slice(0, 6);
  const now = new Date().toISOString(), c = (sql, ...p) => db.prepare(sql).get(...p).c;
  s.json({
    utilization, byResource,
    stats: { upcomingEvents: c('SELECT COUNT(*) c FROM events WHERE date>?', now), registrations: c('SELECT COUNT(*) c FROM registrations'),
      checkedIn: c('SELECT COUNT(*) c FROM registrations WHERE checked_in=1'), pendingBookings: c("SELECT COUNT(*) c FROM bookings WHERE status='pending'") },
    upcoming: db.prepare(`SELECT e.id,e.title,e.date,e.venue,(SELECT COUNT(*) FROM registrations WHERE event_id=e.id) registered,e.capacity FROM events e
      JOIN bookings b ON b.id=e.booking_id WHERE e.date>? AND b.status='approved' ORDER BY e.date LIMIT 5`).all(now)
  });
});
r.get('/users', role('admin'), (q, s) => s.json(db.prepare('SELECT id,name,email,role,department FROM users ORDER BY role,name').all()));
r.patch('/users/:id/role', role('admin'), (q, s) => {
  if (!['student', 'organizer', 'admin'].includes(q.body.role)) return s.status(400).json({ error: 'Invalid role' });
  if (+q.params.id === q.user.id) return s.status(400).json({ error: 'You cannot change your own role' });
  db.prepare('UPDATE users SET role=? WHERE id=?').run(q.body.role, q.params.id); s.json({ ok: true });
});
// AI campus assistant: retrieval over guidelines + live event data. Swap for an LLM call in production.
const KB = [
  { k: ['library', 'study room', 'quiet'], a: 'Library study rooms seat up to 8 and can be booked in 1-3 hour slots between 8:00 and 20:00. Keep conversation low and leave the room tidy.' },
  { k: ['book', 'booking', 'reserve', 'slot'], a: 'Open Resources, pick a facility and a time on the timeline, then send the request. Bookings start as Pending and move to Approved or Rejected after admin review. Overlapping slots are blocked automatically.' },
  { k: ['cancel'], a: 'You can cancel your own booking from My Bookings. Please cancel at least 2 hours ahead so others can use the slot.' },
  { k: ['hall', 'seminar', 'auditorium'], a: 'Seminar halls and the auditorium are requested by club organizers or faculty. Food and drinks are not allowed inside, and the hall must be vacated 15 minutes after the slot ends.' },
  { k: ['camera', 'dslr', 'equipment'], a: 'Camera kits are issued to organizers for approved shoots. Collect and return them at the Media Cell with your campus ID; late returns pause borrowing for a week.' },
  { k: ['sport', 'court', 'basketball', 'badminton', 'gym'], a: 'Sports courts open 6:00-20:00. Non-marking shoes are required. Students can book courts directly; scheduled tournaments get priority.' },
  { k: ['ticket', 'qr', 'pass', 'check-in', 'checkin', 'entry'], a: 'After registering, find your pass in My Tickets. Show the QR code at the entrance and an organizer will scan it to mark your attendance.' },
  { k: ['register', 'registration', 'sign up'], a: 'Go to Events, choose an event and tap Register. Your digital pass is created instantly if seats remain.' },
  { k: ['wifi', 'internet'], a: 'Connect to "Campus-Secure" with your student email and password. Guests can request a 24-hour voucher at the IT help desk.' },
  { k: ['rule', 'guideline', 'conduct', 'id card'], a: 'Carry your campus ID at all times, respect booked slots, and report damage to facilities immediately. Repeated no-shows can limit your booking rights.' },
];
r.post('/chat', (q, s) => {
  const m = (q.body.message || '').toLowerCase(), out = [];
  const hit = KB.map(e => ({ e, n: e.k.filter(k => m.includes(k)).length })).filter(x => x.n).sort((a, b) => b.n - a.n)[0];
  if (hit) out.push(hit.e.a);
  if (/event|happening|schedule|upcoming|fest|workshop|hackathon|what's on/.test(m)) {
    const ev = db.prepare(`SELECT e.title,e.date,e.venue FROM events e JOIN bookings b ON b.id=e.booking_id WHERE e.date>? AND b.status='approved' ORDER BY e.date LIMIT 4`).all(new Date().toISOString());
    out.push(ev.length ? 'Upcoming events: ' + ev.map(e => `${e.title} (${new Date(e.date).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}, ${e.venue})`).join('; ') + '.' : 'No upcoming events are scheduled yet.');
  }
  s.json({ reply: out.join('\n\n') || 'I can help with bookings, events, tickets, venue rules and campus services. Try: "How do I book a study room?" or "What events are coming up?"' });
});
module.exports = r;
