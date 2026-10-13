import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import { StoreProvider } from './context/StoreContext';
import './index.css';

// La version statique (npm run build:static) utilise des URL en « #/ » : elle fonctionne sur
// tout hébergeur de fichiers (Netlify Drop, GitHub Pages, serveur simple) sans réglage de redirection.
const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <StoreProvider>
        <App />
      </StoreProvider>
    </Router>
  </StrictMode>,
);
