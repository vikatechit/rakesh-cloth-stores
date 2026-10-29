import { useEffect, useState } from 'react';
import { orderStatusMeta } from '../lib/format';
import { useStore } from '../context/Store';
import FileUploadZone from './FileUploadZone';

function ModalOverlay({ active, onClose, children, cardClass = 'modal-md' }) {
  useEffect(() => {
    if (!active) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous || ''; };
  }, [active]);

  if (!active) return null;
  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className={`modal-card ${cardClass}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default function Modals() {
  const {
    modals,
    closeModal,
    selectedProduct,
    galleryIndex,
    setGalleryIndex,
    addToCartDirect,
    openWhatsAppInquiry,
    lastCreatedOrder,
    sendWhatsAppReceipt,
    openWhatsAppVideoCall,
    lookupCustomerOrders,
    handleReviewSubmit,
    handleReviewMediaUpload,
    viewingOrder,
    setViewingOrder,
    openModal,
  } = useStore();

  const [lookupMobile, setLookupMobile] = useState('');
  const [lookupOrders, setLookupOrders] = useState(null);
  const [reviewMedia, setReviewMedia] = useState({ url: '', isVideo: false, preview: '' });

  useEffect(() => {
    if (!modals.orderModal) return;
    const current = viewingOrder || lastCreatedOrder;
    if (!current?.mobile || !current?.id) return;
    lookupCustomerOrders(current.mobile).then((orders) => {
      const fresh = (orders || []).find((o) => o.id === current.id);
      if (fresh) setViewingOrder(fresh);
    });
  }, [modals.orderModal]);

  const product = selectedProduct;
  const gallery = product?.images?.length ? product.images : product?.image_url ? [product.image_url] : [];
  const order = viewingOrder || lastCreatedOrder;
  const confirmed = order?.order_status === 'Confirmed';
  const orderStatus = orderStatusMeta(order?.order_status);

  return (
    <>
      <ModalOverlay active={modals.productDetailModal} onClose={() => closeModal('productDetailModal')} cardClass="modal-lg">
        <button className="modal-close-icon" onClick={() => closeModal('productDetailModal')}>✕</button>
        {product ? (
          <div className="product-modal-body">
            <div className="product-modal-gallery">
              <img src={gallery[galleryIndex] || product.image_url} alt={product.name} referrerPolicy="no-referrer" />
              {gallery.length > 1 ? (
                <div className="rks-thumbs">
                  {gallery.map((src, i) => (
                    <button key={src + i} className={i === galleryIndex ? 'active' : ''} onClick={() => setGalleryIndex(i)}>
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="product-modal-info">
              <span className="product-category-tag">{product.category}</span>
              <h2>{product.name}</h2>
              <div className="product-modal-price">₹{Number(product.price).toLocaleString('en-IN')}</div>
              <p style={{ fontSize: 14, color: 'var(--cream-200)', marginBottom: 16, lineHeight: 1.6 }}>
                {product.description || 'Premium ethnic wear from Rakesh Cloth Stores, Kurmannapalem.'}
              </p>
              <ul className="product-specs-list">
                <li><strong>Fabric:</strong> {product.fabric || 'Boutique selected'}</li>
                <li><strong>Stock:</strong> {product.stock > 0 ? `${product.stock} available` : 'Sold out'}</li>
                <li><strong>Vizag delivery:</strong> Often within 1 day</li>
                <li><strong>WhatsApp video:</strong> Unlocks after the store confirms your order</li>
              </ul>
              <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                <button className="gold-luxury-btn btn-full" onClick={() => addToCartDirect(product.id)} disabled={product.stock <= 0}>
                  {product.stock <= 0 ? 'SOLD OUT' : 'ADD TO BAG +'}
                </button>
                <button
                  className="outline-gold-btn btn-full"
                  onClick={() => openWhatsAppInquiry(`Hello Rakesh Cloth Stores, I would like to inquire about ${product.name} (₹${product.price}).`)}
                >
                  INQUIRE ON WHATSAPP
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </ModalOverlay>

      <ModalOverlay active={modals.orderModal} onClose={() => closeModal('orderModal')}>
        <button className="modal-close-icon" onClick={() => closeModal('orderModal')}>✕</button>
        {order ? (
          <>
            <div className="modal-header-banner">
              <h2>My Order</h2>
              <p>Bill {order.bill_no} • {order.order_number}</p>
            </div>
            <div className={`rks-status-banner ${orderStatus.key}`}>
              Current status: <span className={`status-badge ${orderStatus.key}`}>{orderStatus.label}</span>
              {confirmed ? ' — store confirmed. WhatsApp video call is now available.' : ' — waiting for store confirmation.'}
            </div>
            <div className="rks-order-items">
              {(order.items || []).map((p, i) => (
                <div className="mini-product" key={i}>
                  <img src={p.img || p.image_url} alt={p.name} />
                  <div><b>{p.name}</b><br />₹{Number(p.price).toLocaleString('en-IN')} × {p.qty}</div>
                </div>
              ))}
            </div>
            <button
              className={`gold-luxury-btn btn-full${confirmed ? '' : ' locked-btn'}`}
              disabled={!confirmed}
              onClick={() => openWhatsAppVideoCall(order)}
            >
              {confirmed ? 'Video Call on WhatsApp ›' : 'Video Call — Waiting for Confirmation'}
            </button>
            <button className="outline-gold-btn btn-full" style={{ marginTop: 10 }} onClick={sendWhatsAppReceipt}>
              WhatsApp Order Status
            </button>
            <p className="tiny-note">After the store confirms, tap Video Call on WhatsApp. Then tap the video camera in WhatsApp to see the product live. Best during shop hours 10:00 AM – 8:30 PM.</p>
          </>
        ) : null}
      </ModalOverlay>

      <ModalOverlay active={modals.accountModal} onClose={() => closeModal('accountModal')} cardClass="modal-sm">
        <button className="modal-close-icon" onClick={() => closeModal('accountModal')}>✕</button>
        <div className="modal-header-banner">
          <h2>My Orders</h2>
          <p>Enter the same contact number used for your order.</p>
        </div>
        <div className="form-group" style={{ marginTop: 16 }}>
          <label>Mobile Number</label>
          <input type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" value={lookupMobile} onChange={(e) => setLookupMobile(e.target.value)} />
        </div>
        <button
          className="gold-luxury-btn btn-full"
          onClick={async () => setLookupOrders(await lookupCustomerOrders(lookupMobile))}
        >
          SHOW MY ORDERS
        </button>
        {lookupOrders !== null ? (
          <div style={{ marginTop: 16 }}>
            {!lookupOrders.length ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No orders found for this number.</p>
            ) : lookupOrders.map((o) => (
              <div className="customer-order" key={o.id}>
                <div className="admin-order-head" style={{ marginBottom: 6 }}>
                  <b>{o.bill_no}</b>
                  <span className={`status-badge ${orderStatusMeta(o.order_status).key}`}>{orderStatusMeta(o.order_status).label}</span>
                </div>
                <div className="tiny-note">{new Date(o.created_at || o.date).toLocaleString('en-IN')}</div>
                {(o.items || []).map((p, i) => (
                  <div className="mini-product" key={i}>
                    <img src={p.img || p.image_url} alt="" />
                    <div>{p.name} × {p.qty}</div>
                  </div>
                ))}
                <button
                  className="outline-gold-btn btn-full"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    setViewingOrder(o);
                    closeModal('accountModal');
                    openModal('orderModal');
                  }}
                >
                  Open Order
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </ModalOverlay>

      <ModalOverlay active={modals.writeReviewModal} onClose={() => closeModal('writeReviewModal')}>
        <button className="modal-close-icon" onClick={() => closeModal('writeReviewModal')}>✕</button>
        <div className="modal-header-banner">
          <h2>Share Your Look</h2>
          <p>Upload a photo or video wearing your Rakesh Cloth Stores piece.</p>
        </div>
        <form
          className="luxury-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            await handleReviewSubmit({
              name: fd.get('name').toString().trim(),
              city: fd.get('city').toString().trim(),
              outfit: fd.get('outfit').toString().trim(),
              rating: parseInt(fd.get('rating'), 10) || 5,
              comment: fd.get('comment').toString().trim(),
              media_url: reviewMedia.url || null,
              is_video: reviewMedia.isVideo,
            });
            setReviewMedia({ url: '', isVideo: false, preview: '' });
            e.target.reset();
          }}
        >
          <div className="form-row-2">
            <div className="form-group"><label>Your Name *</label><input name="name" required /></div>
            <div className="form-group"><label>City *</label><input name="city" required placeholder="Vizag" /></div>
          </div>
          <div className="form-row-2">
            <div className="form-group"><label>Outfit *</label><input name="outfit" required placeholder="Royal Blue Pattu Saree" /></div>
            <div className="form-group">
              <label>Rating *</label>
              <select name="rating" defaultValue="5">
                <option value="5">★★★★★</option>
                <option value="4">★★★★☆</option>
                <option value="3">★★★☆☆</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Your Feedback *</label>
            <textarea name="comment" rows={3} required />
          </div>
          <div className="form-group">
            <label>Photo or Video</label>
            <FileUploadZone
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*,video/mp4,video/quicktime,video/*"
              onFiles={async (files) => {
                const file = files[0];
                if (!file) return;
                const result = await handleReviewMediaUpload(file);
                if (result) setReviewMedia({ url: result.url, isVideo: result.isVideo, preview: result.url });
              }}
            >
              <span style={{ fontSize: 13, color: '#d4af37' }}>Tap to upload photo / video from gallery or camera</span>
              {reviewMedia.preview ? <div className="preview-thumb-box"><img src={reviewMedia.preview} alt="preview" /></div> : null}
            </FileUploadZone>
          </div>
          <button type="submit" className="gold-luxury-btn btn-full">PUBLISH REVIEW ›</button>
        </form>
      </ModalOverlay>
    </>
  );
}
