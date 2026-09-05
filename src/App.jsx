import { StoreProvider } from './context/StoreContext';
import Header from './components/Header';
import MobileDrawer from './components/MobileDrawer';
import Hero from './components/Hero';
import Benefits from './components/Benefits';
import Categories from './components/Categories';
import Products from './components/Products';
import HowToOrder from './components/HowToOrder';
import Reviews from './components/Reviews';
import Story from './components/Story';
import Footer from './components/Footer';
import FloatingActions from './components/FloatingActions';
import CartDrawer from './components/CartDrawer';
import Modals from './components/Modals';
import AdminDashboard from './components/admin/AdminDashboard';

export default function App() {
  return (
    <StoreProvider>
      <div className="announcement-bar">
        <span className="announcement-full">Open every day • 10:00 AM – 8:30 PM • Video call unlocks after the store confirms your order</span>
        <span className="announcement-short">Open daily 10:00 AM – 8:30 PM • Video after confirm</span>
      </div>
      <Header />
      <MobileDrawer />
      <main>
        <Hero />
        <Benefits />
        <div className="cream-page-band">
          <Categories />
          <Products />
        </div>
        <HowToOrder />
        <Reviews />
        <Story />
      </main>
      <Footer />
      <FloatingActions />
      <CartDrawer />
      <Modals />
      <AdminDashboard />
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="goldCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#996515" />
          </linearGradient>
        </defs>
      </svg>
    </StoreProvider>
  );
}
