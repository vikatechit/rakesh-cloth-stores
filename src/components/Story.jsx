import { useStore } from '../context/StoreContext';

export default function Story() {
  const { storeSettings } = useStore();
  return (
    <section className="section-container story-section" id="story">
      <div className="rks-delivery-grid">
        <div className="info-card luxury-info">
          <h3>Delivery & Location</h3>
          <ul>
            <li>Within Vizag: expected delivery within 1 day, subject to availability.</li>
            <li>Outside Vizag: courier arranged according to destination.</li>
            <li>Shop: near Duvvada Bridge, opposite Dama Convention, Kurmannapalem, Gajuwaka, Andhra Pradesh 530046.</li>
            <li>Hours: {storeSettings.shop_hours || '10:00 AM – 8:30 PM'} every day.</li>
          </ul>
          <a className="gold-luxury-btn" href={storeSettings.maps_url} target="_blank" rel="noreferrer">Open Shop Location</a>
        </div>
        <div className="info-card luxury-info">
          <h3>What We Sell</h3>
          <ul>
            <li>All kinds of Designer Sarees</li>
            <li>Pattu Sarees</li>
            <li>Lehengas</li>
            <li>Suiting & Shirting Pieces</li>
            <li>Premium collections up to ₹20,000 in this catalogue</li>
          </ul>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a className="outline-gold-btn" href={storeSettings.instagram_url} target="_blank" rel="noreferrer">Instagram</a>
            <a className="outline-gold-btn" href={storeSettings.youtube_url} target="_blank" rel="noreferrer">YouTube</a>
          </div>
        </div>
      </div>
      <div className="story-grid-layout" style={{ marginTop: 28 }}>
        <div className="story-card atelier-card">
          <h3>Quality Matters</h3>
          <p>Rakesh Cloth Stores presents every saree with large photos, clear stock and a simple price range so families can shop with confidence.</p>
        </div>
        <div className="story-card dark-crest-card">
          <h3>WhatsApp Video Call</h3>
          <p>After the store confirms your order, tap Video Call on WhatsApp. The shop starts a WhatsApp video call so you can see the piece live before dispatch.</p>
        </div>
        <div className="story-card atelier-card">
          <h3>Kurmannapalem Atelier</h3>
          <p>Visit us near Duvvada Bridge, opposite Dama Convention — or order online and receive Vizag delivery, often within a day.</p>
        </div>
      </div>
    </section>
  );
}
