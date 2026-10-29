import { useEffect, useState } from 'react'; import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../api.js'; import { Page, fmt, Empty } from '../ui.jsx'; import { useAuth } from '../auth.jsx';
export default function Dashboard() {
  const { user } = useAuth(), [d, setD] = useState(null);
  useEffect(() => { api('/analytics').then(setD); }, []);
  if (!d) return <Page title="Dashboard"><p className="text-slate-500">Loading…</p></Page>;
  const s = d.stats, stats = [['Upcoming events', s.upcomingEvents], ['Active registrations', s.registrations], ['Checked in', s.checkedIn], ['Bookings awaiting approval', s.pendingBookings]];
  return <Page title={`Welcome, ${user.name.split(' ')[0]}`} sub="Campus activity at a glance">
    <div className="mb-6 grid grid-cols-2 divide-x divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-4 md:divide-y-0">
      {stats.map(([l, v]) => <div key={l} className="p-5"><p className="text-3xl font-bold text-ink">{v}</p><p className="text-sm text-slate-500">{l}</p></div>)}</div>
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-3"><h2 className="mb-1 font-semibold text-ink">Daily resource utilization</h2>
        <p className="mb-3 text-xs text-slate-500">Approved hours as % of capacity, 8:00-20:00</p>
        <div className="h-60"><ResponsiveContainer><BarChart data={d.utilization}><CartesianGrid vertical={false} stroke="#e2e8f0" /><XAxis dataKey="day" fontSize={12} /><YAxis unit="%" fontSize={12} domain={[0, 100]} /><Tooltip formatter={v => v + '%'} /><Bar dataKey="rate" fill="#0f766e" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2"><h2 className="mb-3 font-semibold text-ink">Most booked resources (hours)</h2>
        <div className="h-60"><ResponsiveContainer><BarChart data={d.byResource} layout="vertical"><XAxis type="number" fontSize={12} /><YAxis type="category" dataKey="name" width={110} fontSize={11} /><Tooltip /><Bar dataKey="hours" fill="#F2A93B" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-5"><div className="mb-3 flex justify-between"><h2 className="font-semibold text-ink">Upcoming events</h2><Link to="/events" className="text-sm text-teal-800 hover:underline">See all</Link></div>
        {d.upcoming.length ? <ul className="divide-y">{d.upcoming.map(e => <li key={e.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
          <div><p className="font-medium">{e.title}</p><p className="text-slate-500">{fmt(e.date)} · {e.venue}</p></div><p className="text-slate-600">{e.registered}/{e.capacity} registered</p></li>)}</ul> : <Empty>No upcoming events yet.</Empty>}</section>
    </div></Page>;
}
