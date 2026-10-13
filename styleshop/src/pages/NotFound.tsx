import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-page py-28 text-center">
      <p className="font-display text-7xl">404</p>
      <p className="mt-3 text-mist-500">Cette page n’existe pas ou a été déplacée.</p>
      <Link to="/" className="btn-primary mt-8">Retour à l’accueil</Link>
    </div>
  );
}
