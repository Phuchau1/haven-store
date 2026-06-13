// ===== LANDING PAGE - Trang chủ =====
import Hero from '@/app/component/Hero';
import TrustBar from '@/app/component/TrustBar';
import CategorySection from '@/app/component/CategorySection';
import NewArrivals from '@/app/component/NewArrivals';
import BestSelling from '@/app/component/BestSelling';
import FlashSale from '@/app/component/FlashSale';
import FeaturesBanner from '@/app/component/FeaturesBanner';
import CustomerReviews from '@/app/component/CustomerReviews';
import Newsletter from '@/app/component/Newsletter';

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <FlashSale />
      <CategorySection />
      <NewArrivals />
      <BestSelling />
      <FeaturesBanner />
      <CustomerReviews />
      <Newsletter />
    </>
  );
}
