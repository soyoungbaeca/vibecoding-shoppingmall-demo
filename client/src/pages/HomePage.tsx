import HomeEditorial from '@/components/home/HomeEditorial.tsx'
import FragranceShopSection from '@/components/home/FragranceShopSection.tsx'
import HomeHero from '@/components/home/HomeHero.tsx'
import StoryCarousel from '@/components/StoryCarousel.tsx'

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <FragranceShopSection />
      <HomeEditorial />
      <StoryCarousel />
    </>
  )
}
