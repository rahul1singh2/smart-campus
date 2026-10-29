import { useEffect, useState } from 'react'; import { Plus } from 'lucide-react';
import { api } from '../api.js'; import { useAuth } from '../auth.jsx'; import { Page, Modal, Err, Label, field, btnP, Badge } from '../ui.jsx';
export default function Admin() {
  const { user } = useAuth(), [tab, setTab] = useState('users'), [users, setUsers] = useState([]), [res, setRes] = useState([]), [add, setAdd] = useState(false), [err, setErr] = useState('');
  const load = () => { api('/users').then(setUsers); api('/resources').then(setRes); }; useEffect(load, []);
  const run = async fn => { setErr(''); try { await fn(); load(); } catch (e) { setErr(e.message); } };
  return <Page title="Administration" sub="Accounts and campus inventory" action={tab === 'inventory' && <button className={btnP} onClick={() => setAdd(true)}><Plus size={16} />Add resource</button>}>
    <div className="mb-4 flex gap-2">{[['users', 'Users'], ['inventory', 'Inventory']].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 text-sm ${tab === k ? 'bg-ink text-white' : 'border border-slate-300 bg-white'}`}>{l}</button>)}</div><Err m={err} />
    <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">{tab === 'users' ?
      <table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b bg-slate-50 text-slate-500"><tr><th className="p-3">Name</th><th>Email</th><th>Department</th><th>Role</th></tr></thead>
        <tbody className="divide-y">{users.map(u => <tr key={u.id}><td className="p-3 font-medium">{u.name}</td><td>{u.email}</td><td>{u.department}</td>
          <td><select className="rounded-lg border border-slate-300 px-2 py-1" disabled={u.id === user.id} value={u.role} onChange={e => run(() => api(`/users/${u.id}/role`, { method: 'PATCH', body: { role: e.target.value } }))}>
            {['student', 'organizer', 'admin'].map(r => <option key={r}>{r}</option>)}</select></td></tr>)}</tbody></table> :
      <table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b bg-slate-50 text-slate-500"><tr><th className="p-3">Resource</th><th>Type</th><th>Location</th><th>Capacity</th><th>Status</th></tr></thead>
        <tbody className="divide-y">{res.map(r => <tr key={r.id}><td className="p-3 font-medium">{r.name}</td><td className="capitalize">{r.type}</td><td>{r.location}</td><td>{r.capacity}</td>
          <td><select className="rounded-lg border border-slate-300 px-2 py-1" value={r.status} onChange={e => run(() => api(`/resources/${r.id}`, { method: 'PATCH', body: { status: e.target.value } }))}><option>available</option><option>maintenance</option></select></td></tr>)}</tbody></table>}</div>
    {add && <AddResource onClose={() => setAdd(false)} onDone={() => { setAdd(false); load(); }} />}</Page>;
}
function AddResource({ onClose, onDone }) {
  const [f, setF] = useState({ name: '', type: 'hall', capacity: 10, location: '' }), [err, setErr] = useState(''), set = k => e => setF({ ...f, [k]: e.target.value });
  return <Modal title="Add resource" onClose={onClose}><form className="space-y-3" onSubmit={async e => { e.preventDefault(); try { await api('/resources', { method: 'POST', body: { ...f, capacity: +f.capacity } }); onDone(); } catch (x) { setErr(x.message); } }}><Err m={err} />
    <Label t="Name"><input required className={field} value={f.name} onChange={set('name')} /></Label>
    <Label t="Type"><select className={field} value={f.type} onChange={set('type')}>{['hall', 'lab', 'study', 'sports', 'camera'].map(t => <option key={t}>{t}</option>)}</select></Label>
    <div className="grid grid-cols-2 gap-3"><Label t="Capacity"><input type="number" min="1" className={field} value={f.capacity} onChange={set('capacity')} /></Label><Label t="Location"><input className={field} value={f.location} onChange={set('location')} /></Label></div>
    <button className={btnP + ' w-full'}>Add resource</button></form></Modal>;
}
