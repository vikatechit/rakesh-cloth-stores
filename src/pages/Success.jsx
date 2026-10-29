import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { useStore } from '../context/Store';
import { money, orderStatusMeta } from '../lib/format';

export default function Success() {
  const store = useStore();
  const stored = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('rks_last_order') || 'null'); } catch { return null; }
  }, []);
  const order = store.lastCreatedOrder || stored;
  const status = orderStatusMeta(order?.order_status || order?.status);

  return (
    <section className="section-container page-pad text-center">
      <Seo title="Order Placed | Rakesh Cloth Stores" description="Your Rakesh Cloth Stores order has been placed." />
      <div className="success-crest-icon">✦</div>
      <h2 className="success-title">Order Placed Successfully</h2>
      {order ? (
        <div className="order-receipt-box" style={{ maxWidth: 420, margin: '0 auto' }}>
          <p><strong>Bill:</strong> {order.bill_no || order.id}</p>
          <p><strong>Order:</strong> {order.order_number || order.id}</p>
          <p><strong>Status:</strong> {status.label}</p>
          <p><strong>Total:</strong> {money(order.total_amount ?? order.total)}</p>
        </div>
      ) : null}
      <p className="success-note">WhatsApp video call stays locked until Rakesh Cloth Stores confirms this order. Then open My Orders and tap Video Call on WhatsApp.</p>
      <div className="modal-actions-row" style={{ justifyContent: 'center' }}>
        <button className="gold-luxury-btn" onClick={store.sendWhatsAppReceipt}>CONFIRM ON WHATSAPP</button>
        <Link className="outline-gold-btn" to="/shop">CONTINUE SHOPPING</Link>
      </div>
    </section>
  );
}
