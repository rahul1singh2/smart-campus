# Smart Campus: Resource & Event Management

React (Vite) + Tailwind + Lucide frontend, Node/Express REST API, SQLite relational DB (better-sqlite3).

## Run
```bash
npm run install:all   # installs root, server and client deps
npm run dev           # API on :4000, web on :5173
npm run seed          # optional: reset the DB with fresh demo data
```
The DB (`server/db/campus.db`) is created and seeded automatically on first start. Needs Node 18+.

## Demo accounts (password `password123`)
| Role | Email |
|---|---|
| Student | student@campus.edu (or kabir@campus.edu) |
| Organizer | organizer@campus.edu |
| Admin | admin@campus.edu |

## 2-minute test flow
1. **Student**: Resources → book Study Room 1 for a free hour → Bookings shows *pending*. Try the same slot again to see the conflict block. Events → Register → copy the pass code.
2. **Organizer**: Check-in → paste the code → attendee flips to checked in (list refreshes every 3s). Events → New event books a venue (pending).
3. **Admin**: Bookings → Approve/Reject (approval re-checks conflicts). Admin → change roles / set a resource to maintenance. Dashboard shows analytics.
4. **Chat bubble** (bottom right): "What events are coming up?", "hall rules", "how do I cancel".

## Structure
```
server/  index.js, auth.js (JWT + RBAC), booking-logic.js (overlap engine)
         db/schema.sql, db/seed.js, db/index.js
         routes/ auth.js, resources.js (resources+bookings), events.js (events, registrations, check-in), misc.js (analytics, users, chat)
client/  src/App.jsx (shell + role nav), auth.jsx, api.js, ui.jsx
         pages/ Login, Dashboard, Events (+tickets), Resources (slot booker), Bookings, Scanner, Admin
         components/ChatWidget.jsx
```

## Key rules
- Overlap check: `existing.start < new.end AND existing.end > new.start` on pending+approved bookings; approval re-checks against approved ones.
- Students book study/sports only; organizers/faculty book everything; admin bookings auto-approve.
- Events create a linked venue booking; registration opens when it is approved. Capacity and one-pass-per-user are enforced.
- Passes carry a random `qr_code_token`; only the event's organizer (or admin) can check it in.
- Chat is keyword retrieval over guidelines + live event data (`routes/misc.js`). Replace `/chat` with an LLM call using the same context for production. Set `JWT_SECRET` before deploying.
