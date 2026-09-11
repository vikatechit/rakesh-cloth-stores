import { useEffect } from 'react';
import { useStore } from '../context/StoreContext';

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
          <a href="#home" onClick={close}>Home</a>
          <a href="#categories" onClick={close}>Shop By Category</a>
          <a href="#collections" onClick={close}>Collections</a>
          <a href="#how" onClick={close}>How To Order</a>
          <a href="#reviews-section" onClick={close}>Client Reviews</a>
          <a href="#story" onClick={close}>Our Store</a>
          <a href="#contact" onClick={close}>Contact</a>
        </div>
      </nav>
    </>
  );
}
