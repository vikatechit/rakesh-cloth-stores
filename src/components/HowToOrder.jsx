export default function HowToOrder() {
  const steps = [
    { n: '1', t: 'Choose Price', d: 'Tap a price range. Only matching pieces appear.' },
    { n: '2', t: 'Select Products', d: 'Open large photos, check stock, add to bag.' },
    { n: '3', t: 'Add To Cart', d: 'Maximum 5 different products per order.' },
    { n: '4', t: 'Place Order', d: 'WhatsApp receives the list. Payment is only through WhatsApp (COD or UPI).' },
    { n: '5', t: 'Confirm & Video Call', d: 'Call unlocks only after the store confirms, 10:00 AM–8:30 PM.' },
  ];
  return (
    <section className="section-container" id="how">
      <div className="section-title-block">
        <h2 className="section-heading">SIMPLE ORDER PROCESS</h2>
        <div className="section-decorative-divider">◆ ─── ❖ ─── ◆</div>
        <p className="section-subheading">Made for first-time customers. Clear photos, clear prices, then a live video confirmation.</p>
      </div>
      <div className="rks-process">
        {steps.map((s) => (
          <div className="rks-step" key={s.n}>
            <div className="rks-step-num">{s.n}</div>
            <strong>{s.t}</strong>
            <span>{s.d}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
