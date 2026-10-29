import { useState } from 'react'; import { useNavigate } from 'react-router-dom'; import { GraduationCap } from 'lucide-react';
import { useAuth } from '../auth.jsx'; import { btnP, field, Err, Label } from '../ui.jsx';
const DEMO = [['Student', 'student@campus.edu'], ['Organizer', 'organizer@campus.edu'], ['Admin', 'admin@campus.edu']];
export default function Login() {
  const { login } = useAuth(), nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '', name: '', department: '' }), [signup, setSignup] = useState(false), [err, setErr] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => { e.preventDefault(); setErr(''); try { await login(signup ? '/auth/register' : '/auth/login', f); nav('/'); } catch (x) { setErr(x.message); } };
  return <div className="grid min-h-screen md:grid-cols-2">
    <div className="hidden flex-col justify-between bg-ink p-10 text-white md:flex">
      <div className="flex items-center gap-2 text-lg font-bold"><GraduationCap className="text-amber-450" />Smart Campus</div>
      <div><h1 className="max-w-md text-4xl font-bold leading-tight">Book the hall, fill the room, scan them in.</h1>
        <p className="mt-3 max-w-md text-slate-300">One place for venues, equipment, events and tickets, with an assistant that knows the campus rules.</p></div>
      <p className="text-sm text-slate-400">Demo password for all accounts: password123</p></div>
    <div className="flex items-center justify-center p-6"><form onSubmit={submit} className="w-full max-w-sm space-y-4">
      <h2 className="text-2xl font-bold text-ink">{signup ? 'Create your student account' : 'Sign in'}</h2><Err m={err} />
      {signup && <><Label t="Full name"><input className={field} value={f.name} onChange={set('name')} required /></Label>
        <Label t="Department"><input className={field} value={f.department} onChange={set('department')} /></Label></>}
      <Label t="Email"><input type="email" className={field} value={f.email} onChange={set('email')} required /></Label>
      <Label t="Password"><input type="password" className={field} value={f.password} onChange={set('password')} required minLength={6} /></Label>
      <button className={btnP + ' w-full'}>{signup ? 'Create account' : 'Sign in'}</button>
      <button type="button" onClick={() => setSignup(!signup)} className="w-full text-sm text-teal-800 hover:underline">{signup ? 'I already have an account' : 'New student? Create an account'}</button>
      {!signup && <div className="rounded-xl bg-slate-100 p-3"><p className="mb-2 text-xs font-medium text-slate-600">Try a demo account</p>
        <div className="flex gap-2">{DEMO.map(([n, e]) => <button type="button" key={n} onClick={() => setF({ ...f, email: e, password: 'password123' })} className="flex-1 rounded-lg border border-slate-300 bg-white py-1.5 text-sm hover:bg-slate-50">{n}</button>)}</div></div>}
    </form></div></div>;
}
