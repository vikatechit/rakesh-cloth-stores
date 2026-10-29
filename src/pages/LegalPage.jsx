import { useLocation } from 'react-router-dom';
import Seo from '../components/Seo';

const COPY = {
  '/privacy': {
    title: 'Privacy Policy',
    body: [
      'Rakesh Cloth Stores collects only the name, WhatsApp number and delivery address needed to confirm and deliver your order.',
      'Orders are stored in the shop Google Sheet so the store can pack, confirm and call you on WhatsApp. We do not sell customer lists.',
      'Photo or video looks that you share as reviews are shown on the website only after you submit them.',
    ],
  },
  '/terms': {
    title: 'Terms of Service',
    body: [
      'Orders are confirmed on WhatsApp. Cash on delivery or UPI is arranged with the store after confirmation.',
      'Stock and final price are confirmed by the store. WhatsApp video is offered after the order status is Confirmed.',
      'Boutique pieces are packed as shown. Custom blouse, fall-pico or colour notes should be written at checkout.',
    ],
  },
  '/shipping': {
    title: 'Shipping',
    body: [
      'Vizag and nearby areas are often delivered within one day after confirmation.',
      'Outstation dispatch is arranged on WhatsApp after the store confirms the order.',
      'Please keep your WhatsApp number reachable during shop hours, 10:00 AM – 8:30 PM.',
    ],
  },
  '/refunds': {
    title: 'Refunds & Returns',
    body: [
      'Please check the piece on the WhatsApp video call after confirmation, before delivery is completed.',
      'Unused pieces with tags may be discussed with the store on WhatsApp. Stitched or worn garments are not returnable.',
      'Payment already made on UPI is refunded only after the store agrees the return on WhatsApp.',
    ],
  },
};

export default function LegalPage() {
  const { pathname } = useLocation();
  const page = COPY[pathname] || COPY['/privacy'];
  return (
    <section className="section-container page-pad">
      <Seo title={`${page.title} | Rakesh Cloth Stores`} description={page.body[0]} />
      <div className="section-title-block">
        <h2 className="section-heading">{page.title.toUpperCase()}</h2>
        <div className="section-decorative-divider">◆ ─── ❖ ─── ◆</div>
      </div>
      <div className="rks-panel" style={{ maxWidth: 720, margin: '0 auto' }}>
        {page.body.map((p) => <p key={p} style={{ marginBottom: 14, lineHeight: 1.7 }}>{p}</p>)}
      </div>
    </section>
  );
}
