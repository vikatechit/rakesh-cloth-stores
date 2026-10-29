import Seo from '../components/Seo';
import Hero from '../components/Hero';
import Benefits from '../components/Benefits';
import Categories from '../components/Categories';
import Products from '../components/Products';
import HowToOrder from '../components/HowToOrder';
import Reviews from '../components/Reviews';
import Story from '../components/Story';

export default function Home() {
  return (
    <>
      <Seo
        title="Rakesh Cloth Stores | Quality Matters"
        description="Designer sarees, pattu sarees, lehengas, suiting and shirting from Kurmannapalem, Visakhapatnam. WhatsApp order and video confirmation after the store confirms."
      />
      <Hero />
      <Benefits />
      <div className="cream-page-band">
        <Categories />
        <Products />
      </div>
      <HowToOrder />
      <Reviews />
      <Story />
    </>
  );
}
