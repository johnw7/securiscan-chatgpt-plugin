import { Clock, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { asset, BRAND } from '../data/menu';

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-cream">
      <div className="wrap grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src={asset('logo-pastille.svg')} alt="" width={64} height={64} className="mb-3 h-16 w-16" />
          <p className="h-display text-4xl text-mustard">SMASH<span className="text-cream">HOUSE</span></p>
          <p className="mt-3 text-sm text-cream/70">{BRAND.tagline}. Fait minute, avec amour (et beaucoup de cheddar).</p>
        </div>
        <div className="text-sm">
          <p className="label mb-3 text-mustard">Adresse</p>
          <p className="flex gap-2 text-cream/80"><MapPin className="h-4 w-4 flex-none text-mustard" /> {BRAND.address}</p>
          <p className="mt-2 flex gap-2 text-cream/80"><Phone className="h-4 w-4 flex-none text-mustard" /> {BRAND.phone}</p>
        </div>
        <div className="text-sm">
          <p className="label mb-3 text-mustard">Horaires</p>
          {BRAND.hours.map((h) => <p key={h.days} className="flex gap-2 text-cream/80"><Clock className="h-4 w-4 flex-none text-mustard" /> {h.days} : {h.time}</p>)}
        </div>
        <div className="text-sm">
          <p className="label mb-3 text-mustard">Liens</p>
          <ul className="space-y-2 text-cream/80">
            <li><Link to="/menu" className="hover:text-mustard">La carte</Link></li>
            <li><Link to="/suivi" className="hover:text-mustard">Suivre ma commande</Link></li>
            <li><Link to="/compte" className="hover:text-mustard">Mon compte</Link></li>
            <li><Link to="/admin" className="hover:text-mustard">Espace gérant</Link></li>
          </ul>
        </div>
      </div>
      <p className="wrap border-t border-white/10 py-5 text-xs text-cream/50">
        Site de démonstration : enseigne, prix et avis fictifs, paiement simulé. Visuels générés avec Canva. Allergènes indiqués sur chaque produit.
      </p>
    </footer>
  );
}
