import { createContext, useContext, useEffect, useState } from 'react'; import { api } from './api.js';
const Ctx = createContext(null); export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false);
  useEffect(() => { (localStorage.getItem('token') ? api('/auth/me').then(setUser).catch(() => {}) : Promise.resolve()).finally(() => setReady(true)); }, []);
  const login = async (path, body) => { const d = await api(path, { method: 'POST', body }); localStorage.setItem('token', d.token); setUser(d.user); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  return <Ctx.Provider value={{ user, ready, login, logout }}>{children}</Ctx.Provider>;
}
