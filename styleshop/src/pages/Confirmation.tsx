import { Check } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import DemoNotice from '../components/DemoNotice';
import StatusBadge from '../components/StatusBadge';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../lib/format';
import { SHIPPING_METHODS } from '../lib/pricing';

export default function Confirmation() {
  const { id } = useParams();
  const { orders, user } = useStore();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="container-page py-24 text-center">
        <p className="font-display text-3xl">Commande introuvable</p>
        <p className="mt-2 text-sm text-mist-500">En mode démonstration, les commandes ne sont pas conservées après un rechargement de la page.</p>
        <Link to="/" className="btn-primary mt-6">Retour à l’accueil</Link>
      </div>
    );
  }

  const ship = SHIPPING_METHODS.find((m) => m.id === order.shippingMethod)!;

  return (
    <div className="container-page max-w-3xl pt-14">
      <div className="flex animate-fade-up flex-col items-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-sand-200"><Check className="h-9 w-9" strokeWidth={2} /></div>
        <h1 className="mt-6 font-display text-4xl md:text-5xl">Merci {order.customer.firstName} !</h1>
        <p className="mt-3 text-mist-500">Votre commande a bien été enregistrée.</p>
        <p className="mt-4 rounded-full bg-mist-100 px-5 py-2 text-sm">Numéro de commande : <strong className="tracking-wider">{order.number}</strong></p>
      </div>

      {order.paymentMode === 'simule' && (
        <div className="mt-8">
          <DemoNotice>
            <strong>Commande de démonstration — aucun paiement n’a été effectué.</strong> Aucun prestataire n’est connecté ; aucun e-mail n’est envoyé.
          </DemoNotice>
        </div>
      )}

      <div className="card mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label-caps">Récapitulatif</p>
          <StatusBadge status={order.status} />
        </div>
        <ul className="mt-5 divide-y divide-mist-200">
          {order.lines.map((l) => (
            <li key={`${l.productId}-${l.size}-${l.color}`} className="flex justify-between gap-4 py-3 text-sm">
              <span>{l.quantity} × {l.name} <span className="text-mist-500">({l.size}, {l.color})</span></span>
              <span className="font-medium">{formatPrice(l.unitPrice * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-mist-200 pt-4 text-sm">
          <div className="flex justify-between"><dt>Sous-total</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-green-800"><dt>Réduction ({order.promoCode})</dt><dd>−{formatPrice(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt>{ship.label}</dt><dd>{order.shipping ? formatPrice(order.shipping) : 'Offerte'}</dd></div>
          <div className="flex justify-between text-lg font-semibold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
        <div className="mt-6 grid gap-4 border-t border-mist-200 pt-5 text-sm sm:grid-cols-2">
          <div>
            <p className="label-caps mb-2">Livraison</p>
            <p>{order.customer.firstName} {order.customer.lastName}<br />{order.address.street}<br />{order.address.postalCode} {order.address.city}, {order.address.country}</p>
          </div>
          <div>
            <p className="label-caps mb-2">Contact</p>
            <p>{order.email}<br />{order.customer.phone}<br /><span className="text-mist-500">{ship.delay}</span></p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/catalogue" className="btn-primary">Continuer mes achats</Link>
        {user && <Link to="/compte?onglet=commandes" className="btn-secondary">Suivre mes commandes</Link>}
      </div>
    </div>
  );
}
