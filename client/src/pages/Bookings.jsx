import { useEffect, useState } from 'react'; import { Check, X } from 'lucide-react';
import { api } from '../api.js'; import { useAuth } from '../auth.jsx'; import { Page, Badge, Err, Empty, btnG, fmt } from '../ui.jsx';
export default function Bookings() {
  const { user } = useAuth(), admin = user.role === 'admin', [rows, setRows] = useState([]), [tab, setTab] = useState(admin ? 'pending' : 'all'), [err, setErr] = useState('');
  const load = () => api('/bookings').then(setRows); useEffect(() => { load(); }, []);
  const act = async (fn) => { setErr(''); try { await fn(); await load(); } catch (e) { setErr(e.message); } };
  const shown = rows.filter(r => tab === 'all' || r.status === tab);
  return <Page title={admin ? 'Booking approvals' : 'My bookings'} sub="Pending → Approved or Rejected">
    <div className="mb-4 flex flex-wrap gap-2">{['all', 'pending', 'approved', 'rejected', 'cancelled'].map(t => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3.5 py-1.5 text-sm capitalize ${tab === t ? 'bg-ink text-white' : 'border border-slate-300 bg-white'}`}>{t}</button>)}</div>
    <Err m={err} />{!shown.length ? <Empty>Nothing here. Book a resource from the Resources page.</Empty> :
      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b bg-slate-50 text-slate-500"><tr><th className="p-3">Resource</th>{admin && <th>Requested by</th>}<th>When</th><th>Purpose</th><th>Status</th><th className="pr-3 text-right">Action</th></tr></thead>
        <tbody className="divide-y">{shown.map(b => <tr key={b.id}><td className="p-3 font-medium">{b.resource_name}</td>{admin && <td>{b.user_name}</td>}
          <td>{fmt(b.start_time)} – {fmt(b.end_time, { hour: 'numeric', minute: '2-digit' })}</td><td className="max-w-[180px] truncate">{b.purpose}</td><td><Badge s={b.status} /></td>
          <td className="space-x-1.5 pr-3 text-right">{admin && b.status === 'pending' && <>
            <button className={btnG} onClick={() => act(() => api(`/bookings/${b.id}/status`, { method: 'PATCH', body: { status: 'approved' } }))}><Check size={14} className="text-emerald-600" />Approve</button>
            <button className={btnG} onClick={() => act(() => api(`/bookings/${b.id}/status`, { method: 'PATCH', body: { status: 'rejected' } }))}><X size={14} className="text-rose-600" />Reject</button></>}
            {['pending', 'approved'].includes(b.status) && (b.user_id === user.id) && <button className={btnG} onClick={() => act(() => api(`/bookings/${b.id}`, { method: 'DELETE' }))}>Cancel</button>}</td></tr>)}</tbody></table></div>}</Page>;
}
