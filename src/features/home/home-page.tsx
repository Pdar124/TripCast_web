import { CTASection } from '@/features/home/components/cta-section';
import { HeroSection } from '@/features/home/components/hero-section';
import { LiveRecommendationsSection } from '@/features/home/components/live-recommendations-section';
import { ProductWalkthrough } from '@/features/home/components/product-walkthrough';

export function HomePage() {
  return (
    <main>
      <HeroSection />
      <ProductWalkthrough />
      <LiveRecommendationsSection />
      <CTASection />
    </main>
  );
}
