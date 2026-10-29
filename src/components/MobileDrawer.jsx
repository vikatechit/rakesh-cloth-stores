import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/Store';

export default function MobileDrawer() {
  const { mobileDrawerOpen, setMobileDrawerOpen, storeSettings } = useStore();
  const logo = storeSettings.logo_url || '/logo.png';
  const close = () => setMobileDrawerOpen(false);

  useEffect(() => {
    document.body.style.overflow = mobileDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileDrawerOpen]);

  return (
    <>
      <div
        className={`mobile-drawer-backdrop${mobileDrawerOpen ? ' active' : ''}`}
        onClick={close}
        aria-hidden={!mobileDrawerOpen}
      />
      <nav
        className={`mobile-drawer${mobileDrawerOpen ? ' active' : ''}`}
        aria-hidden={!mobileDrawerOpen}
        aria-label="Mobile menu"
      >
        <div className="drawer-header">
          <img src={logo} alt="Rakesh Cloth Stores" style={{ height: 62, objectFit: 'contain', background: 'transparent' }} />
          <button type="button" className="drawer-close" onClick={close} aria-label="Close menu">✕</button>
        </div>
        <div className="drawer-links">
          <Link to="/" onClick={close}>Home</Link>
          <Link to="/categories" onClick={close}>Shop By Category</Link>
          <Link to="/shop" onClick={close}>Collections</Link>
          <Link to="/how" onClick={close}>How To Order</Link>
          <Link to="/reviews" onClick={close}>Client Reviews</Link>
          <Link to="/about" onClick={close}>Our Store</Link>
          <Link to="/contact" onClick={close}>Contact</Link>
        </div>
      </nav>
    </>
  );
}
