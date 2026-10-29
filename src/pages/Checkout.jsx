import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Seo from '../components/Seo';
import { useStore } from '../context/Store';
import { waLink } from '../data/brand';
import { money } from '../lib/format';

export default function Checkout() {
  const store = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    address: '',
    city: '',
    pincode: '',
    paymentMethod: 'Cash On Delivery (WhatsApp)',
    notes: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!store.cart.length) return setError('Add at least one piece before checkout.');
    if (!form.name.trim() || !form.mobile.trim() || !form.address.trim() || !form.city.trim()) {
      return setError('Name, mobile, address and city are required.');
    }
    setBusy(true);
    const order = await store.handleCheckoutSubmit(form);
    setBusy(false);
    if (!order) return;
    const itemsText = (order.items || []).map((i) => `• ${i.name} × ${i.qty}`).join('\n');
    const text =
      `Hello Rakesh Cloth Stores, I would like to confirm order ${order.id}.\n` +
      `${form.name}\n${form.mobile}\n${form.address}, ${form.city} ${form.pincode}\n` +
      `${form.paymentMethod}\n\n${itemsText}\n\nTotal: ${money(order.total)}`;
    sessionStorage.setItem('rks_last_order', JSON.stringify({ ...order, whatsapp: waLink(text, store.whatsapp) }));
    navigate('/success');
  };

  return (
    <section className="section-container page-pad">
      <Seo title="Checkout | Rakesh Cloth Stores" description="Enter delivery details and confirm your order on WhatsApp." />
      <div className="section-title-block">
        <h2 className="section-heading">CUSTOMER DETAILS</h2>
        <div className="section-decorative-divider">◆ ─── ❖ ─── ◆</div>
        <p className="section-subheading">Your selected products are ready for WhatsApp. Enter delivery details so the store can create your order.</p>
      </div>
      {!store.cart.length ? (
        <p className="section-subheading">Your bag is empty. <Link to="/shop">Browse the shop</Link>.</p>
      ) : (
        <div className="rks-split">
          <div className="rks-panel">
            {store.cart.map((item) => (
              <div className="mini-product" key={item.id}>
                <img src={item.image_url} alt={item.name} referrerPolicy="no-referrer" />
                <div>
                  <b>{item.name}</b>
                  <br />
                  {money(item.price)} × {item.qty}
                </div>
              </div>
            ))}
            <div className="checkout-order-summary-box" style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--gold-400)' }}>
                <span>Grand Total ({store.cartCount} items)</span>
                <span>{money(store.cartTotal)}</span>
              </div>
            </div>
          </div>
          <form className="luxury-form" onSubmit={submit}>
            <div className="form-row-2">
              <div className="form-group">
                <label>Full Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Customer name" />
              </div>
              <div className="form-group">
                <label>WhatsApp Mobile *</label>
                <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} type="tel" inputMode="numeric" maxLength={10} required placeholder="10-digit mobile" />
              </div>
            </div>
            <div className="form-group">
              <label>Delivery Address *</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} required placeholder="House / street / landmark" />
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>City / Area *</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required placeholder="Vizag / other city" />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} inputMode="numeric" maxLength={6} placeholder="530046" />
              </div>
            </div>
            <div className="form-group">
              <label>Payment Preference *</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} required>
                <option value="Cash On Delivery (WhatsApp)">Cash On Delivery — confirm on WhatsApp</option>
                <option value="UPI / Bank Transfer (WhatsApp)">UPI / Bank Transfer — pay via WhatsApp</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Blouse, fall-pico, colour preference" />
            </div>
            {error ? <p className="rks-err">{error}</p> : null}
            <button type="submit" className="gold-luxury-btn btn-full" disabled={busy}>
              {busy ? 'SAVING…' : 'SUBMIT ORDER ›'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
