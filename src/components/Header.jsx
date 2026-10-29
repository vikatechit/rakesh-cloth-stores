import { Link, NavLink } from 'react-router-dom';
import { useStore } from '../context/Store';

export default function Header() {
  const { cartCount, openCart, openModal, setMobileDrawerOpen, storeSettings, categories } = useStore();
  const logo = storeSettings.logo_url || '/logo.png';

  return (
    <header className="main-header" id="mainHeader">
      <div className="header-container">
        <Link to="/" className="brand-logo-clean" aria-label="Rakesh Cloth Stores Home">
          <img src={logo} alt="Rakesh Cloth Stores" className="main-logo-image" />
        </Link>

        <nav className="desktop-nav">
          <NavLink to="/" className="nav-link" end>HOME</NavLink>
          <div className="nav-dropdown-wrapper">
            <NavLink to="/shop" className="nav-link">SHOP <span className="dropdown-arrow">▾</span></NavLink>
            <div className="nav-dropdown-menu">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/shop/${cat.slug}`}>{cat.title}</Link>
              ))}
            </div>
          </div>
          <NavLink to="/categories" className="nav-link">COLLECTIONS</NavLink>
          <NavLink to="/how" className="nav-link">HOW TO ORDER</NavLink>
          <NavLink to="/reviews" className="nav-link">REVIEWS</NavLink>
          <NavLink to="/contact" className="nav-link">CONTACT</NavLink>
        </nav>

        <div className="header-action-group">
          <button type="button" className="action-icon-btn" aria-label="Track order" title="My Orders" onClick={() => openModal('accountModal')}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button type="button" className="cart-trigger-btn" aria-label="Shopping bag" onClick={openCart}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="cart-text">BAG</span> <span className="cart-badge-count">{cartCount}</span>
          </button>
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Open menu"
            onClick={() => setMobileDrawerOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
