import { useStore } from '../context/StoreContext';

export default function CartDrawer() {
  const { cart, cartOpen, cartCount, cartTotal, closeCart, updateCartQty, placeOrderStart } = useStore();

  return (
    <div className={`cart-drawer-backdrop${cartOpen ? ' active' : ''}`} onClick={closeCart}>
      <div className="cart-drawer-container" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-top-bar">
          <div className="drawer-header-text">
            <span className="drawer-title-gold">YOUR SHOPPING BAG</span>
            <span className="drawer-item-subtitle">{cartCount} piece{cartCount !== 1 ? 's' : ''} • max 5 styles</span>
          </div>
          <button className="drawer-close-btn" onClick={closeCart}>✕</button>
        </div>
        <div className="cart-items-scroll-area">
          {!cart.length ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 18, fontFamily: 'var(--font-display)' }}>Your bag is empty.</p>
              <button className="gold-luxury-btn" onClick={closeCart} style={{ marginTop: 16 }}>EXPLORE SAREES ›</button>
            </div>
          ) : (
            cart.map((item) => (
              <div className="cart-drawer-item" key={item.id}>
                <img src={item.image_url} alt={item.name} />
                <div>
                  <div className="cart-item-title">{item.name}</div>
                  <div style={{ fontWeight: 700, color: 'var(--gold-400)', fontSize: 14 }}>
                    ₹{(item.price * item.qty).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="cart-qty-stepper">
                  <button onClick={() => updateCartQty(item.id, -1)}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateCartQty(item.id, 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="cart-drawer-footer">
          <div className="cart-summary-line">
            <span>Total</span>
            <span className="cart-total-amount">₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="cart-summary-sub">
            <span>Vizag delivery</span>
            <span className="free-shipping-tag">Often within 1 day</span>
          </div>
          <div className="cart-checkout-actions">
            <button className="gold-luxury-btn btn-full" onClick={placeOrderStart} disabled={!cart.length}>
              PLACE ORDER ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
