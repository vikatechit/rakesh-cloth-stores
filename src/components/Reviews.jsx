import { useStore } from '../context/StoreContext';

export default function Reviews() {
  const { reviews, activeReviewIndex, triggerStackNext, openModal } = useStore();
  const total = reviews.length;

  return (
    <section className="section-container reviews-section" id="reviews-section">
      <div className="section-title-block">
        <h2 className="section-heading">CLIENT DIARIES & REVIEWS</h2>
        <div className="section-decorative-divider">◆ ─── ❖ ─── ◆</div>
        <p className="section-subheading">Loved by families across Vizag. Share your look after delivery.</p>
      </div>
      <div className="review-stack-section-layout">
        <div className="review-summary-sidebar">
          <div className="review-summary-card">
            <div className="big-rating-number">4.9</div>
            <div className="star-rating-display">★★★★★</div>
            <p className="sidebar-rating-desc">Verified customers from Kurmannapalem, Gajuwaka and beyond.</p>
            <button className="gold-luxury-btn btn-full" onClick={() => openModal('writeReviewModal')} style={{ marginTop: 20 }}>
              WRITE A REVIEW / SHARE LOOK ›
            </button>
          </div>
        </div>
        <div className="review-stack-interactive-wrapper">
          <div className="stack-instruction-hint">
            <span><strong>Click the card</strong> to see the next review</span>
            <button className="stack-nav-btn" onClick={triggerStackNext}>Next Card ➔</button>
          </div>
          <div className="stack-container">
            {reviews.map((rev, index) => {
              const offset = total ? (index - activeReviewIndex + total) % total : 0;
              const isTop = offset === 0;
              return (
                <div
                  key={rev.id}
                  className="card-rotate"
                  role={isTop ? 'button' : undefined}
                  tabIndex={isTop ? 0 : undefined}
                  onClick={isTop ? triggerStackNext : undefined}
                  onKeyDown={isTop ? (e) => { if (e.key === 'Enter' || e.key === ' ') triggerStackNext(); } : undefined}
                  style={{
                    zIndex: total - offset,
                    transform: `translate3d(0px, ${offset * 12}px, -${offset * 35}px) scale(${1 - offset * 0.04})`,
                    opacity: offset > 3 ? 0 : 1,
                    pointerEvents: isTop ? 'auto' : 'none',
                    cursor: isTop ? 'pointer' : 'default',
                  }}
                >
                  <div className="card">
                    <div className="stack-review-card-inner">
                      <div className="stack-media-col">
                        {rev.media_url ? (
                          rev.is_video ? <video src={rev.media_url} autoPlay loop muted playsInline /> : <img src={rev.media_url} alt={rev.outfit} />
                        ) : (
                          <img src="/hero-bg.jpg" alt="Rakesh customer" />
                        )}
                        <span className="stack-media-overlay-tag">VERIFIED PURCHASE</span>
                      </div>
                      <div className="stack-content-col">
                        <div>
                          <div className="stack-review-top">
                            <span className="review-stars">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                            <span className="review-verified-badge">✓ Verified</span>
                          </div>
                          <div className="review-outfit-tag">Piece: {rev.outfit}</div>
                          <p className="review-text-content">&ldquo;{rev.comment}&rdquo;</p>
                        </div>
                        <div className="stack-author-footer">
                          <div className="author-avatar">{rev.name?.charAt(0)}</div>
                          <div>
                            <div className="author-name">{rev.name}</div>
                            <div className="author-city">{rev.city}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
