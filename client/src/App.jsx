import { useState } from 'react'; import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Ticket, Building2, ClipboardList, ScanLine, Shield, LogOut, GraduationCap } from 'lucide-react';
import { useAuth } from './auth.jsx'; import Login from './pages/Login.jsx'; import Dashboard from './pages/Dashboard.jsx';
import { EventsPage, TicketsPage } from './pages/Events.jsx'; import Resources from './pages/Resources.jsx'; import Bookings from './pages/Bookings.jsx';
import Scanner from './pages/Scanner.jsx'; import Admin from './pages/Admin.jsx'; import ChatWidget from './components/ChatWidget.jsx';
const NAV = [
  ['/', 'Dashboard', LayoutDashboard, ['student', 'organizer', 'admin']], ['/events', 'Events', CalendarDays, ['student', 'organizer', 'admin']],
  ['/tickets', 'My tickets', Ticket, ['student', 'organizer']], ['/resources', 'Resources', Building2, ['student', 'organizer', 'admin']],
  ['/bookings', 'Bookings', ClipboardList, ['student', 'organizer', 'admin']], ['/checkin', 'Check-in', ScanLine, ['organizer', 'admin']], ['/admin', 'Admin', Shield, ['admin']]];
export default function App() {
  const { user, ready, logout } = useAuth();
  if (!ready) return null;
  if (!user) return <Routes><Route path="/login" element={<Login />} /><Route path="*" element={<Navigate to="/login" />} /></Routes>;
  const links = NAV.filter(n => n[3].includes(user.role));
  const link = ({ isActive }) => `flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-white/10'}`;
  const gate = (roles, el) => roles.includes(user.role) ? el : <Navigate to="/" />;
  return <div className="min-h-screen md:flex">
    <aside className="bg-ink text-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0">
      <div className="flex items-center justify-between gap-2 p-4"><div className="flex items-center gap-2 font-bold"><GraduationCap className="text-amber-450" />Smart Campus</div>
        <button onClick={logout} className="md:hidden" aria-label="Sign out"><LogOut size={18} /></button></div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">{links.map(([to, label, Icon]) =>
        <NavLink key={to} to={to} end={to === '/'} className={link}><Icon size={17} />{label}</NavLink>)}</nav>
      <div className="mt-auto hidden p-4 md:absolute md:bottom-0 md:block md:w-60">
        <p className="text-sm font-semibold">{user.name}</p><p className="mb-2 text-xs capitalize text-slate-400">{user.role} · {user.department}</p>
        <button onClick={logout} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"><LogOut size={15} />Sign out</button></div>
    </aside>
    <main className="min-w-0 flex-1"><Routes>
      <Route path="/" element={<Dashboard />} /><Route path="/events" element={<EventsPage />} /><Route path="/tickets" element={gate(['student', 'organizer'], <TicketsPage />)} />
      <Route path="/resources" element={<Resources />} /><Route path="/bookings" element={<Bookings />} />
      <Route path="/checkin" element={gate(['organizer', 'admin'], <Scanner />)} /><Route path="/admin" element={gate(['admin'], <Admin />)} />
      <Route path="*" element={<Navigate to="/" />} /></Routes></main>
    <ChatWidget />
  </div>;
}
