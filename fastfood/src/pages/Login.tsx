import { useState, type FormEvent } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import DemoNotice from '../components/DemoNotice';
import { useStore } from '../context/StoreContext';

export default function Login() {
  const { login, register, user } = useStore();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  if (user) return <Navigate to={params.get('retour') ?? (user.role === 'admin' ? '/admin' : '/compte')} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && f.name.trim().length < 2) return setErr('Votre nom, s’il vous plaît.');
    const r = mode === 'login' ? login(f.email, f.password) : register(f);
    // En cas de succès, le rendu redirige selon le rôle (gérant → /admin, client → /compte).
    if (r) setErr(r);
  };

  return (
    <div className="wrap max-w-md pt-14">
      <div className="grid grid-cols-2 rounded-full bg-ink/5 p-1">
        {(['login', 'register'] as const).map((m) => (
          <button key={m} type="button" onClick={() => { setMode(m); setErr(''); }} className={`min-h-11 rounded-full text-sm font-extrabold ${mode === m ? 'bg-ink text-mustard' : 'text-ink/60'}`}>{m === 'login' ? 'Connexion' : 'Créer un compte'}</button>
        ))}
      </div>
      <h1 className="h-display mt-6 text-5xl">{mode === 'login' ? 'Re-bonjour 👋' : 'Rejoignez la team'}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === 'register' && <label className="field">Nom<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="input" autoComplete="name" /></label>}
        <label className="field">E-mail<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="input" autoComplete="email" required /></label>
        <label className="field">Mot de passe<input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="input" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></label>
        {err && <p className="text-sm text-tomato" role="alert">{err}</p>}
        <button className="btn-red w-full">{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
      </form>
      <div className="mt-8"><DemoNotice><b>Mode démonstration, pas un compte sécurisé.</b> Les comptes existent seulement dans cet onglet. Comptes de test : <code>client@smashhouse.demo</code> / <code>demo1234</code> — gérant : <code>admin@smashhouse.demo</code> / <code>admin1234</code>.</DemoNotice></div>
    </div>
  );
}
