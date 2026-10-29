import { useEffect, useState } from 'react'; import { QRCodeSVG } from 'qrcode.react'; import { Plus, MapPin, Clock, Copy, CheckCircle2 } from 'lucide-react';
import { api } from '../api.js'; import { useAuth } from '../auth.jsx'; import { Page, Modal, Badge, Err, Label, Empty, field, btnP, btnG, fmt } from '../ui.jsx';
export const Pass = ({ ev, token, name }) => <div className="text-center"><div className="mx-auto w-fit rounded-xl border bg-white p-4"><QRCodeSVG value={token} size={176} /></div>
  <p className="mt-3 font-semibold text-ink">{ev.title}</p><p className="text-sm text-slate-500">{fmt(ev.date)} · {ev.venue}</p>{name && <p className="text-sm">{name}</p>}
  <button className={btnG + ' mt-3'} onClick={() => navigator.clipboard?.writeText(token)}><Copy size={14} />Copy pass code</button>
  <p className="mt-2 break-all font-mono text-xs text-slate-400">{token}</p></div>;
export function EventsPage() {
  const { user } = useAuth(), [list, setList] = useState([]), [pass, setPass] = useState(null), [create, setCreate] = useState(false), [err, setErr] = useState('');
  const load = () => api('/events').then(setList); useEffect(() => { load(); }, []);
  async function reg(e) { setErr(''); try { const { qr_code_token } = await api(`/events/${e.id}/register`, { method: 'POST' }); await load(); setPass({ ev: e, token: qr_code_token }); } catch (x) { setErr(x.message); } }
  return <Page title="Campus events" sub="Register to get a QR pass" action={['organizer', 'admin'].includes(user.role) && <button className={btnP} onClick={() => setCreate(true)}><Plus size={16} />New event</button>}>
    <Err m={err} />{!list.length && <Empty>No events yet.</Empty>}
    <div className="mt-3 grid gap-4 md:grid-cols-2">{list.map(e => { const full = e.registered >= e.capacity, pct = Math.min(100, e.registered / e.capacity * 100);
      return <article key={e.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-2"><h3 className="text-lg font-semibold text-ink">{e.title}</h3>{e.booking_status !== 'approved' && <Badge s={e.booking_status} />}</div>
        <p className="mt-1 text-sm text-slate-600">{e.description}</p>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500"><Clock size={14} />{fmt(e.date)}</p><p className="flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} />{e.venue} · by {e.organizer_name}</p>
        <div className="mt-3 h-1.5 rounded bg-slate-100"><div className="h-full rounded bg-teal-600" style={{ width: pct + '%' }} /></div><p className="mt-1 text-xs text-slate-500">{e.registered}/{e.capacity} seats taken</p>
        <div className="mt-auto pt-4">{e.my_token ? <button className={btnG} onClick={() => setPass({ ev: e, token: e.my_token })}><CheckCircle2 size={16} className="text-emerald-600" />View my pass</button>
          : <button className={btnP} disabled={full || e.booking_status !== 'approved'} onClick={() => reg(e)}>{full ? 'Event full' : e.booking_status !== 'approved' ? 'Awaiting venue approval' : 'Register'}</button>}</div></article>; })}</div>
    {pass && <Modal title="Your event pass" onClose={() => setPass(null)}><Pass {...pass} name={user.name} /></Modal>}
    {create && <CreateEvent onClose={() => setCreate(false)} onDone={() => { setCreate(false); load(); }} />}</Page>;
}
function CreateEvent({ onClose, onDone }) {
  const [venues, setVenues] = useState([]), [f, setF] = useState({ title: '', description: '', date: '', end_date: '', venue_id: '', capacity: '' }), [err, setErr] = useState('');
  useEffect(() => { api('/resources').then(r => { const v = r.filter(x => ['hall', 'lab', 'sports'].includes(x.type) && x.status === 'available'); setVenues(v); setF(p => ({ ...p, venue_id: v[0]?.id })); }); }, []);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  async function submit(e) { e.preventDefault(); setErr(''); try { await api('/events', { method: 'POST', body: { ...f, venue_id: +f.venue_id, capacity: +f.capacity || undefined, date: new Date(f.date).toISOString(), end_date: new Date(f.end_date).toISOString() } }); onDone(); } catch (x) { setErr(x.message); } }
  return <Modal title="Create event" onClose={onClose}><form onSubmit={submit} className="space-y-3"><Err m={err} />
    <Label t="Title"><input className={field} required value={f.title} onChange={set('title')} /></Label>
    <Label t="Description"><textarea className={field} rows={2} value={f.description} onChange={set('description')} /></Label>
    <Label t="Venue"><select className={field} value={f.venue_id} onChange={set('venue_id')}>{venues.map(v => <option key={v.id} value={v.id}>{v.name} (seats {v.capacity})</option>)}</select></Label>
    <div className="grid grid-cols-2 gap-3"><Label t="Starts"><input type="datetime-local" required className={field} value={f.date} onChange={set('date')} /></Label>
      <Label t="Ends"><input type="datetime-local" required className={field} value={f.end_date} onChange={set('end_date')} /></Label></div>
    <Label t="Seat limit (optional)"><input type="number" min="1" className={field} value={f.capacity} onChange={set('capacity')} /></Label>
    <p className="text-xs text-slate-500">The venue booking is sent for admin approval. Registration opens once it is approved.</p>
    <button className={btnP + ' w-full'}>Create event</button></form></Modal>;
}
export function TicketsPage() {
  const { user } = useAuth(), [list, setList] = useState([]), [pass, setPass] = useState(null);
  useEffect(() => { const l = () => api('/registrations/mine').then(setList); l(); const t = setInterval(l, 4000); return () => clearInterval(t); }, []); // polls so check-in shows live
  return <Page title="My tickets" sub="Show the QR code at the entrance">{!list.length && <Empty>No tickets yet. Register for an event to get your pass.</Empty>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map(g => <button key={g.id} onClick={() => setPass({ ev: g, token: g.qr_code_token })} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-teal-600">
      <div className="mb-3 flex justify-center"><QRCodeSVG value={g.qr_code_token} size={110} /></div><p className="font-semibold text-ink">{g.title}</p>
      <p className="mb-2 text-sm text-slate-500">{fmt(g.date)}</p><Badge s={g.checked_in ? 'checked in' : 'registered'} /></button>)}</div>
    {pass && <Modal title="Event pass" onClose={() => setPass(null)}><Pass {...pass} name={user.name} /></Modal>}</Page>;
}
