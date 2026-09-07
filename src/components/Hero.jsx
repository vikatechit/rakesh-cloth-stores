import { useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';

function phoneFromSettings(whatsappNumber) {
  const digits = String(whatsappNumber || '9985728175').replace(/\D/g, '');
  const ten = (digits.slice(-10) || '9985728175');
  return {
    display: `${ten.slice(0, 5)} ${ten.slice(5)}`,
    tel: `+91${ten}`,
  };
}

export default function Hero() {
  const { heroSlides, storeSettings } = useStore();
  const phone = phoneFromSettings(storeSettings.whatsapp_number);
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const panels = Array.from(root.querySelectorAll('.ag-panel'));
    if (!panels.length) return;

    const expandPanel = (activePanel) => {
      panels.forEach((p) => p.classList.toggle('ag-panel--active', p === activePanel));
    };

    const cleanups = panels.map((panel) => {
      const onEnter = (e) => {
        if (e.pointerType === 'mouse') expandPanel(panel);
      };
      const onClick = (e) => {
        if (!panel.classList.contains('ag-panel--active')) {
          e.preventDefault();
          e.stopPropagation();
          expandPanel(panel);
        }
      };
      panel.addEventListener('pointerenter', onEnter);
      panel.addEventListener('click', onClick);
      return () => {
        panel.removeEventListener('pointerenter', onEnter);
        panel.removeEventListener('click', onClick);
      };
    });

    expandPanel(panels[0]);
    return () => cleanups.forEach((fn) => fn());
  }, [heroSlides]);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const showcaseSlides = heroSlides.slice(0, 3);

  return (
    <section className="hero-section" id="home">
      <div className="hero-backdrop" />
      <div className="hero-backdrop-gradient" />
      <div className="hero-inner-container">
        <div className="hero-text-content">
          <h1 className="hero-headline-single">
            RAKESH<br />
            <span className="hero-gold-gradient-text">CLOTH STORES</span>
          </h1>
          <div className="hero-ornament-top">
            <span className="ornament-line" />
            <span className="ornament-diamond">✦</span>
            <span className="ornament-line" />
          </div>
          <p className="hero-kicker">Quality Matters</p>
          <p className="hero-address">Kurmannapalem, Visakhapatnam</p>
          <p className="hero-lead">
            Designer sarees, pattu silks, lehengas, suiting and shirting — a premium boutique experience
            with WhatsApp payment and WhatsApp video confirmation after your order is confirmed.
          </p>
          <div className="hero-cta-group">
            <button className="gold-luxury-btn" onClick={() => scrollTo('collections')}>
              SEE SAREES <span className="btn-arrow">›</span>
            </button>
            <button className="outline-gold-btn" onClick={() => scrollTo('how')}>
              HOW TO ORDER
            </button>
          </div>

          {showcaseSlides.length ? (
            <div className="hero-gallery-wrapper">
              <div className="gallery-header-label">
                <span className="sparkle-gold-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="#f6e399">
                    <path d="M12 0l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 0z" />
                  </svg>
                </span>
                <span>CURATED SHOWCASE <small>(Hover / Touch to Expand)</small></span>
              </div>
              <div className="accordion-gallery" role="list" aria-label="Featured Collection Gallery" ref={rootRef}>
                {showcaseSlides.map((slide, index) => (
                  <a
                    key={slide.id}
                    href={slide.link || '#collections'}
                    className={`ag-panel${index === 0 ? ' ag-panel--active' : ''}`}
                    role="listitem"
                  >
                    <div className="ag-panel__frame">
                      <div className="ag-panel__media">
                        <img src={slide.image_url} alt={slide.label} loading="eager" />
                      </div>
                      <div className="ag-panel__overlay" />
                      <div className="ag-panel__label">
                        <div className="ag-panel__bar" />
                        <span className="ag-panel__text">{slide.label}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <a className="hero-phone" href={`tel:${phone.tel}`} aria-label={`Call ${phone.display}`}>
          <span className="hero-phone-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </span>
          <span className="hero-phone-number">{phone.display}</span>
        </a>
      </div>
    </section>
  );
}
