import { useStore } from '../context/StoreContext';

export default function Categories() {
  const { categories, filterCategory } = useStore();

  return (
    <section className="section-container" id="categories">
      <div className="section-title-block">
        <h2 className="section-heading">SHOP BY CATEGORY</h2>
        <div className="section-decorative-divider">◆ ─── ❖ ─── ◆</div>
        <p className="section-subheading">Designer sarees, pattu silks, lehengas, suiting and shirting from Kurmannapalem.</p>
      </div>
      <div className="category-cards-grid rks-category-grid">
        {categories.map((cat) => (
          <button type="button" key={cat.id} className="category-card" onClick={() => filterCategory(cat.slug)}>
            <div className="category-img-holder">
              <img src={cat.image_url} alt={`${cat.title} Collection`} loading="lazy" />
              <div className="category-overlay-gradient" />
            </div>
            <div className="category-content-tag">
              <h3>{cat.title}</h3>
              <span className="category-cta-link">{cat.cta}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
