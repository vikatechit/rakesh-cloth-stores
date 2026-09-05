import { useStore } from '../context/StoreContext';

export default function Footer() {
  const { openModal, storeSettings } = useStore();
  const logo = storeSettings.logo_url || '/logo.png';
  const wa = storeSettings.whatsapp_number || '919985728175';

  return (
    <footer className="main-footer" id="contact">
      <div className="footer-top-grid">
        <div className="footer-col brand-col">
          <div className="footer-brand-header">
            <img src={logo} alt="Rakesh Cloth Stores" className="footer-logo-img" />
          </div>
          <p className="footer-tagline">Quality Matters. Premium ethnic wear with a simple, trusted customer experience.</p>
          <div className="official-insta-wrapper">
            <a href={storeSettings.instagram_url} target="_blank" rel="noreferrer" className="insta-luxury-badge">
              <span>@rakesh_mahanthy</span>
            </a>
          </div>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">QUICK LINKS</h4>
          <ul className="footer-nav-list">
            <li><a href="#home">Home</a></li>
            <li><a href="#categories">Shop Collection</a></li>
            <li><a href="#collections">Price Ranges</a></li>
            <li><a href="#how">How To Order</a></li>
            <li><a href="#reviews-section">Reviews</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">STORE</h4>
          <ul className="footer-nav-list">
            <li>Kurmannapalem, Gajuwaka</li>
            <li>Vizag, Andhra Pradesh 530046</li>
            <li>Open daily {storeSettings.shop_hours || '10:00 AM – 8:30 PM'}</li>
            <li><a href={storeSettings.maps_url} target="_blank" rel="noreferrer">Google Maps</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">CONTACT US</h4>
          <div className="footer-contact-details">
            <div className="contact-row">
              <span>WhatsApp</span>
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">+91 99857 28175</a>
            </div>
            <div className="contact-row">
              <span>YouTube</span>
              <a href={storeSettings.youtube_url} target="_blank" rel="noreferrer">@rakeshclothstores</a>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom-bar">
        <div className="footer-bottom-container">
          <div className="copyright-text">
            © {new Date().getFullYear()} Rakesh Cloth Stores. All Rights Reserved.{' '}
            <span
              className="secret-admin-trigger"
              onClick={() => openModal('adminLoginModal')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openModal('adminLoginModal')}
              title="Admin"
            >
              ✦
            </span>
          </div>
          <div className="developer-credit-box">
            <span>Developed by <strong>Vikatech</strong></span>
            <span className="dev-divider">•</span>
            <a href="mailto:vikatechit@gmail.com" className="dev-mail">Mail: vikatechit@gmail.com</a>
            <span className="dev-divider">•</span>
            <a
              href="https://www.instagram.com/vikatechit"
              target="_blank"
              rel="noreferrer"
              className="dev-insta-link"
              title="Follow Vikatech on Instagram"
              aria-label="Vikatech Instagram"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
