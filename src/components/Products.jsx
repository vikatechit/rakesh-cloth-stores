import { useStore } from '../context/StoreContext';

export default function Products() {
  const {
    categories,
    filteredProducts,
    activeCategory,
    activePriceTier,
    priceTiers,
    filterStatusText,
    filterCategory,
    setPriceTier,
    resetFilters,
    openProductDetail,
    addToCartDirect,
  } = useStore();

  const categoryPills = [
    { id: 'all', label: 'All Items' },
    ...categories.map((cat) => ({ id: cat.slug, label: cat.title })),
  ];

  return (
    <section className="section-container" id="collections">
      <div className="section-title-block">
        <h2 className="section-heading">CHOOSE YOUR PRICE</h2>
        <div className="section-decorative-divider">◆ ─── ❖ ─── ◆</div>
        <p className="section-subheading">Tap a range — only those sarees and pieces appear. No product-name search needed.</p>
      </div>

      <div className="filter-controls-bar">
        <div className="category-filter-pills">
          {categoryPills.map((pill) => (
            <button
              key={pill.id}
              className={`pill-btn${activeCategory === pill.id ? ' active' : ''}`}
              onClick={() => filterCategory(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>
        <div className="price-tier-row">
          {priceTiers.map((t) => (
            <div
              key={t.id}
              className={`price-tier-btn${activePriceTier === t.id ? ' active' : ''}`}
              onClick={() => setPriceTier(t.id)}
            >
              <strong>{t.title}</strong>
              <span>{t.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="active-filter-status">
        <span>{filterStatusText}</span>
        <button className="reset-filter-btn" onClick={resetFilters}>Show All ✕</button>
      </div>

      <div className="products-luxury-grid">
        {!filteredProducts.length ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--gold-400)' }}>
            <p style={{ fontSize: 20, fontFamily: 'var(--font-display)' }}>No pieces in this price range yet.</p>
            <button className="outline-gold-btn" onClick={resetFilters} style={{ marginTop: 14 }}>
              View Full Catalogue
            </button>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock > 0 && p.stock <= 2;
            const stockClass = isOutOfStock ? 'stock-out' : isLowStock ? 'stock-low' : 'stock-in';
            const stockText = isOutOfStock
              ? 'Currently sold out'
              : isLowStock
                ? `Only ${p.stock} left in stock`
                : `${p.stock} available in stock`;

            return (
              <article className="product-luxury-card" key={p.id}>
                <div className={`product-badge-flag${isLowStock ? ' product-badge-low' : ''}`}>
                  {isOutOfStock ? 'SOLD OUT' : isLowStock ? 'FEW LEFT' : p.badge || 'NEW'}
                </div>
                <div className="product-img-wrapper" onClick={() => openProductDetail(p.id)}>
                  <img src={p.image_url} alt={p.name} loading="lazy" />
                  <div className="product-quickview-overlay">
                    <button className="quickview-btn">VIEW DETAILS ›</button>
                  </div>
                </div>
                <div className="product-details-body">
                  <span className="product-category-tag">{p.category}</span>
                  <h3 className="product-title" onClick={() => openProductDetail(p.id)} style={{ cursor: 'pointer' }}>
                    {p.name}
                  </h3>
                  <div className="product-price-tag">₹{Number(p.price).toLocaleString('en-IN')}</div>
                  <div className={`product-stock-tag ${stockClass}`}>{stockText}</div>
                  <div className="product-card-actions">
                    <button className="add-bag-btn" onClick={() => addToCartDirect(p.id)} disabled={isOutOfStock}>
                      {isOutOfStock ? 'SOLD OUT' : 'ADD TO BAG +'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
