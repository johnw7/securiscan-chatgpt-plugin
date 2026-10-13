import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import DemoNotice from '../../components/DemoNotice';
import { useStore } from '../../context/StoreContext';

export default function Login() {
  const { login, register, user } = useStore();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const back = params.get('retour') ?? '/compte';
  const [mode, setMode] = useState<'login' | 'register'>(params.get('mode') === 'inscription' ? 'register' : 'login');
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');

  if (user) return <Navigate to={back} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && (!f.firstName.trim() || !f.lastName.trim())) return setError('Prénom et nom requis.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return setError('Adresse e-mail invalide.');
    const err = mode === 'login' ? login(f.email, f.password) : register(f);
    if (err) setError(err);
    else navigate(back, { replace: true });
  };

  const input = (k: keyof typeof f, label: string, type = 'text', auto?: string) => (
    <label className="field">
      {label}
      <input type={type} autoComplete={auto} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="input" required />
    </label>
  );

  return (
    <div className="container-page flex justify-center pt-12">
      <div className="w-full max-w-md">
        <div className="mb-6 grid grid-cols-2 rounded-full bg-mist-100 p-1" role="tablist">
          {(['login', 'register'] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => { setMode(m); setError(''); }}
              className={`min-h-11 rounded-full text-sm font-medium transition ${mode === m ? 'bg-white shadow-sm' : 'text-mist-500'}`}>
              {m === 'login' ? 'Connexion' : 'Créer un compte'}
            </button>
          ))}
        </div>
        <h1 className="font-display text-4xl">{mode === 'login' ? 'Bon retour parmi nous' : 'Bienvenue chez STYLESHOP'}</h1>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              {input('firstName', 'Prénom', 'text', 'given-name')}
              {input('lastName', 'Nom', 'text', 'family-name')}
            </div>
          )}
          {input('email', 'Adresse e-mail', 'email', 'email')}
          {input('password', 'Mot de passe', 'password', mode === 'login' ? 'current-password' : 'new-password')}
          {mode === 'register' && <p className="-mt-2 text-xs text-mist-500">8 caractères minimum.</p>}
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button className="btn-primary mt-2">{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
        </form>

        <div className="mt-8">
          <DemoNotice>
            <strong>Mode démonstration, pas un compte sécurisé.</strong> Aucun serveur n’est connecté : les comptes existent seulement dans cet onglet
            et disparaissent au rechargement. N’utilisez pas un vrai mot de passe.
            <br />Comptes de test : <code>client@styleshop.demo</code> / <code>demo1234</code> — <code>admin@styleshop.demo</code> / <code>admin1234</code>
          </DemoNotice>
        </div>
      </div>
    </div>
  );
}
