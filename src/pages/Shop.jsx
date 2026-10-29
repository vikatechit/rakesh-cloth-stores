import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Seo from '../components/Seo';
import Products from '../components/Products';
import { useStore } from '../context/Store';

export default function Shop() {
  const { slug } = useParams();
  const { setActiveCategory, setPriceTier } = useStore();

  useEffect(() => {
    if (slug) setActiveCategory(slug);
    else {
      setActiveCategory('all');
      setPriceTier('all');
    }
  }, [slug, setActiveCategory, setPriceTier]);

  return (
    <>
      <Seo title="Collections | Rakesh Cloth Stores" description="Browse sarees, pattu, lehengas, suiting and shirting by price range." />
      <div className="cream-page-band page-pad">
        <Products />
      </div>
    </>
  );
}
