import Seo from '../components/Seo';
import CategoriesGrid from '../components/Categories';

export default function Categories() {
  return (
    <>
      <Seo title="Shop by Category | Rakesh Cloth Stores" description="Designer sarees, pattu silks, lehengas, suiting and shirting from Kurmannapalem." />
      <div className="cream-page-band page-pad">
        <CategoriesGrid />
      </div>
    </>
  );
}
