PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('student','organizer','admin')), department TEXT);
CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hall','lab','sports','camera','study')),
  capacity INTEGER DEFAULT 1, location TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','maintenance')));
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_id INTEGER NOT NULL REFERENCES resources(id), user_id INTEGER NOT NULL REFERENCES users(id),
  start_time TEXT NOT NULL, end_time TEXT NOT NULL, purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, CHECK (end_time > start_time));
CREATE INDEX IF NOT EXISTS idx_bookings_overlap ON bookings(resource_id, start_time, end_time);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT,
  date TEXT NOT NULL, end_date TEXT NOT NULL,
  venue_id INTEGER NOT NULL REFERENCES resources(id), venue TEXT NOT NULL,
  organizer_id INTEGER NOT NULL REFERENCES users(id), capacity INTEGER DEFAULT 100,
  booking_id INTEGER REFERENCES bookings(id));
CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id), user_id INTEGER NOT NULL REFERENCES users(id),
  qr_code_token TEXT NOT NULL UNIQUE, checked_in INTEGER NOT NULL DEFAULT 0, checked_in_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE (event_id, user_id));
