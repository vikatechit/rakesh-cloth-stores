import { useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';

export default function Hero() {
  const { heroSlides } = useStore();
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
          <div className="hero-ornament-top">
            <span className="ornament-line" />
            <span className="ornament-diamond">✦</span>
            <span className="ornament-line" />
          </div>
          <h1 className="hero-headline-single">
            RAKESH<br />
            <span className="hero-gold-gradient-text">CLOTH STORES</span>
          </h1>
          <p className="hero-kicker">Quality Matters • Kurmannapalem, Vizag</p>
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
      </div>
    </section>
  );
}
