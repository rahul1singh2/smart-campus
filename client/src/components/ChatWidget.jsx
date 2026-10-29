import { useEffect, useRef, useState } from 'react'; import { MessageCircle, Send, X, Bot } from 'lucide-react'; import { api } from '../api.js';
const HINTS = ['What events are coming up?', 'How do I book a study room?', 'Where is my QR ticket?', 'Hall rules'];
export default function ChatWidget() {
  const [open, setOpen] = useState(false), [text, setText] = useState(''), [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState([{ from: 'bot', text: "Hi, I'm the campus assistant. Ask me about events, bookings, tickets or venue rules." }]);
  const end = useRef();
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [msgs, open]);
  async function send(m) {
    if (!m.trim() || busy) return; setText(''); setBusy(true); setMsgs(x => [...x, { from: 'me', text: m }]);
    try { const { reply } = await api('/chat', { method: 'POST', body: { message: m } }); setMsgs(x => [...x, { from: 'bot', text: reply }]); }
    catch (e) { setMsgs(x => [...x, { from: 'bot', text: 'Sorry, I could not reach the server. Try again in a moment.' }]); } setBusy(false);
  }
  return <div className="fixed bottom-4 right-4 z-30">
    {open && <div className="mb-3 flex h-[28rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-ink px-4 py-3 text-white"><span className="flex items-center gap-2 font-semibold"><Bot size={18} />Campus assistant</span>
        <button onClick={() => setOpen(false)} aria-label="Close chat"><X size={18} /></button></div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm" aria-live="polite">
        {msgs.map((m, i) => <p key={i} className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 ${m.from === 'me' ? 'ml-auto bg-teal-700 text-white' : 'bg-slate-100'}`}>{m.text}</p>)}
        {busy && <p className="w-fit rounded-2xl bg-slate-100 px-3 py-2 text-slate-400">Thinking…</p>}
        {msgs.length < 2 && <div className="flex flex-wrap gap-1.5 pt-1">{HINTS.map(h => <button key={h} onClick={() => send(h)} className="rounded-full border border-teal-700/30 px-2.5 py-1 text-xs text-teal-800 hover:bg-teal-50">{h}</button>)}</div>}
        <div ref={end} /></div>
      <form onSubmit={e => { e.preventDefault(); send(text); }} className="flex gap-2 border-t p-2">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Ask a question" aria-label="Message" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30" />
        <button className="rounded-lg bg-teal-700 px-3 text-white" aria-label="Send"><Send size={16} /></button></form></div>}
    <button onClick={() => setOpen(o => !o)} aria-label="Open campus assistant" className="ml-auto flex h-13 w-13 items-center justify-center rounded-full bg-amber-450 p-3.5 text-ink shadow-lg hover:brightness-95"><MessageCircle /></button>
  </div>;
}
