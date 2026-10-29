const express = require('express'), cors = require('cors'); require('./db');
const app = express(); app.use(cors(), express.json());
app.use('/api/auth', require('./routes/auth'));
['resources', 'events', 'misc'].forEach(n => app.use('/api', require('./routes/' + n)));
app.use((e, q, s, n) => { console.error(e); s.status(500).json({ error: 'Server error' }); });
app.listen(process.env.PORT || 4000, () => console.log('API on http://localhost:4000'));
