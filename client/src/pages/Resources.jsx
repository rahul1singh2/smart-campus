import { useEffect, useState } from 'react'; import { Users, MapPin, Presentation, FlaskConical, Trophy, Camera, BookOpen } from 'lucide-react';
import { api } from '../api.js'; import { useAuth } from '../auth.jsx'; import { Page, Modal, Badge, Err, Label, field, btnP, btnG } from '../ui.jsx';
const ICON = { hall: Presentation, lab: FlaskConical, sports: Trophy, camera: Camera, study: BookOpen }, TYPES = ['all', 'hall', 'lab', 'study', 'sports', 'camera'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
export default function Resources() {
  const [list, setList] = useState([]), [type, setType] = useState('all'), [sel, setSel] = useState(null), [ok, setOk] = useState('');
  useEffect(() => { api('/resources').then(setList); }, []);
  return <Page title="Venues & equipment" sub="Pick a resource, choose a slot, send the request">
    {ok && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">{ok}</p>}
    <div className="mb-4 flex flex-wrap gap-2">{TYPES.map(t => <button key={t} onClick={() => setType(t)} className={`rounded-full px-3.5 py-1.5 text-sm capitalize ${type === t ? 'bg-ink text-white' : 'bg-white border border-slate-300 hover:bg-slate-50'}`}>{t}</button>)}</div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.filter(r => type === 'all' || r.type === type).map(r => { const I = ICON[r.type];
      return <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-3 flex items-center justify-between"><span className="rounded-lg bg-teal-50 p-2 text-teal-700"><I size={20} /></span><Badge s={r.status} /></div>
        <h3 className="font-semibold text-ink">{r.name}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={13} />{r.location}</p>
        <p className="flex items-center gap-1.5 text-sm text-slate-500"><Users size={13} />Capacity {r.capacity}</p>
        <button className={btnP + ' mt-4 w-full'} disabled={r.status !== 'available'} onClick={() => setSel(r)}>Check slots & book</button></article>; })}</div>
    {sel && <Booker res={sel} onClose={() => setSel(null)} onDone={m => { setSel(null); setOk(m); }} />}</Page>;
}
function Booker({ res, onClose, onDone }) {
  const { user } = useAuth(), [date, setDate] = useState(() => new Date().toLocaleDateString('sv-SE')), [busy, setBusy] = useState([]);
  const [start, setStart] = useState(9), [end, setEnd] = useState(10), [purpose, setPurpose] = useState(''), [err, setErr] = useState('');
  const day0 = +new Date(date + 'T00:00:00'), iso = h => new Date(day0 + h * 36e5).toISOString();
  const load = () => api(`/resources/${res.id}/bookings?from=${encodeURIComponent(iso(0))}&to=${encodeURIComponent(iso(24))}`).then(setBusy);
  useEffect(() => { load(); }, [date]);
  const slot = h => busy.find(b => +new Date(b.start_time) < day0 + (h + 1) * 36e5 && +new Date(b.end_time) > day0 + h * 36e5);
  const clash = HOURS.some(h => h >= start && h < end && slot(h));
  async function submit(e) { e.preventDefault(); setErr(''); try { await api('/bookings', { method: 'POST', body: { resource_id: res.id, start_time: iso(start), end_time: iso(end), purpose } });
    onDone(user.role === 'admin' ? `${res.name} booked and approved.` : `Request sent for ${res.name}. Status: pending approval.`); } catch (x) { setErr(x.message); load(); } }
  return <Modal title={`Book ${res.name}`} onClose={onClose}><form onSubmit={submit} className="space-y-4"><Err m={err} />
    <Label t="Date"><input type="date" className={field} min={new Date().toLocaleDateString('sv-SE')} value={date} onChange={e => setDate(e.target.value)} /></Label>
    <div><p className="mb-1 text-sm font-medium text-slate-700">Availability</p><div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">{HOURS.map(h => { const b = slot(h), sel = h >= start && h < end;
      return <button type="button" key={h} disabled={!!b} title={b ? `${b.status} · ${b.user_name}` : 'Free'} onClick={() => { setStart(h); if (end <= h) setEnd(h + 1); }}
        className={`rounded-lg border py-2 text-xs ${b ? (b.status === 'approved' ? 'border-rose-200 bg-rose-100 text-rose-700' : 'border-amber-200 bg-amber-100 text-amber-800') : sel ? 'border-teal-700 bg-teal-700 text-white' : 'bg-white hover:border-teal-600'}`}>{h}:00</button>; })}</div>
      <p className="mt-1.5 text-xs text-slate-500"><span className="text-rose-600">Red</span> approved, <span className="text-amber-600">amber</span> pending, white is free.</p></div>
    <div className="grid grid-cols-2 gap-3"><Label t="From"><select className={field} value={start} onChange={e => { setStart(+e.target.value); if (end <= +e.target.value) setEnd(+e.target.value + 1); }}>{HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}</select></Label>
      <Label t="To"><select className={field} value={end} onChange={e => setEnd(+e.target.value)}>{HOURS.map(h => h + 1).filter(h => h > start).map(h => <option key={h} value={h}>{h}:00</option>)}</select></Label></div>
    {clash && <Err m="Your selection overlaps a booked slot. Choose free hours." />}
    <Label t="Purpose"><input className={field} value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Club rehearsal" /></Label>
    <div className="flex gap-2"><button type="button" className={btnG} onClick={onClose}>Cancel</button><button className={btnP + ' flex-1'} disabled={clash}>Send booking request</button></div></form></Modal>;
}
