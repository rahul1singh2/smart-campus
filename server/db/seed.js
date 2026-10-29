const bcrypt = require('bcryptjs'), crypto = require('crypto');
const at = (d, h) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x.toISOString(); };
module.exports = (db) => {
  const pw = bcrypt.hashSync('password123', 8);
  const U = db.prepare('INSERT INTO users(name,email,password_hash,role,department) VALUES (?,?,?,?,?)');
  [['Dr. Asha Rao','admin@campus.edu','admin','Administration'],['Rohan Mehta','organizer@campus.edu','organizer','Computer Science'],
   ['Priya Sharma','student@campus.edu','student','Electronics'],['Kabir Singh','kabir@campus.edu','student','Mechanical']]
    .forEach(([n,e,r,d]) => U.run(n,e,pw,r,d));
  const R = db.prepare('INSERT INTO resources(name,type,capacity,location) VALUES (?,?,?,?)');
  [['Main Seminar Hall','hall',300,'Block A'],['Mini Auditorium','hall',120,'Block B'],['AI Research Lab','lab',40,'Block C'],
   ['Central Library Study Room 1','study',8,'Library'],['Central Library Study Room 2','study',8,'Library'],
   ['Basketball Court','sports',20,'Sports Complex'],['Badminton Court','sports',4,'Sports Complex'],['Canon DSLR Kit','camera',1,'Media Cell']]
    .forEach(r => R.run(...r));
  const B = db.prepare('INSERT INTO bookings(resource_id,user_id,start_time,end_time,purpose,status) VALUES (?,?,?,?,?,?)');
  for (let d = -6; d <= -1; d++) for (let r = 1; r <= 8; r++) { // past history for analytics
    if ((d + r) % 3 === 0) continue;
    const s = 9 + ((d + r + 12) % 4) * 2;
    B.run(r, 2 + (r % 3), at(d, s), at(d, s + 2 + ((d + r + 12) % 3)), 'Past booking', 'approved');
  }
  B.run(4, 3, at(0, 14), at(0, 16), 'Exam prep group', 'approved');
  B.run(6, 4, at(1, 17), at(1, 19), 'Friendly match', 'pending');
  B.run(8, 3, at(1, 10), at(1, 12), 'Photography club shoot', 'pending');
  const E = db.prepare('INSERT INTO events(title,description,date,end_date,venue_id,venue,organizer_id,capacity,booking_id) VALUES (?,?,?,?,?,?,?,?,?)');
  [['HackSprint 2026','12-hour campus hackathon with mentors from industry.',1,10,16,3,'AI Research Lab',40],
   ['Intro to Generative AI','Seminar on LLMs and responsible AI.',2,11,13,1,'Main Seminar Hall',300],
   ['Inter-Dept Basketball Finals','Championship finals - bring your department colours.',3,16,19,6,'Basketball Court',20],
   ['Cultural Night','Music, dance and drama performances.',5,18,21,2,'Mini Auditorium',120]]
    .forEach(([t,desc,d,h1,h2,vid,vn,cap]) => {
      const b = B.run(vid, 2, at(d,h1), at(d,h2), t, 'approved').lastInsertRowid;
      E.run(t, desc, at(d,h1), at(d,h2), vid, vn, 2, cap, b);
    });
  const Rg = db.prepare('INSERT INTO registrations(event_id,user_id,qr_code_token) VALUES (?,?,?)');
  [[1,3],[1,4],[2,3],[3,4]].forEach(([e,u]) => Rg.run(e, u, crypto.randomBytes(12).toString('hex')));
};
