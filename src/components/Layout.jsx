import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import Header from './Header';
import MobileDrawer from './MobileDrawer';
import Footer from './Footer';
import FloatingActions from './FloatingActions';
import CartDrawer from './CartDrawer';
import Modals from './Modals';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { toast } = useStore();

  useEffect(() => {
    const onAdminShortcut = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'R' || e.key === 'r' || e.code === 'KeyR')) {
        e.preventDefault();
        e.stopPropagation();
        navigate('/admin');
      }
    };
    window.addEventListener('keydown', onAdminShortcut, true);
    return () => window.removeEventListener('keydown', onAdminShortcut, true);
  }, [navigate]);

  return (
    <>
      <div className="announcement-bar">
        <span className="announcement-full">Open every day • 10:00 AM – 8:30 PM • WhatsApp video after the store confirms your order</span>
        <span className="announcement-short">Open daily 10:00 AM – 8:30 PM • WhatsApp video after confirm</span>
      </div>
      <Header />
      <MobileDrawer />
      <main>{children}</main>
      <Footer />
      <FloatingActions />
      <CartDrawer />
      <Modals />
      {toast ? <div className="rks-toast">{toast}</div> : null}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="goldCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#996515" />
          </linearGradient>
        </defs>
      </svg>
    </>
  );
}
