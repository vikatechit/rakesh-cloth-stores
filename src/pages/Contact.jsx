import { useState } from 'react';
import Seo from '../components/Seo';
import { formatAddress, waLink } from '../data/brand';
import { useStore } from '../context/Store';

export default function Contact() {
  const store = useStore();
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [notice, setNotice] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    await store.saveEnquiry(form);
    const text = `Hello Rakesh Cloth Stores,\n${form.name}\n${form.phone}\n\n${form.message}`;
    window.open(waLink(text, store.whatsapp), '_blank', 'noopener,noreferrer');
    setNotice('Enquiry saved. WhatsApp is opening so you can send it to the store.');
    setForm({ name: '', phone: '', message: '' });
  };

  return (
    <section className="section-container page-pad">
      <Seo title="Contact | Rakesh Cloth Stores" description="WhatsApp Rakesh Cloth Stores in Kurmannapalem, Visakhapatnam." />
      <div className="section-title-block">
        <h2 className="section-heading">CONTACT THE STORE</h2>
        <div className="section-decorative-divider">◆ ─── ❖ ─── ◆</div>
        <p className="section-subheading">Kurmannapalem, Gajuwaka • Open daily {store.hours}</p>
      </div>
      <div className="rks-split">
        <div className="rks-panel">
          {store.addresses.map((addr) => {
            const line = formatAddress(addr);
            return (
              <article key={addr.id} className="rks-address-card">
                <strong>{addr.label}</strong>
                <p>{line.street}</p>
                <p>{line.place}</p>
              </article>
            );
          })}
          <p><strong>WhatsApp:</strong> {store.whatsappDisplay}</p>
          <p><strong>Hours:</strong> {store.hours}</p>
          {store.email ? <p><strong>Email:</strong> {store.email}</p> : null}
          <a className="gold-luxury-btn" href={store.storeSettings.maps_url} target="_blank" rel="noreferrer">Open Google Maps</a>
        </div>
        <form className="luxury-form" onSubmit={submit}>
          <div className="form-group">
            <label>Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>WhatsApp mobile *</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required inputMode="tel" />
          </div>
          <div className="form-group">
            <label>Message *</label>
            <textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          </div>
          {notice ? <p className="rks-ok">{notice}</p> : null}
          <button type="submit" className="gold-luxury-btn btn-full">SEND ON WHATSAPP ›</button>
        </form>
      </div>
    </section>
  );
}
