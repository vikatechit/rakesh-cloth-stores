import { useStore } from '../context/StoreContext';

export default function Header() {
  const { cartCount, openCart, openModal, setMobileDrawerOpen, storeSettings, filterCategory, categories } = useStore();
  const logo = storeSettings.logo_url || '/logo.png';

  const shopCategory = (cat) => {
    filterCategory(cat);
  };

  return (
    <header className="main-header" id="mainHeader">
      <div className="header-container">
        <a href="#home" className="brand-logo-clean" aria-label="Rakesh Cloth Stores Home">
          <img src={logo} alt="Rakesh Cloth Stores" className="main-logo-image" />
        </a>

        <nav className="desktop-nav">
          <a href="#home" className="nav-link">HOME</a>
          <div className="nav-dropdown-wrapper">
            <a href="#categories" className="nav-link">SHOP <span className="dropdown-arrow">▾</span></a>
            <div className="nav-dropdown-menu">
              {categories.map((cat) => (
                <a key={cat.id} href="#categories" onClick={() => shopCategory(cat.slug)}>{cat.title}</a>
              ))}
            </div>
          </div>
          <a href="#collections" className="nav-link">COLLECTIONS</a>
          <a href="#how" className="nav-link">HOW TO ORDER</a>
          <a href="#reviews-section" className="nav-link">REVIEWS</a>
          <a href="#contact" className="nav-link">CONTACT</a>
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
          <button type="button" className="mobile-menu-toggle" aria-label="Open menu" onClick={() => setMobileDrawerOpen(true)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
