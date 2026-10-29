import { useEffect, useRef, useState } from 'react'; import { ScanLine, Camera, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../api.js'; import { useAuth } from '../auth.jsx'; import { Page, Badge, Empty, field, btnP, btnG, fmt } from '../ui.jsx';
export default function Scanner() {
  const { user } = useAuth(), [events, setEvents] = useState([]), [ev, setEv] = useState(''), [token, setToken] = useState(''), [msg, setMsg] = useState(null), [att, setAtt] = useState([]), [cam, setCam] = useState(false);
  const video = useRef(), last = useRef({ t: '', at: 0 });
  useEffect(() => { api('/events').then(l => { const m = l.filter(e => e.booking_status === 'approved' && (user.role === 'admin' || e.organizer_id === user.id)); setEvents(m); if (m[0]) setEv(String(m[0].id)); }); }, []);
  const refresh = () => ev && api(`/events/${ev}/attendees`).then(setAtt).catch(() => {});
  useEffect(() => { refresh(); const t = setInterval(refresh, 3000); return () => clearInterval(t); }, [ev]);
  async function submit(t) {
    if (!t || (last.current.t === t && Date.now() - last.current.at < 3000)) return; last.current = { t, at: Date.now() };
    try { const r = await api('/checkin', { method: 'POST', body: { token: t } }); setMsg({ ok: true, text: `${r.attendee} checked in to ${r.event}` }); setToken(''); refresh(); } catch (e) { setMsg({ ok: false, text: e.message }); }
  }
  useEffect(() => { // optional camera scanning (Chromium BarcodeDetector); manual entry always works
    if (!cam) return; let stream, timer;
    (async () => { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); video.current.srcObject = stream; await video.current.play();
      const det = new window.BarcodeDetector({ formats: ['qr_code'] }); timer = setInterval(async () => { const c = await det.detect(video.current); if (c[0]) submit(c[0].rawValue); }, 700); })()
      .catch(e => { setMsg({ ok: false, text: 'Camera unavailable: ' + e.message }); setCam(false); });
    return () => { clearInterval(timer); stream?.getTracks().forEach(t => t.stop()); };
  }, [cam]);
  const done = att.filter(a => a.checked_in).length;
  return <Page title="Check-in scanner" sub="Scan or paste a pass code to mark attendance">
    {!events.length ? <Empty>No approved events to check in. Create an event and get its venue approved first.</Empty> : <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <select className={field} value={ev} onChange={e => setEv(e.target.value)} aria-label="Event">{events.map(e => <option key={e.id} value={e.id}>{e.title} · {fmt(e.date)}</option>)}</select>
        <form onSubmit={e => { e.preventDefault(); submit(token.trim()); }} className="flex gap-2"><input className={field} placeholder="Paste pass code" value={token} onChange={e => setToken(e.target.value)} /><button className={btnP}><ScanLine size={16} />Check in</button></form>
        {'BarcodeDetector' in window && <button className={btnG} onClick={() => setCam(c => !c)}><Camera size={16} />{cam ? 'Stop camera' : 'Scan with camera'}</button>}
        {cam && <video ref={video} className="aspect-video w-full rounded-xl bg-black object-cover" muted playsInline />}
        {msg && <p role="status" className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>{msg.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}{msg.text}</p>}</section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-3 flex justify-between"><h2 className="font-semibold text-ink">Attendance</h2><span className="text-sm text-slate-500">{done}/{att.length} checked in</span></div>
        <div className="mb-3 h-1.5 rounded bg-slate-100"><div className="h-full rounded bg-teal-600 transition-all" style={{ width: att.length ? done / att.length * 100 + '%' : 0 }} /></div>
        {!att.length ? <p className="text-sm text-slate-500">No registrations yet.</p> : <ul className="divide-y text-sm">{att.map(a => <li key={a.id} className="flex items-center justify-between py-2.5"><span>{a.name}<span className="block text-xs text-slate-500">{a.department}</span></span><Badge s={a.checked_in ? 'checked in' : 'registered'} /></li>)}</ul>}</section></div>}</Page>;
}
