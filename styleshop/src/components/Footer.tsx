import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-24 bg-mist-100">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-semibold tracking-[0.16em]">STYLESHOP</p>
          <p className="mt-3 text-sm leading-relaxed text-mist-500">Mode homme, femme et enfant. Pièces essentielles, matières choisies.</p>
        </div>
        <div className="text-sm">
          <p className="label-caps mb-3">Boutique</p>
          <ul className="space-y-2">
            <li><Link to="/catalogue?categorie=femme" className="hover:underline">Femme</Link></li>
            <li><Link to="/catalogue?categorie=homme" className="hover:underline">Homme</Link></li>
            <li><Link to="/catalogue?categorie=enfant" className="hover:underline">Enfant</Link></li>
            <li><Link to="/catalogue?categorie=accessoires" className="hover:underline">Accessoires</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="label-caps mb-3">Aide</p>
          <ul className="space-y-2 text-mist-500">
            <li>Livraison offerte dès 60 €</li>
            <li>Retours gratuits sous 30 jours</li>
            <li>Paiement sécurisé (bientôt via Stripe)</li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="label-caps mb-3">Espaces</p>
          <ul className="space-y-2">
            <li><Link to="/compte" className="hover:underline">Mon compte</Link></li>
            <li><Link to="/admin" className="hover:underline">Administration</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-mist-200">
        <p className="container-page py-5 text-xs text-mist-500">
          Boutique de démonstration — produits, prix et avis fictifs, paiement simulé. Photos : Unsplash.
        </p>
      </div>
    </footer>
  );
}
