const Database = require('better-sqlite3'), fs = require('fs'), path = require('path');
const db = new Database(process.env.DB_FILE || path.join(__dirname, 'campus.db'));
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
if (!db.prepare('SELECT COUNT(*) c FROM users').get().c) require('./seed')(db);
module.exports = db;
