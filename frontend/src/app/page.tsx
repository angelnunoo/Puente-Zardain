'use client'

import HeroSectionFixed from '../components/home/hero-section-fixed'
import StatusBannerFixed from '../components/home/status-banner-fixed'
import KitchenStatusFixed from '../components/home/kitchen-status-fixed'
import ActivitySignalsFixed from '../components/home/activity-signals-fixed'
import PopularProductsFixed from '../components/home/popular-products-fixed'
import MenuSectionFixed from '../components/home/menu-section-fixed'
import ZardasLoyaltyFixed from '../components/home/zardas-loyalty-fixed'
import AboutUsFixed from '../components/home/about-us-fixed'
import Footer from '../components/home/footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section con estado humano - Mobile First */}
      <section className="snap-start">
        <HeroSectionFixed />
      </section>
      
      {/* Banner de mensajes dinámicos - Mobile First */}
      <section className="snap-start">
        <StatusBannerFixed />
      </section>
      
      {/* Estado de la cocina - Mobile First */}
      <section className="snap-start">
        <KitchenStatusFixed />
      </section>
      
      {/* Señales de vida real - Mobile First */}
      <section className="snap-start">
        <ActivitySignalsFixed />
      </section>
      
      {/* Productos populares - Mobile First */}
      <section className="snap-start">
        <PopularProductsFixed />
      </section>
      
      {/* Sección de la carta - Mobile First */}
      <section className="snap-start">
        <MenuSectionFixed />
      </section>
      
      {/* Sistema de fidelización Zardas - Mobile First */}
      <section className="snap-start">
        <ZardasLoyaltyFixed />
      </section>
      
      {/* Sobre nosotros - Mobile First */}
      <section className="snap-start">
        <AboutUsFixed />
      </section>
      
      {/* Footer - Mobile First */}
      <section className="snap-start">
        <Footer />
      </section>
    </main>
  )
}