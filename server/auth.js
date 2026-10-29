const jwt = require('jsonwebtoken'); const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
exports.sign = (u) => jwt.sign({ id: u.id, role: u.role, name: u.name }, SECRET, { expiresIn: '8h' });
exports.auth = (req, res, next) => { try { req.user = jwt.verify((req.headers.authorization || '').slice(7), SECRET); next(); } catch { res.status(401).json({ error: 'Please sign in again' }); } };
exports.role = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Your role cannot do this' });
