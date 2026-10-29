import { X } from 'lucide-react';
export const fmt = (iso, o = { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) => new Date(iso).toLocaleString('en-IN', o);
const base = 'inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700';
export const btnP = base + ' bg-teal-700 text-white hover:bg-teal-800';
export const btnG = base + ' border border-slate-300 bg-white text-slate-700 hover:bg-slate-50';
export const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20';
const tone = { pending: 'bg-amber-100 text-amber-800', approved: 'bg-emerald-100 text-emerald-800', rejected: 'bg-rose-100 text-rose-800', cancelled: 'bg-slate-200 text-slate-600', available: 'bg-emerald-100 text-emerald-800', maintenance: 'bg-rose-100 text-rose-800', 'checked in': 'bg-emerald-100 text-emerald-800', registered: 'bg-sky-100 text-sky-800' };
export const Badge = ({ s }) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tone[s] || 'bg-slate-100'}`}>{s}</span>;
export const Err = ({ m }) => m ? <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{m}</p> : null;
export const Label = ({ t, children }) => <label className="block text-sm"><span className="mb-1 block font-medium text-slate-700">{t}</span>{children}</label>;
export const Empty = ({ children }) => <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{children}</p>;
export const Page = ({ title, sub, action, children }) => (
  <div className="mx-auto max-w-6xl p-4 md:p-8"><div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-2xl font-bold text-ink">{title}</h1>{sub && <p className="text-sm text-slate-500">{sub}</p>}</div>{action}</div>{children}</div>);
export function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
    <div role="dialog" aria-label={title} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl" onClick={e => e.stopPropagation()}>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-ink">{title}</h2>
        <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-slate-100"><X size={18} /></button></div>{children}</div></div>;
}
