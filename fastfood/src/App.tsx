import { Outlet, Route, Routes, Link } from 'react-router-dom';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import Header from './components/Header';
import ScrollToTop from './components/ScrollToTop';
import StickyCart from './components/StickyCart';
import Toasts from './components/Toasts';
import Account from './pages/Account';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import Login from './pages/Login';
import Menu from './pages/Menu';
import Tracking from './pages/Tracking';

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <StickyCart />
      <CartDrawer />
      <Toasts />
    </div>
  );
}

function NotFound() {
  return (
    <div className="wrap py-28 text-center">
      <p className="h-display text-8xl text-tomato">404</p>
      <p className="mt-2 font-semibold">Cette page s’est fait dévorer.</p>
      <Link to="/" className="btn-red mt-6">Retour à l’accueil</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="menu" element={<Menu />} />
        <Route path="commande" element={<Checkout />} />
        <Route path="suivi" element={<Tracking />} />
        <Route path="suivi/:id" element={<Tracking />} />
        <Route path="connexion" element={<Login />} />
        <Route path="compte" element={<Account />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
