const r = require('express').Router(), bcrypt = require('bcryptjs'), db = require('../db'), { sign, auth } = require('../auth');
r.post('/login', (q, s) => {
  const u = db.prepare('SELECT * FROM users WHERE email=?').get((q.body.email || '').toLowerCase());
  if (!u || !bcrypt.compareSync(q.body.password || '', u.password_hash)) return s.status(401).json({ error: 'Wrong email or password' });
  const { password_hash, ...safe } = u; s.json({ token: sign(u), user: safe });
});
r.post('/register', (q, s) => { // self-signup is always a student
  const { name, email, password, department } = q.body;
  if (!name || !email || (password || '').length < 6) return s.status(400).json({ error: 'Name, email and a 6+ character password are required' });
  try {
    const id = db.prepare('INSERT INTO users(name,email,password_hash,role,department) VALUES (?,?,?,?,?)').run(name, email.toLowerCase(), bcrypt.hashSync(password, 8), 'student', department || '').lastInsertRowid;
    const u = db.prepare('SELECT id,name,email,role,department FROM users WHERE id=?').get(id); s.json({ token: sign(u), user: u });
  } catch { s.status(409).json({ error: 'That email is already registered' }); }
});
r.get('/me', auth, (q, s) => s.json(db.prepare('SELECT id,name,email,role,department FROM users WHERE id=?').get(q.user.id)));
module.exports = r;
